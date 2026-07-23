# Home-Screen Widget: Friends' Photo Slideshow (Locket-style)

> Status: planned, not yet implemented. Come back to this when ready to build.

## Context

The user wants an iOS home-screen widget that shows a rotating slideshow of *friends'* moments only — never the user's own — updating as new photos are posted. This mirrors Locket, which `docs/competitors.md` and `docs/design.md` already name as direct inspiration ("Rollcall feature," "Widget-first UX is interesting"). It is **new scope**: not on the MVP "Must Have" list in `docs/product.md`, and not a documented non-goal either — it's simply undiscussed there. This plan adds it as a deliberate scope addition, to be recorded in `docs/product.md`/`docs/decisions.md` once approved.

Confirmed direction (from user):
- **iOS only for v1.** `ios/` is already a locally prebuilt Expo project (gitignored, regenerated via CNG); Android has no native project yet and app widgets there are a separate, larger effort.
- **Periodic timeline rotation, not live push.** No push infrastructure exists yet, and `docs/product.md` explicitly excludes notifications from current MVP scope. The widget will use WidgetKit's own timeline mechanism (pre-scheduled entries + hourly-ish system-driven refresh) instead of building silent-push infra.
- **Photo source = recent moments from active (non-faded) friends**, reusing the existing 270-day-physical / 90-day-interaction freshness cutoff already implemented for the in-app feed.

## Why timelines instead of "just show the live feed"

WidgetKit extensions run in a separate, memory-constrained process with no access to the RN JS runtime. Two constraints shape the design:

1. **Signed URLs expire in 1 hour** (`getMomentMediaUrl` in `src/lib/supabase-storage.ts`, `moments` bucket is private). A widget timeline spanning several hours can't rely on ever-fresh signed URLs — the widget's own timeline provider must fetch a fresh signed URL and download the actual image bytes into local widget storage at generation time, not just store a URL string.
2. **iOS decides refresh cadence**, not us. `WidgetKit`'s `TimelineProvider.getTimeline` returns a list of `TimelineEntry` values, each with its own display `date`; iOS renders whichever entry's date has passed and asks for a new timeline again around a `.after(refreshDate)` policy hint — but the OS applies its own budget on top (typically a handful of refreshes/day unless the app is opened frequently). So: build one timeline covering the *next several hours* of rotation (e.g. one photo every 30–60 min, ~8–12 entries), and let iOS step through them on its own — this gives the "slideshow" feel without needing the extension process to stay alive. New content shows up on the next refresh cycle (roughly hourly), not instantly — matches the "periodic" choice.

## Implementation Plan

### 1. Native scaffolding — iOS Widget Extension via config plugin

Add a Swift WidgetKit extension as a config-plugin-managed Xcode target so it survives `expo prebuild` regeneration (required since `ios/` is gitignored/CNG-generated, not hand-edited).

- Add `@bacons/apple-targets` (the standard community config plugin for adding native Apple targets — widgets, share extensions, etc. — to a managed Expo project) to `package.json` and `app.json`'s `plugins` array.
- Create the widget target directory (e.g. `targets/friends-widget/`) per that plugin's convention, containing:
  - `Widget.swift` — `TimelineProvider` + `TimelineEntry` (photo local file URL, friend display name, timestamp) + SwiftUI view rendering the photo full-bleed with a small name/time label, matching the "tactile, film-like, warm" aesthetic described in `docs/design.md` (film-grain/vignette treatment can come later; v1 can be a plain photo).
  - An **App Group** entitlement shared between the main app target and the widget extension, for the widget's `TimelineProvider` to read the Supabase session/auth token needed to query Supabase directly, and to write/read downloaded images to a shared container.
- Set an Android `package` in `app.json` at some point regardless of this feature (currently unset) — not required for this plan, just noting the gap; out of scope here since Android widget work is deferred.

### 2. Data layer — new widget-scoped query

Add a new function in `src/queries/moments.ts` (alongside the existing `getFeed`, `getMoment`, etc.) rather than reusing `getFeed`, since the widget's needs differ (exclude own posts, filter by active-friendship freshness, cap count):

```ts
export async function getWidgetMoments(limit = 12) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('moments')
    .select('*, author:profiles(display_name, username, avatar_url), friendship:friendships!inner(last_physical_at, last_interaction_at)')
    .neq('author_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.filter((m) => !isFullyFaded(m.friendship));
}
```

(Exact join shape needs verification against the `friendships` schema — `user_a_id`/`user_b_id` is an ordered pair, not a simple FK from `moments`, so this likely needs a Postgres view or RPC rather than a client-side embedded join — see Step 3.)

### 3. Likely need: a small SQL view or RPC for widget data

