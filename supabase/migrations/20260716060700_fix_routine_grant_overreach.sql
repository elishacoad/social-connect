-- The prior grant_baseline_privileges migration did `grant all on all
-- routines in schema public to anon, authenticated`, which silently
-- re-exposed two trigger-only SECURITY DEFINER functions as public RPC
-- endpoints (/rest/v1/rpc/handle_new_user, /rest/v1/rpc/touch_friendship_on_reply)
-- — undoing two earlier, intentional lockdowns. Trigger-only functions read
-- NEW/OLD and are meaningless (or actively exploitable) called directly.
--
-- Re-revoke them, and replace the blanket future-routine default with a
-- narrower one: new tables/sequences still default to open (matching
-- Supabase's own platform behavior), but new functions do NOT get a blanket
-- EXECUTE grant — each RPC-intended function must opt in explicitly via its
-- own `grant execute ... to authenticated`, same as match_connect_session
-- already does. This prevents any future trigger-only function from being
-- silently exposed the same way.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_friendship_on_reply() from public, anon, authenticated;

alter default privileges in schema public revoke execute on functions from anon, authenticated;
