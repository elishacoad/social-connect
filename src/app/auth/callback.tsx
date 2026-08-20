import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

// Landing spot for Supabase's email confirmation / password reset links
// (see emailRedirectTo in src/queries/auth.ts). supabase-js defaults to the
// PKCE flow, so a successful link carries a `code` param to exchange for a
// session; an already-used or expired link carries `error`/`error_description`
// instead. A dedicated route is required here — the bare scheme root has no
// screen to match while the user is signed out, which is what previously
// surfaced as Expo Router's "Unmatched Route" screen.
export default function AuthCallbackScreen() {
  const url = Linking.useURL();
  const { status, profile } = useAuth();
  const processedUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || processedUrl.current === url) return;
    processedUrl.current = url;

    Promise.resolve()
      .then(() => {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode || params.error) {
          throw new Error(
            params.error_description?.replace(/\+/g, ' ') ?? 'This link is invalid or has expired.',
          );
        }

        const { code, access_token, refresh_token } = params;
        if (code) return supabase.auth.exchangeCodeForSession(code);
        if (access_token && refresh_token) return supabase.auth.setSession({ access_token, refresh_token });
        throw new Error('This link is invalid or has expired.');
      })
      .then(({ error: exchangeError }) => {
        if (exchangeError) setError(exchangeError.message);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
  }, [url]);

  useEffect(() => {
    if (error || status === 'loading' || status === 'signedOut') return;
    const needsOnboarding = status === 'signedIn' && profile !== null && profile.display_name === '';
    router.replace(needsOnboarding ? '/onboarding' : '/');
  }, [error, status, profile]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text variant="h2" className="border-0 pb-0 text-center">
            Link expired
          </Text>
          <Text variant="muted" className="text-center">
            {error} Please request a new confirmation email and try again.
          </Text>
          <Button onPress={() => router.replace('/sign-up')}>
            <Text>Back to sign up</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  );
}