Because `friendships` uses an ordered `(user_a_id, user_b_id)` pair rather than a direct per-moment FK, resolving "is this moment's author an active friend of the current user" cleanly is easier as a `SECURITY DEFINER` Postgres function than as a client-side join — and RLS already does this filtering for `getFeed`. Simplest approach: add a migration creating `get_widget_moments(limit int)` RPC (or a view `widget_feed_candidates`) that:
- Reuses the existing `active_friendships` view (already excludes fully-faded friends, keeping the freshness cutoff in one place per the existing `isFullyFaded`/SQL-view sync comment in `src/utils/fade.ts`).
- Excludes `author_id = auth.uid()`.
- Returns moment id, media_path, author display name/avatar, created_at.

This keeps fade-cutoff logic defined once in SQL (already the pattern in this repo — see `20260716184911_drop_one_moment_per_day_limit.sql` and the `active_friendships` view) rather than duplicating it in the widget's Swift code.

### 4. Bridging RN app → widget extension

The widget extension needs a way to get moment data + downloaded images into the shared App Group container so its `TimelineProvider` can build entries even when the RN app isn't foregrounded (the RN app can't just hold this in JS memory — a widget process reads shared native storage).

Two cooperating refresh paths:
- **App-foreground refresh**: when the RN app opens/foregrounds, call `getWidgetMoments()`, download each photo via `expo-file-system` into the App Group's shared container (native module bridge required — `@bacons/apple-targets` typically ships helpers for this, or a small custom native module), write a manifest (moment id, local file name, author name, timestamp) to shared `UserDefaults`/App Group storage, then call `WidgetCenter.shared.reloadTimelines(ofKind:)` (via a thin native bridge call) so the widget rebuilds its timeline immediately with the latest data.
- **Widget-driven refresh**: the widget extension's own `TimelineProvider.getTimeline` can independently query Supabase (it has the shared auth token via App Group) and download images itself when iOS calls it on its own refresh schedule — this is what keeps the widget updating even if the user hasn't opened the app in a while.

### 5. Slideshow rendering inside the widget

- `TimelineProvider.getTimeline` returns N entries (one per photo, ~8–12), each with a `date` staggered ~30–60 min apart starting now, plus a final `.after(nextRefreshDate)` policy telling iOS when to ask again (roughly matched to the 1-hour signed-URL lifetime).
- Each `TimelineEntry` carries the already-downloaded local image file reference (not a remote URL) so rendering is instant and offline-safe once fetched.
- SwiftUI view: full-bleed photo, small overlay with friend's first name (from `profiles.display_name`) — no caption/reply UI (widgets are display-only, tapping deep-links into the app via `widgetURL`).

### 6. Realtime → widget nudge (soft, not full push)

We're not building silent push. Instead, piggyback on existing infra: if the RN app is foregrounded and its existing `supabase.channel(...).on('postgres_changes', INSERT on moments, ...)` subscription (already used in `src/hooks/use-feed.ts`) fires for a friend's moment, trigger the same "refresh widget data + reload timeline" call from step 4. This means the widget updates near-instantly *whenever the app happens to be open*, and otherwise on iOS's own hourly-ish budget — a reasonable middle ground without new push infra.

### 7. Docs

- Add a short section to `docs/product.md` (or `docs/technology.md`, matching its existing "technical approach" framing) documenting: widget scope (iOS only, photo source = active friends only, periodic/timeline-based refresh, no push), and defer Android + live-push as explicit future work.
- Add an entry to `docs/decisions.md` noting the iOS-only / periodic-refresh / active-friends-only decisions made in this planning session, following that file's existing decision-log format.

## Files to touch

- `package.json`, `app.json` — add `@bacons/apple-targets` plugin + config.
- `targets/friends-widget/Widget.swift` (new) — TimelineProvider, TimelineEntry, SwiftUI view.
- `src/queries/moments.ts` — add `getWidgetMoments()`.
- `supabase/migrations/*` (new) — RPC or view for widget-safe friend-moment lookup, reusing `active_friendships`.
- A small native bridge module (new, under `modules/` or via the apple-targets plugin's own helpers) for: writing to App Group shared storage, downloading images via `expo-file-system`, and calling `WidgetCenter.shared.reloadTimelines`.
- Hook into `src/hooks/use-feed.ts`'s existing realtime subscription (or a new small hook) to trigger the native refresh bridge call on foreground + on new-moment realtime events.
- `docs/product.md` / `docs/technology.md`, `docs/decisions.md` — scope + decision documentation.

## Verification

- `expo prebuild --clean` regenerates `ios/` including the widget extension target (config plugin correctness check).
- `expo run:ios` on a physical device or simulator (widgets often behave inconsistently in simulator — prefer device); add the widget from the iOS home screen widget gallery.
- Seed two test accounts as active friends, post a moment from account B, confirm it appears in account A's widget rotation within the app-foreground refresh path; verify account A's own moments never appear.
- Force-fade a friendship (backdate `last_physical_at`/`last_interaction_at` past the cutoff) and confirm that friend's photos drop out of the widget's next refresh.
- Background the app for >1hr and confirm the widget's own `TimelineProvider` independently refreshes on iOS's own schedule (observe via Console.app device logs).
