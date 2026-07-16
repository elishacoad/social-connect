import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { signUp } from '@/queries/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      // The on_auth_user_created trigger stub-provisions a profiles row.
      // If email confirmation is required, signUp() returns no session yet —
      // useDeepLinkSession() picks up the session once the confirmation
      // link is tapped, and the root layout routes to onboarding from there.
      const { session } = await signUp(email.trim(), password);
      if (!session) setConfirmationSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text variant="h2" className="border-0 pb-0 text-center">
            Check your email
          </Text>
          <Text variant="muted" className="text-center">
            We sent a confirmation link to {email.trim()}. Tap it to finish creating your account.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-6">
        <View className="gap-1">
          <Text variant="h2" className="border-0 pb-0 text-left">
            Create an account
          </Text>
          <Text variant="muted">Meet friends in person, then keep the moment going.</Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Label nativeID="email">Email</Label>
            <Input
              aria-labelledby="email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </View>

          <View className="gap-2">
            <Label nativeID="password">Password</Label>
            <Input
              aria-labelledby="password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="At least 8 characters"
            />
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button onPress={handleSignUp} disabled={loading || !email || !password}>
            <Text>{loading ? 'Creating account…' : 'Create account'}</Text>
          </Button>
        </View>

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/sign-in">
            <Text className="text-primary font-medium">Sign in</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
