create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  last_physical_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint friendships_ordered_pair check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Rows are only written via the Phase 4 SECURITY DEFINER match function —
-- no direct client insert/update policy.

-- Active = not removed, and either a physical meetup in the last 270 days
-- or any interaction in the last 90 days. Values mirror src/constants/fade.ts.
create view public.active_friendships
with (security_invoker = true) as
select *
from public.friendships
where removed_at is null
  and (
    last_physical_at > now() - interval '270 days'
    or last_interaction_at > now() - interval '90 days'
  );

-- Feed visibility: a moment is visible to its author, or to the other party
-- in an active friendship with the author.
drop policy "moments_select_authenticated" on public.moments;

create policy "moments_select_own_or_active_friend"
  on public.moments for select
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.active_friendships f
      where (f.user_a_id = auth.uid() and f.user_b_id = author_id)
         or (f.user_b_id = auth.uid() and f.user_a_id = author_id)
    )
  );

-- Storage reads follow the same rule as the moments table.
drop policy "moments_media_owner_select" on storage.objects;

create policy "moments_media_visible_to_owner_or_active_friend"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'moments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.active_friendships f
        where (f.user_a_id = auth.uid() and f.user_b_id::text = (storage.foldername(name))[1])
           or (f.user_b_id = auth.uid() and f.user_a_id::text = (storage.foldername(name))[1])
      )
    )
  );
