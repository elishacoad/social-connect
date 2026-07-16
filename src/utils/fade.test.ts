import { freshnessRatio, isFullyFaded } from './fade';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('freshnessRatio', () => {
  it('is 0 when both timestamps are null', () => {
    expect(freshnessRatio({ last_physical_at: null, last_interaction_at: null })).toBe(0);
  });

  it('is 1 right after a physical meetup', () => {
    expect(
      freshnessRatio({ last_physical_at: daysAgo(0), last_interaction_at: null })
    ).toBeCloseTo(1, 2);
  });

  it('is 1 right after a reply, even with no physical meetup', () => {
    expect(
      freshnessRatio({ last_physical_at: null, last_interaction_at: daysAgo(0) })
    ).toBeCloseTo(1, 2);
  });

  it('takes the fresher of the two signals', () => {
    // Physical meetup 260/270 days ago (nearly expired) but a reply just 1 day ago —
    // the recent reply should win, not the stale physical signal.
    const ratio = freshnessRatio({ last_physical_at: daysAgo(260), last_interaction_at: daysAgo(1) });
    expect(ratio).toBeGreaterThan(0.9);
  });

  it('never goes negative once a window is fully exceeded', () => {
    const ratio = freshnessRatio({ last_physical_at: daysAgo(1000), last_interaction_at: daysAgo(1000) });
    expect(ratio).toBe(0);
  });

  it('interpolates roughly linearly within a window', () => {
    // Halfway through the 270-day physical window should be roughly 0.5.
    const ratio = freshnessRatio({ last_physical_at: daysAgo(135), last_interaction_at: null });
    expect(ratio).toBeCloseTo(0.5, 1);
  });
});

describe('isFullyFaded', () => {
  it('is false when both signals are within their windows', () => {
    expect(isFullyFaded({ last_physical_at: daysAgo(10), last_interaction_at: daysAgo(5) })).toBe(false);
  });

  it('is false when only the physical signal is stale but interaction is recent', () => {
    expect(isFullyFaded({ last_physical_at: daysAgo(300), last_interaction_at: daysAgo(5) })).toBe(false);
  });

  it('is false when only the interaction signal is stale but physical is recent', () => {
    expect(isFullyFaded({ last_physical_at: daysAgo(5), last_interaction_at: daysAgo(100) })).toBe(false);
  });

  it('is true only when both signals are past their windows', () => {
    expect(isFullyFaded({ last_physical_at: daysAgo(300), last_interaction_at: daysAgo(100) })).toBe(true);
  });

  it('is true when both timestamps are null', () => {
    expect(isFullyFaded({ last_physical_at: null, last_interaction_at: null })).toBe(true);
  });

  // This is the exact boundary the `active_friendships` SQL view uses —
  // if these two ever disagree, the feed and the fade visuals will
  // contradict each other in the UI.
  it('matches the 270/90 day boundary used by the active_friendships SQL view', () => {
    expect(isFullyFaded({ last_physical_at: daysAgo(269), last_interaction_at: daysAgo(91) })).toBe(false);
    expect(isFullyFaded({ last_physical_at: daysAgo(271), last_interaction_at: daysAgo(91) })).toBe(true);
  });
});
