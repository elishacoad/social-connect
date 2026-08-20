import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  QrCodeIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Colors } from '@/constants/theme';
import { useConnectSession } from '@/hooks/use-connect-session';
import { cancelConnectSession, matchConnectSession } from '@/queries/connect-sessions';
import { useConnectStore } from '@/stores/connect-store';

const QR_SIZE = 208;

export default function ConnectScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { status, sessionId, token } = useConnectSession();
  const reset = useConnectStore((s) => s.reset);
  const setMatched = useConnectStore((s) => s.setMatched);
  const setError = useConnectStore((s) => s.setError);
  const error = useConnectStore((s) => s.error);
  const hasScannedRef = useRef(false);

  const isReconnect = Boolean(friendId);

  useEffect(() => {
    reset(friendId ?? null);
  }, [friendId, reset]);

  useEffect(() => {
    if (status === 'matched') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status]);

  async function handleScanned({ data }: { data: string }) {
    if (hasScannedRef.current || !sessionId) return;
    hasScannedRef.current = true;
    try {
      const friendshipId = await matchConnectSession(data, sessionId);
      setMatched(friendshipId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
      hasScannedRef.current = false;
    }
  }

  function handleCancel() {
    if (sessionId) cancelConnectSession(sessionId).catch(() => {});
    router.back();
  }

  function handleRetry() {
    hasScannedRef.current = false;
    reset(friendId ?? null);
  }

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;

    return (
      <SafeAreaView className="flex-1 bg-background">
        <ModalHeader onClose={() => router.back()} />
        <View className="flex-1 items-center justify-center gap-6 px-8 pb-16">
          <Animated.View
            entering={FadeIn.duration(240)}
            className="size-24 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={QrCodeIcon} size={38} color="#8a8a90" strokeWidth={1.5} />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(280).delay(80)} className="gap-2">
            <Text variant="h3" className="text-center">
              Connecting needs the camera
            </Text>
            <Text variant="muted" className="max-w-[19rem] text-center leading-5">
              {blocked
                ? 'Camera access is off for this app. Turn it on in Settings and come back — nothing is recorded, it only reads your friend’s code.'
                : 'You and your friend point your phones at each other. Nothing is recorded — the camera only reads their code.'}
            </Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.duration(280).delay(160)}
            className="mt-2 w-full max-w-[20rem] gap-2">
            <Button
              size="lg"
              className="active:scale-[0.96]"
              onPress={() => (blocked ? Linking.openSettings() : requestPermission())}>
              {blocked ? (
                <HugeiconsIcon icon={Settings01Icon} size={18} color="white" strokeWidth={2} />
              ) : null}
              <Text>{blocked ? 'Open Settings' : 'Allow camera access'}</Text>
            </Button>
            <Button variant="ghost" size="lg" onPress={() => router.back()}>
              <Text>Not now</Text>
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'matched') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-6 px-8 pb-16">
          <Animated.View
            entering={FadeIn.duration(320)}
            className="size-24 items-center justify-center rounded-full bg-foreground/5">
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              size={44}
              color="#3f9a6a"
              strokeWidth={1.75}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(320).delay(120)} className="gap-2">
            <Text variant="h3" className="text-center">
              {isReconnect ? 'Welcome back' : 'You’re connected'}
            </Text>
            <Text variant="muted" className="max-w-[19rem] text-center leading-5">
              {isReconnect
                ? 'Good to see them again. Their moments are vivid in your timeline once more.'
                : 'Their moments will start showing up in your timeline — and yours in theirs.'}
            </Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.duration(320).delay(240)}
            className="mt-2 w-full max-w-[20rem] gap-2">
            <Button size="lg" className="active:scale-[0.96]" onPress={handleRetry}>
              <Text>Connect with someone else</Text>
            </Button>
            <Button variant="ghost" size="lg" onPress={() => router.back()}>
              <Text>Done</Text>
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ModalHeader onClose={handleCancel} />
        <View className="flex-1 items-center justify-center gap-6 px-8 pb-16">
          <View className="size-24 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Alert02Icon} size={38} color="#8a8a90" strokeWidth={1.5} />
          </View>
          <View className="gap-2">
            <Text variant="h3" className="text-center">
              That didn’t take
            </Text>
            <Text variant="muted" className="max-w-[19rem] text-center leading-5">
              {error ?? 'Something interrupted the connection.'} Stay together and try once more.
            </Text>
          </View>
          <View className="mt-2 w-full max-w-[20rem] gap-2">
            <Button size="lg" className="active:scale-[0.96]" onPress={handleRetry}>
              <Text>Try again</Text>
            </Button>
            <Button variant="ghost" size="lg" onPress={handleCancel}>
              <Text>Not now</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScanned}
      />
      {/* Keeps the copy and QR legible over an arbitrarily bright camera feed. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill} className="bg-black/40" />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ModalHeader onClose={handleCancel} light />

        <View className="flex-1 items-center justify-center gap-9 px-8 pb-10">
          <Animated.View entering={FadeInDown.duration(300)} className="gap-2">
            <Text variant="h3" className="text-center text-white">
              Point your phones at each other
            </Text>
            <Text className="max-w-[19rem] text-center leading-5 text-white/70">
              Hold them face to face for a second. You’ll both feel it when it lands.
            </Text>
          </Animated.View>

          <View className="items-center justify-center">
            <PulseRing />
            <PulseRing delay={1200} />
            <Animated.View
              entering={FadeIn.duration(400).delay(120)}
              className="rounded-[28px] bg-white/95 p-5 shadow-lg shadow-black/25">
              <View className="overflow-hidden rounded-lg" style={{ width: QR_SIZE, height: QR_SIZE }}>
                {token ? (
                  <QRCode value={token} size={QR_SIZE} />
                ) : (
                  <BreathingView className="size-full rounded-lg bg-neutral-200" />
                )}
              </View>
            </Animated.View>
          </View>

          <BreathingView className="flex-row items-center gap-2">
            <View className="size-2 rounded-full bg-white/50" />
            <Text className="text-white/70">{isReconnect ? 'Reconnecting…' : 'Finding each other…'}</Text>
          </BreathingView>
        </View>

        <View className="px-8 pb-2">
          <Button variant="ghost" size="lg" onPress={handleCancel}>
            <Text className="text-white">Cancel</Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModalHeader({ onClose, light }: { onClose: () => void; light?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="h-12 flex-row items-center justify-end px-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
        onPress={onClose}
        className={cn(
          'size-11 items-center justify-center rounded-full',
          light ? 'active:bg-white/20' : 'active:bg-muted'
        )}>
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={22}
          color={light ? '#ffffff' : colors.text}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

function PulseRing({ delay = 0 }: { delay?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false)
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - progress.value),
    transform: [{ scale: 0.92 + progress.value * 0.32 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={style}
      className="absolute size-[268px] rounded-[38px] border border-white/50"
    />
  );
}

function BreathingView({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({ opacity: 0.45 + progress.value * 0.55 }));

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  );
}
