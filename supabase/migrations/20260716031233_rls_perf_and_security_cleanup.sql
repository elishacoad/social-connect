-- Performance: wrap auth.uid() as (select auth.uid()) in every RLS policy so
-- Postgres evaluates it once per statement instead of once per row.

alter policy "profiles_insert_own" on public.profiles
  with check ((select auth.uid()) = id);

alter policy "profiles_update_own" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "moments_insert_own" on public.moments
  with check (author_id = (select auth.uid()));

alter policy "moments_delete_own" on public.moments
  using (author_id = (select auth.uid()));

alter policy "moments_select_own_or_active_friend" on public.moments
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.active_friendships f
      where (f.user_a_id = (select auth.uid()) and f.user_b_id = author_id)
         or (f.user_b_id = (select auth.uid()) and f.user_a_id = author_id)
    )
  );

alter policy "friendships_select_own" on public.friendships
  using ((select auth.uid()) = user_a_id or (select auth.uid()) = user_b_id);

alter policy "connect_sessions_select_own" on public.connect_sessions
  using ((select auth.uid()) = user_id);

alter policy "connect_sessions_insert_own" on public.connect_sessions
  with check ((select auth.uid()) = user_id);

alter policy "connect_sessions_cancel_own" on public.connect_sessions
  using ((select auth.uid()) = user_id and status = 'waiting');

alter policy "connection_events_select_own" on public.connection_events
  using (
    exists (
      select 1 from public.friendships f
      where f.id = friendship_id
        and (f.user_a_id = (select auth.uid()) or f.user_b_id = (select auth.uid()))
    )
  );

-- Performance: cover every FK with an index.
create index if not exists connect_sessions_user_id_idx on public.connect_sessions (user_id);
create index if not exists connect_sessions_matched_with_session_id_idx on public.connect_sessions (matched_with_session_id);
create index if not exists connection_events_friendship_id_idx on public.connection_events (friendship_id);
create index if not exists connection_events_initiated_by_idx on public.connection_events (initiated_by);
create index if not exists friendships_user_b_id_idx on public.friendships (user_b_id);

-- Security: avatars bucket is already `public = true`, which serves object
-- GETs without any RLS check — this SELECT policy was redundant and only
-- added the ability to LIST every file in the bucket via the storage API.
drop policy "avatars_public_read" on storage.objects;

-- Security: handle_new_user is a trigger-only function (reads NEW, which
-- doesn't exist outside a trigger context) but was still exposed as a
-- callable RPC endpoint by default. Lock it down to the trigger mechanism.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Security: match_connect_session is meant for authenticated callers only —
-- Postgres grants EXECUTE to PUBLIC by default on function creation, which
-- included anon. Explicitly revoke it (the authenticated grant stays).
revoke execute on function public.match_connect_session(text, uuid) from public, anon;
