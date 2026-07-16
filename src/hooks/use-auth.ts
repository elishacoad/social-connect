import { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { getProfile } from '@/queries/profiles';
import { useAuthStore } from '@/stores/auth-store';

let initialized = false;
let profileFetchedForUserId: string | null = null;

// Runs once total (not once per component calling useAuth()) — every screen
// that reads auth state shares this single subscription instead of each
// firing its own redundant profile fetch.
function syncProfile(session: Session | null) {
  const { setProfile } = useAuthStore.getState();
  if (!session) {
    profileFetchedForUserId = null;
    setProfile(null);
    return;
  }
  if (profileFetchedForUserId === session.user.id) return;
  profileFetchedForUserId = session.user.id;
  getProfile(session.user.id)
    .then(setProfile)
    .catch(() => setProfile(null));
}

export function useAuth() {
  const { status, session, profile } = useAuthStore();

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.getState().setSession(session);
      syncProfile(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setSession(session);
      syncProfile(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { status, session, profile };
}

export function refreshProfile() {
  const session = useAuthStore.getState().session;
  if (!session) return Promise.resolve();
  profileFetchedForUserId = session.user.id;
  return getProfile(session.user.id).then(useAuthStore.getState().setProfile);
}
