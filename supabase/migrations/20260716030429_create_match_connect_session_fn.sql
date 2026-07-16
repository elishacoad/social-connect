create or replace function public.match_connect_session(scanned_token text, my_session_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  my_session public.connect_sessions;
  other_session public.connect_sessions;
  a uuid;
  b uuid;
  result_friendship_id uuid;
begin
  select * into my_session from public.connect_sessions
    where id = my_session_id and user_id = auth.uid() and status = 'waiting' and expires_at > now();
  if my_session is null then
    raise exception 'your connect session is invalid or expired';
  end if;

  select * into other_session from public.connect_sessions
    where token = scanned_token and status = 'waiting' and expires_at > now()
    for update;
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

grant execute on function public.match_connect_session(text, uuid) to authenticated;
