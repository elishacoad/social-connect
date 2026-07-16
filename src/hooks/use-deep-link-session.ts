import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return;

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return;

  await supabase.auth.setSession({ access_token, refresh_token });
}

// Supabase's email confirmation / password reset links redirect back into
// the app via the `socialconnect://` scheme with tokens in the URL — this
// exchanges them for a real session wherever the app was opened from.
export function useDeepLinkSession() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) createSessionFromUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      createSessionFromUrl(url);
    });

    return () => subscription.remove();
  }, []);
}
