import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { signIn, resetPasswordForEmail } from '@/queries/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email above first');
      return;
    }
    setError(null);
    try {
      await resetPasswordForEmail(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-6">
        <View className="gap-1">
          <Text variant="h2" className="border-0 pb-0 text-left">
            Welcome back
          </Text>
          <Text variant="muted">Sign in to see what your friends are up to.</Text>
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
              placeholder="••••••••"
            />
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          {resetSent ? (
            <Text variant="muted" className="text-sm">
              Check your email for a password reset link.
            </Text>
          ) : null}

          <Button onPress={handleSignIn} disabled={loading || !email || !password}>
            <Text>{loading ? 'Signing in…' : 'Sign in'}</Text>
          </Button>

          <Button variant="ghost" onPress={handleForgotPassword}>
            <Text>Forgot password?</Text>
          </Button>
        </View>

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">New here?</Text>
          <Link href="/sign-up">
            <Text className="text-primary font-medium">Create an account</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
