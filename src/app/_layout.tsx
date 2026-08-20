import "../../global.css";

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuth } from '@/hooks/use-auth';
import { FONTS } from '@/lib/fonts';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { status, profile } = useAuth();
  const [fontsLoaded, fontError] = useFonts(FONTS);

  // The signup trigger stub-provisions a profile with an empty display_name;
  // onboarding fills it in. Treat that as "not fully signed in yet" so a
  // fresh signup lands on onboarding instead of the tabs.
  const needsOnboarding = status === 'signedIn' && profile !== null && profile.display_name === '';
  const signedIn = status === 'signedIn' && !needsOnboarding;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {status !== 'loading' && (fontsLoaded || fontError) && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/sign-in" />
            <Stack.Screen name="(auth)/sign-up" />
          </Stack.Protected>

          <Stack.Protected guard={needsOnboarding}>
            <Stack.Screen name="(auth)/onboarding" />
          </Stack.Protected>

          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="connect" options={{ presentation: 'modal' }} />
            <Stack.Screen name="moment-caption" />
            {__DEV__ && <Stack.Screen name="ds" options={{ headerShown: true }} />}
            <Stack.Screen
              name="profile/[id]"
              options={{
                headerShown: true,
                title: '',
                headerBackButtonDisplayMode: 'minimal',
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="profile/edit"
              options={{
                headerShown: true,
                title: 'Edit profile',
                headerBackButtonDisplayMode: 'minimal',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="moment/[id]"
              options={{
                headerShown: true,
                title: '',
                headerBackButtonDisplayMode: 'minimal',
                headerTransparent: true,
              }}
            />
          </Stack.Protected>

          {/* Not first in the list — the first declared screen becomes the
              default initial route on cold launch, and this one should only
              ever be reached via an incoming Supabase redirect link. */}
          <Stack.Screen name="auth/callback" />
        </Stack>
      )}
    </ThemeProvider>
  );
}
