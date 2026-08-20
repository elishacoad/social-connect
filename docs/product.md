# Product

## Core Loop

The smallest meaningful repeated behavior:

1. Meet friend IRL
2. Reconnect / bump
3. Relationship refreshed
4. Share lightweight moment
5. See friends' moments
6. Reply / connect
7. Leave app

If this loop feels emotionally satisfying, the app works. If not, nothing else matters.

## Social Behavior

- All relationships are mutual (no followers, no one-way following)
- Connections are intentional, reciprocal, mutual
- You add each other simultaneously
- No mass importing / following behavior

## Connection / Reconnection System

### Reconnection Hierarchy

**Strong refresh:**

- Physical meetup / bump (strongest signal)

**Medium refresh:**

- Direct interaction, replies, meaningful communication

**Weak or no refresh:**

- Passive viewing / lurking

The app rewards presence over consumption.

### Connection Flow (Mutual QR)

1. Both users open "Connect"
2. Front-facing camera opens
3. Each phone displays a dynamic QR code
4. Users point phones at each other
5. Either phone recognizing first completes the connection
6. Both receive shared success state

Front camera makes the interaction social and human. Users see each other, make eye contact, interact naturally.

Both people must intentionally participate. No passive location tracking. No automatic nearby detection. Connection requires shared action and consent.

(This "no passive tracking" principle applies to new connections. Reconnecting with an existing friend now works differently — see Reconnection Method below.)

### Reconnection Method (Location-Based)

New connections always use the mutual QR ritual above. Reconnecting with someone you're already friends with works differently:

1. The app detects when you're near an existing friend (background location/proximity)
2. You get a notification, but there's no pressure to act on it right away
3. The app holds onto the "you were near this friend" knowledge for the rest of the day, so you can take the reconnect action whenever it's convenient — not necessarily in the moment
4. Reconnecting itself is still a manual, intentional action; proximity detection only surfaces the opportunity, it doesn't refresh the relationship automatically
5. There's a cooldown: a reconnect only refreshes the relationship if it's been at least one month since you last reconnected with that friend. Reconnecting again sooner has no benefit, and you won't get a proximity notification for a friend you've already reconnected with that month
6. Reconnecting more than once in the same day does nothing extra
7. Reconnecting again after the one-month cooldown may unlock a small optional bonus later — not required, not yet designed

This replaces the "share one technical flow" MVP default from `decisions.md` (2026-07-16) — new connections and reconnections now use genuinely different mechanisms, not just different copy on the same flow. Resolves open question #10 with a new direction; see `decisions.md` (2026-07-23).

## Friend Drift / Fade System

Relationships fade softly over time if not maintained. This is the core bet of the product.

### Principles

