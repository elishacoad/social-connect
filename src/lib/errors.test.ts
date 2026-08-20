import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('uses the message of a real Error', () => {
    expect(errorMessage(new Error('duplicate key'), 'fallback')).toBe('duplicate key');
  });

  it('falls back for non-Error throws', () => {
    expect(errorMessage('boom', 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
    expect(errorMessage({ message: 'not an Error' }, 'fallback')).toBe('fallback');
  });
});
