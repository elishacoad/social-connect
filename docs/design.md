# Design

**Implementation status:** the app currently renders in React Native Reusables' stock neutral/gray theme, not the warm/tactile direction below — that's unstarted visual design work, not a decision to keep it neutral. Fade visuals are implemented as plain opacity dimming for the same reason (grain/desaturation/texture below are still open). Swap the CSS variables in `global.css` and `tailwind.config.js` when ready to start on the real palette.

## Overall Aesthetic

- Tactile, film-like, warm, authentic, nostalgic, soft, temporal
- Polaroid / film photography / faded memories / warm textures
- Make what you see on the app as real as possible
- Mimic real life as much as possible

### Avoid

- Hyper-clean startup UI
- Glossy modern social aesthetics
- Gamified visuals

## Fade Visual Effects

As relationships drift:

- Lower saturation
- Memory-like feeling
- Film grain?
- Softer contrast?
- Slight opacity reduction?
- Softer texture?

Recent relationships: vivid, warm, sharp, colorful.
Older relationships: muted, nostalgic, quieter, softer.

## Core UX Flows

### Onboarding

- Connections happen through physical proximity and intentional mutual adding
- No mass importing
- Potentially invite-only (stronger culture, intentional growth, exclusivity, clustered real-world adoption)

### New Connection Flow

- Both users open "Connect"
- Front-facing camera opens with dynamic QR code
- Point phones at each other
- ~3 second interaction
- Warm, soft, magical feel
- Subtle glow/radar animation
- Haptic feedback
- "Finding each other..." state
- Warm success transition
- Simultaneous success animation on both devices
- Group hangouts: if multiple people are together, the flow should support connecting with several friends in one session (e.g. scan one after another without leaving the connect screen)
- Full ritual — this is a first-time, momentous moment. See `decisions.md` (2026-07-23): reconnecting no longer shares this flow

### Reconnect Flow (Location-Based)

- No camera, no QR, no shared in-the-moment ritual — see `decisions.md` (2026-07-23)
- App detects proximity to an existing friend in the background and sends a notification
- Notification is informational, low-pressure — not a demand to act immediately
- The "you were near this friend" state holds for the rest of the day, so the reconnect can be completed later (e.g. from the friend's profile) rather than in the moment
- Completing it is a quiet, lightweight action — quick confirmation, not a ritual
- One-month cooldown per friend: no notification, and no relationship-refresh benefit, if you've already reconnected with them that month
- Reconnecting again the same day does nothing extra
- Open question: exact copy/visual for the notification and for the deferred confirmation action

### Home Screen

- Land in moments feed/timeline
- Camera CTA present
- Participation encouraged, not forced

### Posting Flow

1. Camera opens (front-facing for connect, most recent (front/rare) for moments)
2. One-take capture
3. Optional tiny caption
4. Moment "develops" like a Polaroid? (no preview, gradual reveal)(open question)
5. Done

### Feed

- Chronological list of moments
- Finite and exhaustible
- Fake camera / film camera feel
- Replies live on a dedicated moment screen, not inline on the feed card (see `decisions.md`) — tapping a moment opens it
- Strong connections could have visual emphasis

### Profile

- Post history (with potential friction scrolling far back)
- Bio, interests, "ask me about..." prompts
- Not a portfolio or curated identity

### Faded / Drift Layer

- Drifted friends accessible intentionally
- Visually separated from active feed
- MVP default: labeled "Drifted," reached via a link at the bottom of the Friends list (not a bottom tab) — see `decisions.md`. Naming/placement may still change once it's actually used

## Interaction Feel

The app should feel:

- Warm, calm, human, fleeting, intentional, low-pressure

Moments should feel:

- Calming, ceremonial, tactile

Connection should feel:

- Like a handshake or shared ritual, not scanning a QR code (applies to new connections; reconnecting is quieter and deferrable — see Reconnect Flow above)

Reconnection should feel:

- Emotionally satisfying (color returns, sharpness restored)
- Low-pressure and unhurried — the notification can wait until later in the day

## Naming Direction

App name candidates: Connect, Loop, InTouch, Friends, Nexus, Linku, YouMe, Together, Us, MyFriends, MyGroup, InCircle, StayClose, Linked, Snapshot, RealYou, Real Life, MyPeople, Flock, Connection, Pod, Unity, Herd, Nest, Gather, Present
Rejected names: Ping, Bop, Tappy, FriendBop, CoNek, Letsmeet, MeetMe, JustFriends (connotation)

Idea space: birds of a feather (Flock, Nest, Herd, Pod, Gather)

Favorites (emphasize the physical-meeting requirement — you can't add anyone, only someone you've physically met): Handshake, Proximity, IRL, Crossed Paths, Presence, In Person, Encounter, Contact

Leading directions: Handshake, Pod, Feather

General ideas: Orbit, Village, Kindred, Iron, Ember, Bridge

Action language:

- Snapchat -> snap
- BeReal -> bereal/post
- This app -> connect/moment

Inspirations: Locket (real photo sharing, Rollcall feature), Vero (no ads/algorithms), Snapchat, BeReal, Retro, Friendster
