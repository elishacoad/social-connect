import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useConnectSession } from '@/hooks/use-connect-session';
import { cancelConnectSession, matchConnectSession } from '@/queries/connect-sessions';
import { useConnectStore } from '@/stores/connect-store';

export default function ConnectScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { status, sessionId, token } = useConnectSession();
  const reset = useConnectStore((s) => s.reset);
  const setMatched = useConnectStore((s) => s.setMatched);
  const setError = useConnectStore((s) => s.setError);
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

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Stack.Screen options={{ title: 'Connect' }} />
        <Text variant="h3" className="text-center">
          Camera access needed
        </Text>
        <Text variant="muted" className="text-center">
          Point your front camera at a friend&apos;s to connect.
        </Text>
        <Button onPress={requestPermission} className="mt-2">
          <Text>Allow camera access</Text>
        </Button>
      </SafeAreaView>
    );
  }

  if (status === 'matched') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Stack.Screen options={{ title: 'Connect' }} />
        <Text variant="h2" className="border-0 text-center">
          {isReconnect ? 'Welcome back' : 'Connected!'}
        </Text>
        <Text variant="muted" className="text-center">
          {isReconnect
            ? 'Good to reconnect with them.'
            : "You're friends now. Their moments will start showing up in your timeline."}
        </Text>
        <View className="mt-4 w-full gap-2">
          <Button onPress={() => reset()}>
            <Text>Connect with someone else</Text>
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            <Text>Done</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Connect' }} />
      {/* Stays mounted and active so it can scan the friend's QR — just not shown. */}
      <CameraView
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        facing="front"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScanned}
      />
      <SafeAreaView className="flex-1 items-center justify-between py-8" edges={['top', 'bottom']}>
        <Text variant="muted" className="px-10 text-center">
          Point your phone at your friend&apos;s to connect
        </Text>

        <View className="items-center gap-4 rounded-3xl bg-white/90 p-6">
          {token ? <QRCode value={token} size={160} /> : null}
          <Text className="text-center text-black">
            {isReconnect ? 'Reconnecting…' : 'Finding each other…'}
          </Text>
        </View>

        <Button variant="secondary" onPress={handleCancel}>
          <Text>Cancel</Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
