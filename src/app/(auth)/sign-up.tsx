import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  MailOpen01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { signUp } from '@/queries/auth';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const colors = useThemeColors();
  const iconColor = colors.text;
  const dangerColor = colors.destructive;

  function fieldClassName(field: 'email' | 'password') {
    return cn(
      'h-14 rounded-2xl pl-12 pr-4 text-base',
      error ? 'border-destructive' : focused === field ? 'border-foreground' : 'border-input'
    );
  }

  const passwordLongEnough = password.length >= 8;
  const canSubmit = !loading && Boolean(email) && Boolean(password);

  async function handleSignUp() {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSignUp();
  }

  if (confirmationSent) {
    return (
      <SafeAreaView className="bg-background flex-1">
        <View className="flex-1 items-center justify-center gap-8 px-8">
          <Animated.View
            entering={FadeInDown.duration(420)}
            className="bg-muted/40 size-32 items-center justify-center rounded-full">
            <View className="bg-muted size-24 items-center justify-center rounded-full">
              <HugeiconsIcon icon={MailOpen01Icon} size={40} strokeWidth={1.25} color={iconColor} />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(420)}
            className="max-w-[320px] gap-3">
            <Text
              variant="h3"
              className="text-center text-[26px] leading-[34px]"
              style={Platform.select({ ios: { letterSpacing: -0.4 } })}>
              Check your email
            </Text>
            <Text variant="muted" className="text-center text-[15px] leading-[23px]">
              We sent a confirmation link to{' '}
              <Text className="text-foreground text-[15px] font-semibold">{email.trim()}</Text>. Tap
              it to finish creating your account.
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-9 px-6 pt-14">
        <Animated.View entering={FadeInDown.duration(420)} className="gap-2">
          <Text
            variant="h2"
            className="text-left text-[32px] leading-[38px]"
            style={Platform.select({ ios: { letterSpacing: -0.6 } })}>
            Create an account
          </Text>
          <Text variant="muted" className="text-[15px] leading-[23px]">
            Meet friends in person, then keep the moment going.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(420)} className="gap-5">
          <View className="gap-2">
            <Label nativeID="email" className="text-muted-foreground text-[13px]">
              Email
            </Label>
            <View className="justify-center">
              <Input
                aria-labelledby="email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@example.com"
                aria-invalid={Boolean(error)}
                className={fieldClassName('email')}
              />
              <View pointerEvents="none" className="absolute left-4">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={20}
                  strokeWidth={1.6}
                  color={focused === 'email' ? iconColor : colors.mutedForeground}
                />
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Label nativeID="password" className="text-muted-foreground text-[13px]">
              Password
            </Label>
            <View className="justify-center">
              <Input
                ref={passwordRef}
                aria-labelledby="password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (canSubmit) handleSubmitPress();
                }}
                placeholder="••••••••"
                aria-invalid={Boolean(error)}
                className={cn(fieldClassName('password'), 'pr-14')}
              />
              <View pointerEvents="none" className="absolute left-4">
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  size={20}
                  strokeWidth={1.6}
                  color={focused === 'password' ? iconColor : colors.mutedForeground}
                />
              </View>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setPasswordVisible((visible) => !visible);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                className="absolute right-1 size-12 items-center justify-center rounded-xl active:bg-muted">
                <HugeiconsIcon
                  icon={passwordVisible ? ViewOffSlashIcon : ViewIcon}
                  size={20}
                  strokeWidth={1.6}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1.5 pl-1">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={14}
                strokeWidth={passwordLongEnough ? 2.2 : 1.6}
                color={passwordLongEnough ? iconColor : colors.mutedForeground}
              />
              <Text
                className={cn(
                  'text-[13px]',
                  passwordLongEnough ? 'text-foreground' : 'text-muted-foreground'
                )}>
                At least 8 characters
              </Text>
            </View>
          </View>

          {error ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              className="bg-destructive/10 flex-row items-start gap-2 rounded-xl px-3 py-2.5">
              <View className="pt-px">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={16}
                  strokeWidth={1.8}
                  color={dangerColor}
                />
              </View>
              <Text className="text-destructive flex-1 text-[13px] leading-[19px]">{error}</Text>
            </Animated.View>
          ) : null}

          <Button
            size="lg"
            onPress={handleSubmitPress}
            disabled={!canSubmit}
            className="h-14 rounded-2xl active:scale-[0.96]">
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
              />
            ) : null}
            <Text className="text-base font-semibold">
              {loading ? 'Creating account…' : 'Create account'}
            </Text>
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(420)}
          className="flex-row items-center justify-center gap-1.5">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/sign-in" className="px-2 py-2">
            <Text className="text-primary text-sm font-semibold">Sign in</Text>
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
