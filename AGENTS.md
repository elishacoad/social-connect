# Build Instructions

## Expo

Expo HAS CHANGED. Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Stack

### Mobile App

- Expo / React Native
- TypeScript
- NativeWind (Tailwind CSS styling)
- React Native Reusables (shadcn/ui for RN, copy-paste components built on NativeWind)
- Zustand (lightweight local state)
- Phosphor (`phosphor-react-native`) for icons — no emoji or Unicode glyphs as UI icons, ever

### Backend

- Supabase Auth
- Supabase Postgres with Row Level Security
- Supabase Storage (photos/videos)
- Supabase Realtime (connect success, replies)
- Supabase Edge Functions (heavier logic)

### Key Expo Modules

- `expo-camera` - moments + QR scanning
- `expo-notifications` - gentle reminders
- `expo-haptics` - connect/reconnect feedback
- `expo-image-manipulator` - compression / fade effects
- `expo-secure-store` - auth/session storage

## Database

### Tables

- `profiles`
- `friendships`
- `moments`
- `moment_replies`
- `connection_events`
- `connect_sessions`

### Core Logic

- Fading: weighted by interaction type (physical > direct interaction > passive), not a single timestamp
- Active/feed visibility: query filters/sorts by relationship freshness
- Mutual QR connect: create `connect_session`, match scanned token, create/update friendship

### Scheduled Jobs

Supabase scheduled Edge Functions / `pg_cron` for cleanup, recaps, yearly review generation (later).

## Build Order

1. Auth + profile
2. Moment capture / post
3. Chronological feed
4. Mutual QR connect / reconnect
5. Friendship fade visuals
6. Direct replies
7. Fully faded section
8. Push notifications (later)
9. Yearly review (later)

## Testing

Write a test when you touch: pure logic in `src/utils/*.ts` / `src/lib/utils.ts` / `src/stores/*.ts` → Jest, colocated as `<file>.test.ts`. An RLS policy, constraint, or `SECURITY DEFINER` function → pgTAP in `supabase/tests/database/*.sql` (the app's real rules live in Postgres, not TypeScript — a mocked client can't catch a bug in a policy). See `docs/testing.md`.

## Conventions

- Read `docs/product.md` for product rules, scope, and open questions before implementing features
- Read `docs/design.md` for UX flows and visual direction before building UI
- Read `docs/testing.md` before writing or running tests

This file is a map, not a manual: each section above should stay short enough to hold in your head every session. When a topic grows detailed how-tos, gotchas, or command references, move them to a `docs/*.md` file and leave a one-line pointer here — same pattern as testing/product/design.
