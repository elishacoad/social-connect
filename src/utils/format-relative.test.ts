import { formatRelativeLabel } from './format-relative';

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe('formatRelativeLabel', () => {
  it('returns "just now" for anything under a minute old', () => {
    expect(formatRelativeLabel(new Date().toISOString())).toBe('just now');
  });

  it('formats minutes for under an hour', () => {
    expect(formatRelativeLabel(minutesAgo(5))).toBe('5m ago');
    expect(formatRelativeLabel(minutesAgo(59))).toBe('59m ago');
  });

  it('formats hours for under a day', () => {
    expect(formatRelativeLabel(minutesAgo(60))).toBe('1h ago');
    expect(formatRelativeLabel(minutesAgo(60 * 23))).toBe('23h ago');
  });

  it('formats days once past 24 hours', () => {
    expect(formatRelativeLabel(minutesAgo(60 * 24))).toBe('1d ago');
    expect(formatRelativeLabel(minutesAgo(60 * 24 * 10))).toBe('10d ago');
  });
});
