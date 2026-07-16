import { cn } from './utils';

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
});
