import { Link } from 'expo-router';
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  LockPasswordIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { cn } from '@/lib/utils';
import { signIn, resetPasswordForEmail } from '@/queries/auth';

type Field = 'email' | 'password';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const scheme = useColorScheme();
  const mutedColor = '#8a8a90';
  const iconColor = scheme === 'dark' ? Colors.dark.text : Colors.light.text;
  const dangerColor = scheme === 'dark' ? '#f87171' : '#ef4444';

  const canSubmit = Boolean(email && password) && !loading;

  async function handleSignIn() {
    setError(null);
    setResetSent(false);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Enter your email above first');
      return;
    }
    setError(null);
    try {
      await resetPasswordForEmail(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResetSent(true);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  function fieldClassName(field: Field) {
    return cn(
      'h-12 rounded-xl pl-11 pr-4 text-base',
      error ? 'border-destructive' : focused === field ? 'border-foreground' : 'border-input'
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6 pb-6 pt-14"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          <View className="gap-2">
            <Text variant="h2" className="border-0 pb-0 text-left text-4xl">
              Welcome back
            </Text>
            <Text variant="muted" className="text-base">
              Sign in to see what your friends are up to.
            </Text>
          </View>

          <View className="mt-10 gap-5">
            <View className="gap-2">
              <Label nativeID="email" className="text-sm">
                Email
              </Label>
              <View className="relative justify-center">
                <View pointerEvents="none" className="absolute left-3.5 z-10">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={18}
                    strokeWidth={1.75}
                    color={focused === 'email' ? iconColor : mutedColor}
                  />
                </View>
                <Input
                  aria-labelledby="email"
                  aria-invalid={Boolean(error)}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="you@example.com"
                  className={fieldClassName('email')}
                />
              </View>
            </View>

            <View className="gap-2">
              <Label nativeID="password" className="text-sm">
                Password
              </Label>
              <View className="relative justify-center">
                <View pointerEvents="none" className="absolute left-3.5 z-10">
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    size={18}
                    strokeWidth={1.75}
                    color={focused === 'password' ? iconColor : mutedColor}
                  />
                </View>
                <Input
                  ref={passwordRef}
                  aria-labelledby="password"
                  aria-invalid={Boolean(error)}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    if (canSubmit) handleSignIn();
                  }}
                  placeholder="••••••••"
                  className={cn(fieldClassName('password'), 'pr-12')}
                />
                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  className="absolute right-1 size-10 items-center justify-center rounded-lg active:bg-muted">
                  <HugeiconsIcon
                    icon={passwordVisible ? ViewOffSlashIcon : ViewIcon}
                    size={18}
                    strokeWidth={1.75}
                    color={mutedColor}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={handleForgotPassword}
                hitSlop={8}
                accessibilityRole="button"
                className="self-end py-1">
                <Text variant="muted" className="text-sm underline">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {error ? (
              <View className="bg-destructive/10 flex-row items-start gap-2 rounded-xl px-3 py-2.5">
                <View className="pt-0.5">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    size={16}
                    strokeWidth={1.75}
                    color={dangerColor}
                  />
                </View>
                <Text className="text-destructive flex-1 text-sm">{error}</Text>
              </View>
            ) : null}

            {resetSent ? (
              <View className="bg-muted flex-row items-start gap-2 rounded-xl px-3 py-2.5">
                <View className="pt-0.5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    strokeWidth={1.75}
                    color={mutedColor}
                  />
                </View>
                <Text variant="muted" className="flex-1 text-sm">
                  Check your email for a password reset link.
                </Text>
              </View>
            ) : null}

            <Button
              onPress={handleSignIn}
              disabled={!canSubmit}
              className={cn(
                'h-12 rounded-xl active:opacity-90',
                !canSubmit && 'bg-muted opacity-100'
              )}>
              {loading ? (
                <ActivityIndicator size="small" color={mutedColor} />
              ) : (
                <Text className={cn('text-base font-medium', !canSubmit && 'text-muted-foreground')}>
                  Sign in
                </Text>
              )}
            </Button>
          </View>

          <View className="mt-auto flex-row justify-center gap-1 pt-10">
            <Text variant="muted" className="text-base">
              New here?
            </Text>
            <Link href="/sign-up">
              <Text className="text-primary text-base font-medium">Create an account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
