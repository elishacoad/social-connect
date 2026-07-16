import "../../global.css";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuth } from '@/hooks/use-auth';
import { useDeepLinkSession } from '@/hooks/use-deep-link-session';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { status, profile } = useAuth();
  useDeepLinkSession();

  // The signup trigger stub-provisions a profile with an empty display_name;
  // onboarding fills it in. Treat that as "not fully signed in yet" so a
  // fresh signup lands on onboarding instead of the tabs.
  const needsOnboarding = status === 'signedIn' && profile !== null && profile.display_name === '';
  const signedIn = status === 'signedIn' && !needsOnboarding;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {status !== 'loading' && (
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
            <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="moment/[id]" options={{ headerShown: true, title: '' }} />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
