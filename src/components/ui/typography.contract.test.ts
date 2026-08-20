import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Typography is a closed system: family, size, line height and tracking are
// chosen together by a Text variant (src/components/ui/text.tsx). A screen
// that reaches for a raw utility silently opts out of that — and in the case
// of font-semibold, opts into iOS synthesizing a weight that isn't in the
// loaded family at all (see src/lib/fonts.ts). This test keeps the seam real
// rather than aspirational.
const SRC = join(__dirname, '../..');
const SEARCH_ROOTS = ['app', 'components'];
// The primitives in components/ui are where the tokens are *defined*.
const EXEMPT = join(SRC, 'components/ui');

const BANNED: { pattern: RegExp; why: string }[] = [
  { pattern: /\bfont-(thin|light|normal|medium|semibold|bold|extrabold|black)\b/, why: 'weight is carried by the family token (font-sans-semibold), not fontWeight' },
  { pattern: /\btext-\[\d+px\]/, why: 'use a fontSize token (text-body, text-footnote, …)' },
  { pattern: /\bleading-\[\d+px\]/, why: 'line height ships with the fontSize token' },
  { pattern: /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/, why: 'use a semantic size token, not the stock Tailwind scale' },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return full.startsWith(EXEMPT) ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });
}

describe('typography tokens', () => {
  const files = SEARCH_ROOTS.flatMap((root) => sourceFiles(join(SRC, root)));

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(BANNED)('never uses raw $pattern — $why', ({ pattern }) => {
    const offenders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => ({ file: file.slice(SRC.length + 1), line: i + 1, text: line.trim() }))
        .filter(({ text }) => pattern.test(text))
    );

    expect(offenders).toEqual([]);
  });
});
