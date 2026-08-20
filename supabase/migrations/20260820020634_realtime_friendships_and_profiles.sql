-- Only moments, moment_replies and connect_sessions were published, so a new
-- friendship (or a fade transition, removal, or interaction bump) never
-- reached the other person's device, and profile edits never propagated at
-- all. RLS still filters every realtime payload per subscriber, so publishing
-- these two adds no read surface beyond what select already allows.
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.profiles;

-- friendships is the one table clients subscribe to with a per-row interest
-- (which side of the pair is me). The default replica identity ships only the
-- primary key in the old record, which is not enough for realtime to evaluate
-- a filter on user_a_id/user_b_id — or to deliver a meaningful DELETE payload.
alter table public.friendships replica identity full;
