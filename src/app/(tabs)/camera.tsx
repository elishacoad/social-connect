import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  CameraRotated01Icon,
  FlashIcon,
  FlashOffIcon,
} from '@hugeicons/core-free-icons';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/use-theme-colors';

const SHUTTER_SPRING = { damping: 20, stiffness: 400, mass: 0.6 };

export default function CameraScreen() {
  const colors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const shutterScale = useSharedValue(1);

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.get() }],
  }));

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center gap-3 px-6 pb-20">
          <View className="bg-muted/40 mb-2 size-28 items-center justify-center rounded-full">
            <View className="bg-muted size-20 items-center justify-center rounded-full">
              <HugeiconsIcon icon={Camera01Icon} color={colors.mutedForeground} size={32} strokeWidth={1.25} />
            </View>
          </View>
          <Text variant="h3" className="text-center">
            Camera access needed
          </Text>
          <Text variant="muted" className="max-w-[17rem] text-center leading-relaxed">
            Social Connect uses your camera to capture moments and connect with friends in person.
          </Text>
          <Button size="lg" onPress={requestPermission} className="mt-4 active:scale-[0.96]">
            <Text>Allow camera access</Text>
          </Button>
          <Text variant="muted" className="mt-1 text-center text-xs opacity-70">
            You can change this later in Settings.
          </Text>
        </View>
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
        // photo.width/height come back in points, not the raw capture's actual pixel
        // dimensions (they disagree whenever the capture scale isn't 1x), so re-measure
        // the real image before cropping instead of trusting them.
        const { width, height } = await manipulateAsync(photo.uri, []);

        // The preview crops the live feed to a square, but the raw capture keeps the
        // sensor's full (non-square) aspect ratio — crop to match what was framed.
        const size = Math.min(width, height);
        const cropped = await manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: (width - size) / 2,
                originY: (height - size) / 2,
                width: size,
                height: size,
              },
            },
          ],
          { compress: 0.9, format: SaveFormat.JPEG }
        );
        router.push({ pathname: '/moment-caption', params: { uri: cropped.uri } });
      }
    } finally {
      setCapturing(false);
    }
  }

  const flashOn = flash === 'on';

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="px-4 pt-2">
          <ProfileAvatarHeader />
        </View>

        <View className="items-center px-6 pt-4">
          <View className="aspect-square w-full overflow-hidden rounded-[40px] bg-neutral-900">
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash} />
            <View className="absolute inset-0 rounded-[40px] border border-white/10" />
            {capturing ? (
              <Animated.View
                entering={FadeIn.duration(80)}
                exiting={FadeOut.duration(260)}
                className="absolute inset-0 bg-white"
              />
            ) : null}
          </View>
        </View>

        <View className="flex-1 flex-row items-center justify-between px-9 pb-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
            onPress={() => setFlash((current) => (current === 'off' ? 'on' : 'off'))}
            className={cn(
              'size-14 items-center justify-center rounded-full border active:opacity-70',
              flashOn ? 'border-white bg-white' : 'border-white/10 bg-white/10'
            )}>
            <HugeiconsIcon
              icon={flashOn ? FlashIcon : FlashOffIcon}
              color={flashOn ? 'black' : 'white'}
              size={22}
              strokeWidth={flashOn ? 2.5 : 1.75}
            />
          </Pressable>

          <Animated.View style={shutterStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capture moment"
              accessibilityState={{ disabled: capturing }}
              onPress={handleCapture}
              onPressIn={() => {
                shutterScale.set(withSpring(0.93, SHUTTER_SPRING));
              }}
              onPressOut={() => {
                shutterScale.set(withSpring(1, SHUTTER_SPRING));
              }}
              disabled={capturing}
              className="size-[78px] items-center justify-center rounded-full border-[3px] border-white/90 shadow-lg shadow-black/40">
              <View
                className={cn('size-[62px] rounded-full bg-white', capturing && 'opacity-40')}
              />
            </Pressable>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            className="size-14 items-center justify-center rounded-full border border-white/10 bg-white/10 active:opacity-70">
            <HugeiconsIcon icon={CameraRotated01Icon} color="white" size={22} strokeWidth={1.75} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
