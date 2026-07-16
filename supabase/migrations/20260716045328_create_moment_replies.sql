create table public.moment_replies (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.moment_replies enable row level security;

-- A reply is visible/insertable by anyone who can already see the parent
-- moment (the moment's own author, or an active friend of theirs) — same
-- visibility rule as moments themselves, just one join deeper.
create policy "moment_replies_select_if_can_see_moment"
  on public.moment_replies for select
  to authenticated
  using (
    exists (
      select 1 from public.moments m
      where m.id = moment_id
        and (
          m.author_id = (select auth.uid())
          or exists (
            select 1 from public.active_friendships f
            where (f.user_a_id = (select auth.uid()) and f.user_b_id = m.author_id)
               or (f.user_b_id = (select auth.uid()) and f.user_a_id = m.author_id)
          )
        )
    )
  );

create policy "moment_replies_insert_if_can_see_moment"
  on public.moment_replies for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.moments m
      where m.id = moment_id
        and (
          m.author_id = (select auth.uid())
          or exists (
            select 1 from public.active_friendships f
            where (f.user_a_id = (select auth.uid()) and f.user_b_id = m.author_id)
               or (f.user_b_id = (select auth.uid()) and f.user_a_id = m.author_id)
          )
        )
    )
  );

create index moment_replies_moment_id_idx on public.moment_replies (moment_id);
create index moment_replies_author_id_idx on public.moment_replies (author_id);

-- A reply is a "direct interaction" signal in the fade model — refresh the
-- (replier, moment-author) friendship's last_interaction_at automatically,
-- same reasoning as the on_auth_user_created trigger: this is a data
-- invariant, not a UI concern, so it belongs at the DB layer regardless of
-- what inserts the row.
create or replace function public.touch_friendship_on_reply()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  moment_author uuid;
  a uuid;
  b uuid;
begin
  select author_id into moment_author from public.moments where id = new.moment_id;

  if moment_author is null or moment_author = new.author_id then
    return new;
  end if;

  a := least(new.author_id, moment_author);
  b := greatest(new.author_id, moment_author);

  update public.friendships
    set last_interaction_at = now(), removed_at = null
    where user_a_id = a and user_b_id = b;

  return new;
end;
$$;

create trigger on_moment_reply_created
  after insert on public.moment_replies
  for each row execute function public.touch_friendship_on_reply();

alter publication supabase_realtime add table public.moment_replies;
