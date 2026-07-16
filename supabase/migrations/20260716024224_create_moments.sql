create table public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_path text not null,
  caption text check (char_length(caption) <= 140),
  created_at timestamptz not null default now(),
  posted_date date generated always as ((created_at at time zone 'utc')::date) stored,
  unique (author_id, posted_date)
);

alter table public.moments enable row level security;

-- Tightened to friendship-gated visibility once `friendships` exists
-- (superseded in 20260716025705_create_friendships.sql).
create policy "moments_select_authenticated"
  on public.moments for select
  to authenticated
  using (true);

create policy "moments_insert_own"
  on public.moments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "moments_delete_own"
  on public.moments for delete
  to authenticated
  using (author_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('moments', 'moments', false)
on conflict (id) do nothing;

-- Moment media is stored under `${auth.uid()}/filename`, same ownership
-- convention as avatars. Bucket is private — reads go through signed URLs.
create policy "moments_media_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'moments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "moments_media_owner_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'moments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "moments_media_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'moments' and (storage.foldername(name))[1] = auth.uid()::text);
