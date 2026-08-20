-- Same root cause as fix_routine_grant_overreach: `grant all on all routines
-- in schema public` swept up rls_auto_enable(), a Supabase platform event
-- trigger that auto-enables RLS on new public tables. That cleanup revoked
-- handle_new_user and touch_friendship_on_reply but missed this one, leaving
-- it exposed at /rest/v1/rpc/rls_auto_enable to anon as well as authenticated.
--
-- Calling it over the API fails anyway — pg_event_trigger_ddl_commands() only
-- works inside an event trigger — so this closes a lint, not a live hole. It
-- is still the last routine in the schema granted more broadly than intended.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