- Not punitive, not gamified
- The feeling should be natural drift, memory, distance, softness
- NOT punishment, streak loss, or guilt
- Fading affects presence, not existence (people don't disappear completely)

### How Fading Works

- Not a single timestamp — relationship freshness is influenced by the reconnection hierarchy:
  - Physical meetups have the strongest refresh effect
  - Direct interactions (replies, meaningful communication) have a medium refresh effect
  - Passive viewing has little to no effect
- The exact weighting and decay model is an open question (see #12)
- Active relationships appear in main feed
- Once a relationship hits the fade cutoff, it becomes "fully faded" and no longer appears in the main feed (binary, not gradual)
- Fully faded friends are still accessible intentionally (profile search, drift layer, archive)

### Reconnection

When reconnecting:

- Color returns, sharpness restored
- This should feel emotionally satisfying

## Posting / "Moments"

### Philosophy

Posting should be immediate, lightweight, authentic, non-performative. Goal: make it fun to share, but get users back into real life quickly.

### Flow

1. Open app
2. Camera available immediately
3. Capture moment
4. Optional tiny caption (1-2 sentences)
5. Post
6. Leave app

Total interaction: ~10-15 seconds.

### Constraints

- In-app camera only
- No filters
- One post per day?
- One take only?
- No editing after posting?

See open question #13 for undecided posting constraints.

### Polaroid / Development Concept (Open Question)

Possible direction: after capture, no preview — moment "develops" with soft delay/animation and gradual reveal. Would reinforce imperfection, acceptance, presence, commitment, anti-optimization. Should feel calming and ceremonial, not like artificial loading. See open question #8.

### Media Type (Open Question)

Picture only? Short video? Live Photo? Needs to balance richness with friction and production pressure. See open question #9.

### Language

Avoid "posts" and "content." Prefer: moments, signals, check-ins, updates.

## Feed

- Chronological, finite, calm, intimate, non-algorithmic
- No infinite scroll, no recommended content, no engagement optimization
- Ideal outcome: "I've seen everything. I'm done."
- Feed exhaustion is intentional
- Feed-first with immediate camera access on home screen

## Interactions

- No likes (likes create optimization, hierarchy, performance behavior)
- Direct replies encouraged (actual communication, deeper relationships)
- Possible reply types: short text, quick reactions, photo replies, voice notes (open question #11)
- Should not become another messaging app

## Friend Ordering

- Dynamic ordering by recent reconnection, interaction, relationship presence
- Implies "who is currently present in your life," not "who matters most"
- No friendship scores, percentages, best friend labels, or rankings
- Users should feel relationship closeness, not calculate it

## Profiles

- Should NOT become curated identities or aesthetic portfolios
- Should feel like living memory collections or relationship timelines
- Potential friction around scrolling far back to prevent obsessive curation
- Could include: post history, bio, favorite activities/interests, "ask me about..." prompts

## Relationship Removal

- Removes connection mutually, quietly, no notifications, no drama
- Drift solves most relationship maintenance naturally
- Explicit removal should become rare

## Year in Review (Future)

Annual reflective recap of relationships, moments, reconnections, memories. Nostalgic, warm, human, reflective. Celebrates presence and relationships, not app usage metrics. Annual only, should feel ceremonial. Parked for post-MVP.

---

## MVP Scope

### Must Have

- Auth + profiles
- Mutual QR connect flow (new connections)
- Location-based reconnect detection + notification, with manual reconnect action and a one-month cooldown (existing friends)
- Moment capture and posting (in-app camera, no filters)
- Chronological feed
- Fading / drift visuals
- Direct replies
- Fully faded section

### Exclude for Now

- Yearly review / wrapped
- Advanced profiles
- Complex messaging
- AI features
- Location systems beyond proximity-based reconnect detection (see Reconnection Method above)
- Recommendation systems
- Deep customization
- Push notifications, except the proximity reconnect alert above (general push add later)
- Long-distance reconnection systems

---

## Open Questions

1. ~~**Bump/reconnect technology**~~ - Reconnect now has a new direction: background location/proximity detection + notification, with the actual reconnect action taken manually (possibly deferred to later in the day) and a one-month cooldown per friend. QR remains for new connections only. See `decisions.md` (2026-07-23). Still open: which iOS/Android APIs (geofencing vs. significant-location-change), battery impact, and how long the "was nearby" state should be held before it expires.

2. **Long-distance friendships** - How to handle friends who can't meet physically? Need balance between rewarding physical presence and not punishing distance/adult life. May need medium-strength digital interaction refreshes.

3. **Home screen UX** - Feed-first? Camera-first? Hybrid? How prominent should posting be?

4. **Messaging depth** - How much messaging exists? Balance meaningful interaction vs. becoming another chat app.

5. ~~**Drift layer UX**~~ - Resolved with an MVP default — see `decisions.md`. Still open: whether the name/placement holds up once used for real.

6. **Memory resurfacing** - Could occasionally surface old moments or drifted relationships. Must avoid manipulation or guilt.

7. **Profile depth** - How much history visible? How much friction for scrolling back? Archival or present-focused?

8. **Polaroid develop effect** - Should moments "develop" like a Polaroid with no preview and a gradual reveal? Reinforces imperfection and commitment, but adds friction. How long is the delay? Is it just visual or does it hide the moment from others too?

9. **Media type** - Picture only? Short video? Live Photo? What formats are allowed for moments? Video adds richness but increases friction, storage, and production pressure.

10. ~~**Reconnection UX**~~ - Resolved: reconnection uses location-based proximity detection + a deferrable notification instead of the shared QR flow — see `decisions.md` (2026-07-23), supersedes the 2026-07-16 "one technical flow" default. Still open: exact cooldown-expiry copy, and whether the optional post-cooldown bonus is worth building.

11. **Voice notes** - Are voice notes supported as a reply type or standalone interaction? They add warmth and intimacy but increase complexity and could push the app toward becoming a messaging platform.

12. ~~**Fade/decay model**~~ - Resolved with an MVP default (linear per-signal decay, binary cutoff) — see `decisions.md`. Still open: whether the weighting/curve feels right once tested.

13. **Posting constraints** - No posting-frequency cap — the one-post-per-day limit was tried and reverted, see `decisions.md`. Caption editing and deletion are now allowed (author-only), enforced at the DB layer. Still undecided: one take only (no retakes)?

14. ~~**Fade timeline**~~ - Resolved with an MVP default (270 days physical / 90 days any interaction) — see `decisions.md`. Still open: whether these numbers hold up once tested with real usage.

15. **Invite-only launch** - Should the app be invite-only? Benefits: intentional growth, stronger culture, exclusivity, clustered real-world adoption. Risks: cold start problem, slower growth. How many invites per user? Can invites expire?

16. **Monetization** - Donation-based model? If so, what do donors get (rewards, banners, tags)? Or free forever? Too early to decide but worth tracking.
