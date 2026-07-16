create table public.connect_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'expired', 'cancelled')),
  matched_with_session_id uuid references public.connect_sessions(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes'
);

alter table public.connect_sessions enable row level security;

create policy "connect_sessions_select_own"
  on public.connect_sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "connect_sessions_insert_own"
  on public.connect_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "connect_sessions_cancel_own"
  on public.connect_sessions for update
  to authenticated
  using (auth.uid() = user_id and status = 'waiting')
  with check (status = 'cancelled');

create table public.connection_events (
  id uuid primary key default gen_random_uuid(),
  friendship_id uuid not null references public.friendships(id) on delete cascade,
  initiated_by uuid not null references public.profiles(id),
  event_type text not null default 'connect',
  created_at timestamptz not null default now()
);

alter table public.connection_events enable row level security;

create policy "connection_events_select_own"
  on public.connection_events for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.id = friendship_id
        and (f.user_a_id = auth.uid() or f.user_b_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.connect_sessions;
