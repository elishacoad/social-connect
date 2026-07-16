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

### Connect / Reconnect Flow

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
- Group hangouts: if multiple people are together, the flow should support connecting/reconnecting with several friends in one session (e.g. scan one after another without leaving the connect screen)
- MVP default: new connections and reconnects share this exact same flow technically; reconnecting from a friend's profile shows a lighter version (quieter copy, quicker success) instead of the full ritual — see `decisions.md`

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

- Like a handshake or shared ritual, not scanning a QR code

Reconnection should feel:

- Emotionally satisfying (color returns, sharpness restored)

## Naming Direction

App name candidates: Connect, Loop, InTouch
Rejected names: Ping, Bop, Tappy, FriendBop, CoNek, Letsmeet, MeetMe

Action language:

- Snapchat -> snap
- BeReal -> bereal/post
- This app -> connect/moment

Inspirations: Locket (real photo sharing, Rollcall feature), Vero (no ads/algorithms), Snapchat, BeReal, Retro, Friendster
