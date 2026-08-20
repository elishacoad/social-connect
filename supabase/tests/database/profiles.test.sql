-- Run with: supabase test db (requires Docker / `supabase start`).
-- See docs/testing.md for how to validate this against the live dev DB
-- instead when Docker isn't running.
begin;

select plan(8);

-- Four users. A and B are friends. A and D had a friendship that was removed.
-- C is a stranger to A, but replies on a moment of B's that A can see, which
-- is the friend-of-a-friend case the policy has to keep visible.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'authenticated', 'authenticated', 'pgtap-profiles-a@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'authenticated', 'authenticated', 'pgtap-profiles-b@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'authenticated', 'authenticated', 'pgtap-profiles-c@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'authenticated', 'authenticated', 'pgtap-profiles-d@test.internal',
   crypt('password', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set username = 'pgtap_a' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.friendships (user_a_id, user_b_id, last_physical_at, last_interaction_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   now() - interval '5 days', now() - interval '5 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   now() - interval '5 days', now() - interval '5 days');

-- A removed friendship must still resolve the name in the drifted section.
insert into public.friendships (user_a_id, user_b_id, last_physical_at, last_interaction_at, removed_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  now() - interval '5 days', now() - interval '5 days', now());

insert into public.moments (id, author_id, media_path)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b/one.jpg');

insert into public.moment_replies (moment_id, author_id, body)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'nice one');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

select is(
  (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1::bigint,
  'a user can read their own profile'
);

select is(
  (select count(*) from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1::bigint,
  'a user can read the profile of an active friend'
);

select is(
  (select count(*) from public.profiles where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  0::bigint,
  'a removed friendship does not keep the profile readable'
);

select is(
  (select count(*) from public.profiles where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1::bigint,
  'a non-friend who replied on a visible moment stays readable'
);

-- D is a stranger to C: no friendship, no shared reply thread.
set local "request.jwt.claims" = '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd"}';

select is(
  (select count(*) from public.profiles where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0::bigint,
  'a stranger profile is not readable'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'an unconnected user cannot enumerate the profile table'
);

-- Username availability still has to see past the read policy.
select is(
  public.is_username_available('pgtap_a'),
  false,
  'a username taken by an unreadable profile still reports as taken'
);

select is(
  public.is_username_available('pgtap_definitely_unused'),
  true,
  'an unused username reports as available'
);

select * from finish();
rollback;
