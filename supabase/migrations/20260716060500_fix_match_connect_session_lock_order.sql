-- match_connect_session previously took a `for update` lock only on the
-- scanned session (other_session), then updated its own session afterward.
-- When two people scan each other within the same window (the normal,
-- expected case for mutual QR connect), each transaction locks the *other*
-- party's row first and then blocks trying to update its own row, which the
-- other transaction is simultaneously trying to lock — a lock-order
-- inversion that deadlocks. Postgres kills one side with a raw
-- "deadlock detected" error.
--
-- Fix: always lock both session rows in a fixed order (ascending id),
-- regardless of which one is "mine" vs "theirs", so two concurrent calls
-- over the same pair of sessions can never form a wait cycle.
create or replace function public.match_connect_session(scanned_token text, my_session_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  my_session public.connect_sessions;
  other_session public.connect_sessions;
  other_session_id uuid;
  lock_first uuid;
  lock_second uuid;
  a uuid;
  b uuid;
  result_friendship_id uuid;
begin
  select id into other_session_id from public.connect_sessions
    where token = scanned_token and status = 'waiting' and expires_at > now();
  if other_session_id is null then
    raise exception 'that code is invalid or expired';
  end if;

  lock_first := least(my_session_id, other_session_id);
  lock_second := greatest(my_session_id, other_session_id);

  -- Locking in a fixed, id-based order (instead of "mine, then theirs") is
  -- what breaks the deadlock cycle between two concurrent mutual scans.
  perform 1 from public.connect_sessions where id = lock_first for update;
  perform 1 from public.connect_sessions where id = lock_second for update;

  select * into my_session from public.connect_sessions
    where id = my_session_id and user_id = auth.uid() and status = 'waiting' and expires_at > now();
  if my_session is null then
    raise exception 'your connect session is invalid or expired';
  end if;

  select * into other_session from public.connect_sessions
    where id = other_session_id and status = 'waiting' and expires_at > now();
  if other_session is null then
    raise exception 'that code is invalid or expired';
  end if;

  if other_session.user_id = auth.uid() then
    raise exception 'cannot connect with yourself';
  end if;

  update public.connect_sessions
    set status = 'matched', matched_with_session_id = other_session.id
    where id = my_session.id;
  update public.connect_sessions
    set status = 'matched', matched_with_session_id = my_session.id
    where id = other_session.id;

  a := least(auth.uid(), other_session.user_id);
  b := greatest(auth.uid(), other_session.user_id);

  insert into public.friendships (user_a_id, user_b_id, last_physical_at, last_interaction_at, removed_at)
  values (a, b, now(), now(), null)
  on conflict (user_a_id, user_b_id)
  do update set last_physical_at = now(), last_interaction_at = now(), removed_at = null
  returning id into result_friendship_id;

  insert into public.connection_events (friendship_id, initiated_by, event_type)
  values (result_friendship_id, auth.uid(), 'connect');

  return result_friendship_id;
end;
$$;

revoke execute on function public.match_connect_session(text, uuid) from public, anon;
grant execute on function public.match_connect_session(text, uuid) to authenticated;
