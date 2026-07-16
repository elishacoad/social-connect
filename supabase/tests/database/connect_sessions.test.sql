-- Run with: supabase test db  (requires `supabase start`, i.e. Docker running)
--
-- Dedicated coverage for match_connect_session()'s two invariants that were
-- only discovered after shipping, by patching in place rather than by a
-- failing test:
--
--   1. Grant surface (20260716060000 / 20260716060700): a blanket
--      `grant all on all routines` briefly re-exposed handle_new_user() and
--      touch_friendship_on_reply() — trigger-only SECURITY DEFINER
--      functions — as public RPC endpoints. Asserted here directly so a
--      future blanket grant migration fails CI instead of shipping quietly.
--
--   2. Lock order (20260716060500): the original function always locked
--      "the scanned session" first and "my own session" second, which
--      deadlocks when both parties' phones call match_connect_session at
--      the same moment (the expected case for mutual QR connect — "either
--      phone recognizing first completes the connection", docs/product.md).
--      pgTAP runs everything sequentially on one connection, so it cannot
--      reproduce the actual concurrent deadlock. What it CAN pin is the
--      user-facing invariant the fix must preserve: matching succeeds and
--      produces the same friendship whichever party's session calls the
--      RPC first. A regression that reintroduces an asymmetric lock order
--      (e.g. always locking `other_session` before `my_session` again)
--      would still pass this, but a regression that breaks the
--      least/greatest reordering itself — swapping which row is "mine" vs
--      "theirs" — would not.
begin;

select plan(10);

-- ── Setup ────────────────────────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'pgtap-user-c@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'pgtap-user-d@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set username = 'pgtap_user_c', display_name = 'PGTap User C'
  where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set username = 'pgtap_user_d', display_name = 'PGTap User D'
  where id = '44444444-4444-4444-4444-444444444444';

-- ── Grant surface ───────────────────────────────────────────────────────

select ok(
  not has_function_privilege('anon', 'public.match_connect_session(text, uuid)', 'execute'),
  'anon cannot execute match_connect_session'
);

select ok(
  has_function_privilege('authenticated', 'public.match_connect_session(text, uuid)', 'execute'),
  'authenticated can execute match_connect_session'
);

select ok(
  not has_function_privilege('anon', 'public.handle_new_user()', 'execute'),
  'anon cannot execute handle_new_user (trigger-only, must never be RPC-reachable)'
);

select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'authenticated cannot execute handle_new_user (trigger-only, must never be RPC-reachable)'
);

select ok(
  not has_function_privilege('anon', 'public.touch_friendship_on_reply()', 'execute'),
  'anon cannot execute touch_friendship_on_reply (trigger-only, must never be RPC-reachable)'
);

select ok(
  not has_function_privilege('authenticated', 'public.touch_friendship_on_reply()', 'execute'),
  'authenticated cannot execute touch_friendship_on_reply (trigger-only, must never be RPC-reachable)'
);

-- ── Matching succeeds regardless of which party's session calls first ───

reset role;
insert into public.connect_sessions (user_id, token) values
  ('33333333-3333-3333-3333-333333333333', 'pgtap-token-c1'),
  ('44444444-4444-4444-4444-444444444444', 'pgtap-token-d1');

-- D's session calls first, scanning C's token: D is "my_session", C is "other_session".
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"44444444-4444-4444-4444-444444444444"}';

select isnt(
  (select public.match_connect_session('pgtap-token-c1', (select id from public.connect_sessions where token = 'pgtap-token-d1'))),
  null,
  'match succeeds when the second party''s session calls first'
);

reset role;
select results_eq(
  $$select count(*) from public.friendships
    where (user_a_id = '33333333-3333-3333-3333-333333333333' and user_b_id = '44444444-4444-4444-4444-444444444444')
       or (user_b_id = '33333333-3333-3333-3333-333333333333' and user_a_id = '44444444-4444-4444-4444-444444444444')$$,
  ARRAY[1::bigint],
  'friendship exists after the second party''s session calls first'
);

insert into public.connect_sessions (user_id, token) values
  ('33333333-3333-3333-3333-333333333333', 'pgtap-token-c2'),
  ('44444444-4444-4444-4444-444444444444', 'pgtap-token-d2');

-- C's session calls this time, scanning D's token: C is "my_session", D is "other_session".
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333"}';

select isnt(
  (select public.match_connect_session('pgtap-token-d2', (select id from public.connect_sessions where token = 'pgtap-token-c2'))),
  null,
  'match succeeds when the first party''s session calls first'
);

reset role;
select results_eq(
  $$select count(*) from public.friendships
    where (user_a_id = '33333333-3333-3333-3333-333333333333' and user_b_id = '44444444-4444-4444-4444-444444444444')
       or (user_b_id = '33333333-3333-3333-3333-333333333333' and user_a_id = '44444444-4444-4444-4444-444444444444')$$,
  ARRAY[1::bigint],
  'still one friendship row (revived, not duplicated) when the first party''s session calls first'
);

select * from finish();
rollback;
