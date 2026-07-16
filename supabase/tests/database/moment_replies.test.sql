-- Run with: supabase test db (requires Docker / `supabase start`).
-- See docs/testing.md for how to validate this against the live dev DB
-- instead when Docker isn't running.
begin;

select plan(6);

-- Three users: A posts a moment, B is A's friend, C is a stranger.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'pgtap-replies-a@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'pgtap-replies-b@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555',
   'authenticated', 'authenticated', 'pgtap-replies-c@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.friendships (user_a_id, user_b_id, last_physical_at, last_interaction_at)
values ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
  now() - interval '10 days', now() - interval '10 days');

insert into public.moments (id, author_id, media_path)
values ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'a/one.jpg');

-- Stranger C cannot reply to A's moment.
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"55555555-5555-5555-5555-555555555555"}';

select throws_ok(
  $$insert into public.moment_replies (moment_id, author_id, body) values ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'hey')$$,
  '42501',
  null,
  'a stranger cannot reply to a moment they cannot see'
);

-- Friend B can reply.
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"44444444-4444-4444-4444-444444444444"}';

select lives_ok(
  $$insert into public.moment_replies (moment_id, author_id, body) values ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'nice moment')$$,
  'a friend can reply to a visible moment'
);

-- Author A can also reply to their own moment (self-reply must not crash
-- the trigger, since there is no A<->A friendship row to touch).
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333"}';

select lives_ok(
  $$insert into public.moment_replies (moment_id, author_id, body) values ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'thanks!')$$,
  'the moment author can reply to their own moment without the trigger erroring'
);

-- The reply trigger refreshed the A/B friendship's last_interaction_at.
reset role;
select ok(
  (select last_interaction_at > now() - interval '1 minute' from public.friendships
    where user_a_id = '33333333-3333-3333-3333-333333333333' and user_b_id = '44444444-4444-4444-4444-444444444444'),
  'a reply refreshes the replier/author friendship''s last_interaction_at'
);

-- Friend B can see both replies.
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"44444444-4444-4444-4444-444444444444"}';

select results_eq(
  $$select count(*) from public.moment_replies where moment_id = '66666666-6666-6666-6666-666666666666'$$,
  ARRAY[2::bigint],
  'a friend can see all replies on a moment they can see'
);

-- Stranger C sees none.
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"55555555-5555-5555-5555-555555555555"}';

select results_eq(
  $$select count(*) from public.moment_replies where moment_id = '66666666-6666-6666-6666-666666666666'$$,
  ARRAY[0::bigint],
  'a stranger cannot see replies on a moment they cannot see'
);

select * from finish();
rollback;
