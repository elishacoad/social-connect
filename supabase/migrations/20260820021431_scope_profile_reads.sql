-- profiles_select_authenticated was `using (true)`: any signed-in user could
-- read every profile in the system — username, display name, bio, avatar — and
-- enumerate the whole user base. For a product whose thesis is a small, quiet
-- circle, the directory should be as small as the circle.
--
-- Three ways a profile becomes visible, matching what the UI actually renders:
--   1. It's you.
--   2. You share a friendship — including a faded one, since the drifted
--      section still shows those names.
--   3. They replied to a moment you can see. A friend-of-a-friend can land in
--      your reply threads without being your friend, and their name already
--      renders there today; scoping reads must not silently blank it out.
drop policy "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_self_or_connected"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where f.removed_at is null
        and (
          (f.user_a_id = (select auth.uid()) and f.user_b_id = profiles.id)
          or (f.user_b_id = (select auth.uid()) and f.user_a_id = profiles.id)
        )
    )
    or exists (
      select 1
      from public.moment_replies r
      join public.moments m on m.id = r.moment_id
      where r.author_id = profiles.id
        and (
          m.author_id = (select auth.uid())
          or exists (
            select 1 from public.active_friendships af
            where (af.user_a_id = (select auth.uid()) and af.user_b_id = m.author_id)
               or (af.user_b_id = (select auth.uid()) and af.user_a_id = m.author_id)
          )
        )
    )
  );

-- Signup and profile editing need to know whether a username is taken, which
-- is the one legitimate reason to consult a profile you cannot read. Answering
-- it behind SECURITY DEFINER leaks a single boolean instead of re-opening the
-- whole table. (Probing one username at a time is inherent to the feature; row
-- enumeration is not.)
create or replace function public.is_username_available(candidate text, exclude_id uuid default null)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles
    where username = candidate
      and (exclude_id is null or id <> exclude_id)
  );
$$;

revoke execute on function public.is_username_available(text, uuid) from public, anon;
grant execute on function public.is_username_available(text, uuid) to authenticated;
