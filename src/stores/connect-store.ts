import { create } from 'zustand';

type ConnectStatus = 'idle' | 'creating' | 'waiting' | 'matched' | 'error';

type ConnectState = {
  status: ConnectStatus;
  sessionId: string | null;
  token: string | null;
  expectedFriendId: string | null;
  friendshipId: string | null;
  error: string | null;
  reset: (expectedFriendId?: string | null) => void;
  setWaiting: (sessionId: string, token: string) => void;
  setMatched: (friendshipId: string) => void;
  setError: (message: string) => void;
};

export const useConnectStore = create<ConnectState>((set) => ({
  status: 'idle',
  sessionId: null,
  token: null,
  expectedFriendId: null,
  friendshipId: null,
  error: null,
  reset: (expectedFriendId = null) =>
    set({
      status: 'idle',
      sessionId: null,
      token: null,
      friendshipId: null,
      error: null,
      expectedFriendId,
    }),
  setWaiting: (sessionId, token) => set({ status: 'waiting', sessionId, token, error: null }),
  setMatched: (friendshipId) => set({ status: 'matched', friendshipId }),
  setError: (message) => set({ status: 'error', error: message }),
}));
