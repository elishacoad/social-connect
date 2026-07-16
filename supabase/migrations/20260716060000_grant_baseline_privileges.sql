-- Supabase's hosted platform grants these automatically at project
-- creation, outside of migration history — which is invisible to anything
-- that replays migrations from scratch (a fresh `supabase start` local
-- stack, or a project migrated/self-hosted elsewhere). RLS is the real
-- authorization gate throughout this schema; these are the baseline
-- table-level grants RLS depends on being present in the first place,
-- made explicit so migration history is actually self-contained.
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on routines to anon, authenticated;
