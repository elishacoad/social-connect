import { useConnectStore } from './connect-store';

describe('useConnectStore', () => {
  beforeEach(() => {
    useConnectStore.getState().reset();
  });

  it('starts idle with no expected friend', () => {
    const state = useConnectStore.getState();
    expect(state.status).toBe('idle');
    expect(state.expectedFriendId).toBeNull();
  });

  it('reset(friendId) carries the reconnect target through', () => {
    useConnectStore.getState().reset('friend-123');
    expect(useConnectStore.getState().expectedFriendId).toBe('friend-123');
  });

  it('setWaiting moves to the waiting state with session/token', () => {
    useConnectStore.getState().setWaiting('session-1', 'token-1');
    const state = useConnectStore.getState();
    expect(state.status).toBe('waiting');
    expect(state.sessionId).toBe('session-1');
    expect(state.token).toBe('token-1');
  });

  it('setMatched moves to the matched state with a friendship id', () => {
    useConnectStore.getState().setWaiting('session-1', 'token-1');
    useConnectStore.getState().setMatched('friendship-1');
    const state = useConnectStore.getState();
    expect(state.status).toBe('matched');
    expect(state.friendshipId).toBe('friendship-1');
  });

  it('setError moves to the error state and records the message', () => {
    useConnectStore.getState().setError('that code is invalid or expired');
    const state = useConnectStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('that code is invalid or expired');
  });

  it('reset() after an error clears it back to idle', () => {
    useConnectStore.getState().setError('boom');
    useConnectStore.getState().reset();
    const state = useConnectStore.getState();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });
});
