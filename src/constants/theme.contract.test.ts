import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Colors } from './theme';

// theme.ts restates global.css's palette as plain hex because SVG icon props
// and the native tab bar can't read CSS custom properties. The two are kept in
// step only by a comment — this test makes that enforceable by converting the
// CSS vars and comparing.
const CSS = readFileSync(join(__dirname, '../../global.css'), 'utf8');

// Deliberately NOT covered: `destructive`. global.css's --destructive is a
// surface colour (dark maroon in dark mode, meant to sit under white text),
// while Colors.destructive tints a standalone icon and has to stay legible on
// the card surface. Same name, different job — divergence here is correct.
const MIRRORED = {
  text: 'foreground',
  background: 'background',
  backgroundElement: 'secondary',
  card: 'card',
  border: 'border',
  mutedForeground: 'muted-foreground',
  primary: 'primary',
  primaryForeground: 'primary-foreground',
} as const;

function block(selector: string) {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`${selector} not found in global.css — did it move?`);
  return CSS.slice(start, CSS.indexOf('}', start));
}

function hslVarToHex(css: string, name: string) {
  const match = new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`).exec(css);
  if (!match) throw new Error(`--${name} not found`);
  const [h, s, l] = [Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100];

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];

  return `#${[r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

describe.each([
  ['light', ':root {', Colors.light],
  ['dark', '.dark:root {', Colors.dark],
])('%s palette matches global.css', (_name, selector, palette) => {
  const css = block(selector);

  it.each(Object.entries(MIRRORED))('%s mirrors --%s', (key, cssVar) => {
    expect(palette[key as keyof typeof MIRRORED]).toBe(hslVarToHex(css, cssVar));
  });
});
