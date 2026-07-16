import { FADE_INTERACTION_DAYS, FADE_PHYSICAL_DAYS } from '@/constants/fade';

type FreshnessInput = {
  last_physical_at: string | null;
  last_interaction_at: string | null;
};

function daysSince(isoDate: string) {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function ratioFor(isoDate: string | null, windowDays: number) {
  if (!isoDate) return 0;
  return Math.max(0, 1 - daysSince(isoDate) / windowDays);
}

// 0 = fully faded, 1 = just refreshed. Continuous, for visual interpolation
// (opacity/desaturation) — NOT the feed-inclusion cutoff, which is binary.
export function freshnessRatio(friendship: FreshnessInput) {
  return Math.max(
    ratioFor(friendship.last_physical_at, FADE_PHYSICAL_DAYS),
    ratioFor(friendship.last_interaction_at, FADE_INTERACTION_DAYS)
  );
}

// Mirrors the `active_friendships` SQL view's cutoff — keep both in sync.
export function isFullyFaded(friendship: FreshnessInput) {
  const physicalStale =
    !friendship.last_physical_at || daysSince(friendship.last_physical_at) > FADE_PHYSICAL_DAYS;
  const interactionStale =
    !friendship.last_interaction_at || daysSince(friendship.last_interaction_at) > FADE_INTERACTION_DAYS;
  return physicalStale && interactionStale;
}
