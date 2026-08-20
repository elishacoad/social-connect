import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The semantic type scale in tailwind.config.js replaces Tailwind's stock
// text-* sizes. tailwind-merge only knows the stock scale, so it reads an
// unfamiliar `text-body` as a text *colour* and drops any colour class merged
// before it — which silently turned button labels and muted text back to the
// default foreground. Keep this list in sync with the config (utils.test.ts
// fails if it drifts).
export const FONT_SIZE_TOKENS = [
  'micro',
  'overline',
  'caption',
  'footnote',
  'body',
  'field',
  'title',
  'h3',
  'h2',
  'h1',
  'display',
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: FONT_SIZE_TOKENS }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
