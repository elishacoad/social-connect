# Decisions

Running log of resolved product and technical decisions.

| Date | Decision | Context |
|------|----------|---------|
| 2026-05-27 | Mutual front-facing QR code for connection flow | Feels social and human; both users participate intentionally; cross-platform compatible |
| 2026-05-27 | In-app camera only, no filters | Constraints drive authenticity; "capture a moment, then go live it". Other constraints (one per day, one take, no editing) are open question #13 |
| 2026-05-27 | No likes, direct replies only | Likes create optimization/hierarchy; replies encourage real communication |
| 2026-05-27 | Chronological feed, no algorithm | Finite and exhaustible; respect attention |
| 2026-05-27 | Expo + Supabase stack | Fastest serious stack for MVP without overengineering |
| 2026-05-27 | Fading influenced by interaction type, not a single timestamp | Physical > direct interaction > passive viewing; exact weighting/decay model is open question #12 |
| 2026-05-27 | All relationships mutual | No followers, no audiences, no one-way dynamics |
| 2026-07-16 | New connection and reconnection share one technical flow | Same QR generation + `match_connect_session` match on both; new connections get the full ritual (Friends tab entry, prominent copy), reconnects get a lighter version (entry from a friend's profile, quieter success). Resolves open question #10. One backend path instead of two — MVP default, revisit if reconnecting still feels heavy in practice |
| 2026-07-16 | Replies live on a dedicated moment screen, not inline on feed cards | Keeps the Timeline list lightweight and gives replies room; costs an extra tap. Supersedes design.md's earlier "inline" note under Feed |
| 2026-07-16 | Drifted/faded friends section is labeled "Drifted," reached via a link at the bottom of the Friends list | Matches product.md's own vocabulary; kept off the bottom tab bar so it doesn't compete with the "living" list. Resolves open question #5 — MVP default, naming can still change |
| 2026-07-16 | Fade cutoff: binary at 270 days since last physical meetup OR 90 days since any interaction (whichever is longer) | MVP placeholder numbers, not yet tested with real usage — see open questions #12 and #14. Implemented as tunable constants (`src/constants/fade.ts`, mirrored in the `active_friendships` SQL view) specifically so they're cheap to retune |
| 2026-07-16 | One moment per author per calendar day, enforced by a DB constraint | Partially resolves open question #13. "One take only" and "no editing" are enforced as client-side UX only (no retake button, no edit screen) — not backed by a DB constraint, so still effectively undecided at the data layer |
| 2026-07-16 | Auth is email + password only, no social sign-in for MVP | Avoids Apple Developer / Google Cloud OAuth setup cost before first on-device test; social providers can be added later without restructuring since Supabase auth supports multiple providers per user |
| 2026-07-16 | Reverted: one-moment-per-day limit removed, no posting-frequency cap | Reopens open question #13 — the DB constraint and its `posted_date` column are dropped entirely rather than just hidden in the UI |
| 2026-07-16 | Reverted: authors can edit a moment's caption and delete a moment after posting | Further reopens open question #13's "no editing" stance. Caption edits are enforced author-only and caption-only at the DB layer via a column-level `grant update (caption)` (not just RLS), so a client can't smuggle a `media_path`/`author_id` change through an edit call. Delete already existed at the DB layer (`moments_delete_own`); this just exposes it in the UI |
