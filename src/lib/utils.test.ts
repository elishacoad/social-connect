import { cn, FONT_SIZE_TOKENS } from './utils';

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('drops falsy values', () => {
    expect(cn('flex', false && 'hidden', null, undefined, 'gap-2')).toBe('flex gap-2');
  });

  it('lets a later conflicting Tailwind class win, not just concatenate', () => {
    // This is the whole reason RNR components use `cn` instead of template
    // strings — a caller passing className="p-4" should override the
    // component's own "p-2", not produce invalid CSS with both.
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('applies conditional object syntax', () => {
    expect(cn('base', { 'opacity-50': true, 'text-red-500': false })).toBe('base opacity-50');
  });
  it('keeps a text colour when a semantic size token follows it', () => {
    // tailwind-merge only knows the stock text-* scale, so an unrecognised
    // `text-body` gets filed as a colour and silently eats the real one —
    // which rendered black button labels on a black fill.
    expect(cn('text-primary-foreground', 'text-body')).toBe('text-primary-foreground text-body');
    expect(cn('text-muted-foreground text-footnote')).toBe('text-muted-foreground text-footnote');
  });

  it('still lets a later size token replace an earlier one', () => {
    expect(cn('text-body', 'text-h1')).toBe('text-h1');
  });
});

describe('FONT_SIZE_TOKENS', () => {
  it('matches the fontSize keys in tailwind.config.js', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../tailwind.config.js');
    expect([...FONT_SIZE_TOKENS].sort()).toEqual(Object.keys(config.theme.extend.fontSize).sort());
  });
});

