import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { ProfileRow } from '@/queries/profiles';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  profile: ProfileRow | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  setSession: (session) =>
    set({ session, status: session ? 'signedIn' : 'signedOut' }),
  setProfile: (profile) => set({ profile }),
}));
