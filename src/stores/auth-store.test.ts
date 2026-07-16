import { useAuthStore } from './auth-store';

const fakeSession = { user: { id: 'user-1' } } as never;
const fakeProfile = { id: 'user-1', username: 'test', display_name: 'Test' } as never;

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'loading', session: null, profile: null });
  });

  it('starts in a loading state with no session', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
    expect(state.session).toBeNull();
  });

  it('setSession(session) transitions to signedIn', () => {
    useAuthStore.getState().setSession(fakeSession);
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(useAuthStore.getState().session).toBe(fakeSession);
  });

  it('setSession(null) transitions to signedOut, even from signedIn', () => {
    useAuthStore.getState().setSession(fakeSession);
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('setProfile does not change session/status', () => {
    useAuthStore.getState().setSession(fakeSession);
    useAuthStore.getState().setProfile(fakeProfile);
    const state = useAuthStore.getState();
    expect(state.profile).toBe(fakeProfile);
    expect(state.status).toBe('signedIn');
    expect(state.session).toBe(fakeSession);
  });
});
