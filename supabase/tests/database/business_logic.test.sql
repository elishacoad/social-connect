-- Run with: supabase test db  (requires `supabase start`, i.e. Docker running)
--
-- Covers the business rules that are easy to get subtly wrong and hard to
-- catch by eyeballing the SQL: the one-moment-per-day constraint, the QR
-- connect RPC's matching logic, and the fade cutoff gating both the feed
-- and the friends list identically. Wrapped in BEGIN/ROLLBACK so nothing
-- here ever touches real data.
begin;

select plan(11);

-- ── Setup: two real auth.users + profiles, bypassing RLS as the test role ──

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'pgtap-user-a@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'pgtap-user-b@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set username = 'pgtap_user_a', display_name = 'PGTap User A'
  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set username = 'pgtap_user_b', display_name = 'PGTap User B'
  where id = '22222222-2222-2222-2222-222222222222';

-- ── One moment per day ──────────────────────────────────────────────────

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$insert into public.moments (author_id, media_path) values ('11111111-1111-1111-1111-111111111111', 'a/one.jpg')$$,
  'first moment of the day succeeds'
);

select throws_ok(
  $$insert into public.moments (author_id, media_path) values ('11111111-1111-1111-1111-111111111111', 'a/two.jpg')$$,
  '23505',
  'duplicate key value violates unique constraint "moments_author_id_posted_date_key"',
  'a second moment the same day is rejected by the unique(author_id, posted_date) constraint'
);

-- ── Visibility before any friendship exists ────────────────────────────

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select results_eq(
  $$select count(*) from public.moments where author_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY[0::bigint],
  'a stranger cannot see another user''s moment before they are friends'
);

-- ── Connect flow ────────────────────────────────────────────────────────

reset role;
insert into public.connect_sessions (user_id, token) values
  ('11111111-1111-1111-1111-111111111111', 'pgtap-token-a'),
  ('22222222-2222-2222-2222-222222222222', 'pgtap-token-b');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select throws_ok(
  $$select public.match_connect_session('does-not-exist', (select id from public.connect_sessions where token = 'pgtap-token-b'))$$,
  'P0001',
  'that code is invalid or expired',
  'scanning an unknown/expired token is rejected'
);

select isnt(
  (select public.match_connect_session('pgtap-token-a', (select id from public.connect_sessions where token = 'pgtap-token-b'))),
  null,
  'matching a real token returns a friendship id'
);

-- Neither party's own RLS can see the other's connect_sessions row (by
-- design — connect_sessions_select_own is `user_id = auth.uid()` only), so
-- checking BOTH rows requires bypassing RLS, same as an admin/support view would.
reset role;
select results_eq(
  $$select status from public.connect_sessions where token in ('pgtap-token-a', 'pgtap-token-b') order by token$$,
  ARRAY['matched', 'matched'],
  'both sessions are marked matched, not just the scanning side'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select results_eq(
  $$select count(*) from public.moments where author_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY[1::bigint],
  'the moment becomes visible to the new friend immediately after connecting'
);

-- ── Self-connect is rejected ────────────────────────────────────────────

reset role;
insert into public.connect_sessions (user_id, token) values
  ('11111111-1111-1111-1111-111111111111', 'pgtap-token-a-self');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$select public.match_connect_session('pgtap-token-a-self', (select id from public.connect_sessions where token = 'pgtap-token-a-self'))$$,
  'P0001',
  'cannot connect with yourself',
  'a session cannot match against itself'
);

-- ── Fade cutoff gates visibility identically to the friends list ──────

reset role;
update public.friendships
  set last_physical_at = now() - interval '300 days', last_interaction_at = now() - interval '100 days'
  where (user_a_id = '11111111-1111-1111-1111-111111111111' and user_b_id = '22222222-2222-2222-2222-222222222222')
     or (user_b_id = '11111111-1111-1111-1111-111111111111' and user_a_id = '22222222-2222-2222-2222-222222222222');

select results_eq(
  $$select count(*) from public.active_friendships
    where (user_a_id = '11111111-1111-1111-1111-111111111111' and user_b_id = '22222222-2222-2222-2222-222222222222')
       or (user_b_id = '11111111-1111-1111-1111-111111111111' and user_a_id = '22222222-2222-2222-2222-222222222222')$$,
  ARRAY[0::bigint],
  'a friendship past both the physical and interaction windows drops out of active_friendships'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select results_eq(
  $$select count(*) from public.moments where author_id = '11111111-1111-1111-1111-111111111111'$$,
  ARRAY[0::bigint],
  'the moment disappears from the fully-faded friend''s view — feed and friends list must agree'
);

-- Reconnecting should revive the same friendship row, not duplicate it.
reset role;
insert into public.connect_sessions (user_id, token) values
  ('11111111-1111-1111-1111-111111111111', 'pgtap-token-a-reconnect'),
  ('22222222-2222-2222-2222-222222222222', 'pgtap-token-b-reconnect');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select public.match_connect_session(
  'pgtap-token-a-reconnect',
  (select id from public.connect_sessions where token = 'pgtap-token-b-reconnect')
);

reset role;
select results_eq(
  $$select count(*) from public.friendships
    where (user_a_id = '11111111-1111-1111-1111-111111111111' and user_b_id = '22222222-2222-2222-2222-222222222222')
       or (user_b_id = '11111111-1111-1111-1111-111111111111' and user_a_id = '22222222-2222-2222-2222-222222222222')$$,
  ARRAY[1::bigint],
  'reconnecting revives the existing friendship instead of creating a duplicate row'
);

select * from finish();
rollback;
