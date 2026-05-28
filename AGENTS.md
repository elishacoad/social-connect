# Build Instructions

## Expo

Expo HAS CHANGED. Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Stack

### Mobile App

- Expo / React Native
- TypeScript
- NativeWind (Tailwind CSS styling, no component library)
- Zustand (lightweight local state)

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

## Conventions

- Read `docs/product.md` for product rules, scope, and open questions before implementing features
- Read `docs/design.md` for UX flows and visual direction before building UI
