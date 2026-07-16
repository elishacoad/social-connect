import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CameraRotateIcon, LightningIcon, LightningSlashIcon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useDailyPostStatus } from '@/hooks/use-daily-post-status';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { postedToday } = useDailyPostStatus();

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text variant="h3" className="text-center">
          Camera access needed
        </Text>
        <Text variant="muted" className="text-center">
          Social Connect uses your camera to capture moments and connect with friends in person.
        </Text>
        <Button onPress={requestPermission} className="mt-2">
          <Text>Allow camera access</Text>
        </Button>
      </View>
    );
  }

  if (postedToday) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-background px-6">
        <Text variant="h3" className="text-center">
          You&apos;ve shared today&apos;s moment
        </Text>
        <Text variant="muted" className="text-center">
          One moment a day keeps it honest. Come back tomorrow.
        </Text>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        router.push({ pathname: '/moment-caption', params: { uri: photo.uri } });
      }
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="px-4 pt-2">
          <ProfileAvatarHeader />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="aspect-square w-full overflow-hidden rounded-[40px] bg-neutral-900">
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash} />
          </View>
        </View>

        <View className="flex-row items-center justify-between px-10 pb-6">
          <Pressable
            onPress={() => setFlash((current) => (current === 'off' ? 'on' : 'off'))}
            className="size-12 items-center justify-center rounded-full bg-white/10 active:opacity-70">
            {flash === 'off' ? (
              <LightningSlashIcon color="white" size={22} />
            ) : (
              <LightningIcon color="white" size={22} weight="fill" />
            )}
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            className="size-[76px] items-center justify-center rounded-full border-4 border-white active:opacity-70">
            <View className="size-[60px] rounded-full bg-white" />
          </Pressable>

          <Pressable
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            className="size-12 items-center justify-center rounded-full bg-white/10 active:opacity-70">
            <CameraRotateIcon color="white" size={22} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
