-- Product decision: allow editing a moment's caption after posting (reopens
-- the "no editing" half of open question #13 — see docs/decisions.md).
-- Author-only, caption-only: column-level grant blocks changing media_path/
-- author_id/created_at even if a client sends them, regardless of the RLS
-- policy below.
revoke update on public.moments from authenticated;
grant update (caption) on public.moments to authenticated;

create policy "moments_update_own_caption"
  on public.moments for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
