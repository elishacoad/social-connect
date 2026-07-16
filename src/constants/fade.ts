// MVP defaults for open question #12 (fade/decay model) — revisit once
// tested with real usage. Mirrored in the `active_friendships` SQL view
// (see the create_friendships migration); keep both in sync.
export const FADE_PHYSICAL_DAYS = 270;
export const FADE_INTERACTION_DAYS = 90;
