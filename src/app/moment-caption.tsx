import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { uploadMomentMedia } from '@/lib/supabase-storage';
import { createMoment } from '@/queries/moments';

const CAPTION_LIMIT = 140;
const COUNTER_VISIBLE_FROM = 100;
const SEND_SPRING = { damping: 20, stiffness: 400, mass: 0.6 };
const CONTROLS_SPRING = { damping: 11, stiffness: 170, mass: 0.9 };

export default function MomentCaptionScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { session } = useAuth();
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const remaining = CAPTION_LIMIT - caption.length;
  const sendScale = useSharedValue(1);
  const controlsScale = useSharedValue(1);

  useEffect(() => {
    controlsScale.set(withSpring(keyboardVisible ? 0 : 1, CONTROLS_SPRING));
  }, [controlsScale, keyboardVisible]);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.get() }],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlsScale.get() }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: withTiming(sharing ? 0.5 : 1, { duration: 260 }),
    transform: [{ scale: withTiming(sharing ? 0.98 : 1, { duration: 260 }) }],
  }));

  async function handleShare() {
    if (!session || sharing || !uri) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setSharing(true);
    try {
      const mediaPath = await uploadMomentMedia(session.user.id, uri);
      await createMoment({ media_path: mediaPath, caption: caption.trim() || null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismissTo('/');
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong'));
      setSharing(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable className="px-6 pt-4" onPress={Keyboard.dismiss} accessible={false}>
            <Animated.View style={cardStyle} className="overflow-hidden rounded-[48px] bg-white/[0.06] p-2">
              <View className="aspect-square w-full overflow-hidden rounded-[40px] bg-neutral-900">
                <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={220} />
                <View
                  pointerEvents="none"
                  className="absolute inset-0 rounded-[40px] border border-white/10"
                />
              </View>

              <View className="px-4 pb-2 pt-3">
                <Input
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a tiny caption (optional)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  maxLength={CAPTION_LIMIT}
                  multiline
                  editable={!sharing}
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={Keyboard.dismiss}
                  keyboardAppearance="dark"
                  selectionColor="#ffffff"
                  className="h-auto min-h-11 w-full border-transparent bg-transparent px-0 py-0 leading-6 text-white shadow-none dark:bg-transparent"
                />

                <View className="h-4 justify-center">
                  {caption.length >= COUNTER_VISIBLE_FROM ? (
                    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
                      <Text
                        className={`text-right text-caption tabular-nums ${remaining <= 20 ? 'text-white/70' : 'text-white/30'}`}>
                        {remaining}
                      </Text>
                    </Animated.View>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>

        <View className="flex-1 items-center justify-center">
          <Animated.View
            pointerEvents={keyboardVisible ? 'none' : 'auto'}
            style={controlsStyle}
            className="w-full flex-row items-center justify-center px-9">
            <Pressable
              onPress={() => router.back()}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel="Discard this moment"
              className={`absolute left-9 size-14 items-center justify-center rounded-full border border-white/10 bg-white/10 active:scale-[0.96] active:opacity-70 ${sharing ? 'opacity-30' : ''}`}>
              <HugeiconsIcon icon={Cancel01Icon} color="white" size={22} strokeWidth={1.75} />
            </Pressable>

            <Animated.View style={sendStyle}>
              <Pressable
                onPress={handleShare}
                onPressIn={() => {
                  sendScale.set(withSpring(0.93, SEND_SPRING));
                }}
                onPressOut={() => {
                  sendScale.set(withSpring(1, SEND_SPRING));
                }}
                disabled={sharing || !uri}
                accessibilityRole="button"
                accessibilityLabel="Share moment"
                accessibilityState={{ disabled: sharing || !uri, busy: sharing }}
                className={`size-[78px] items-center justify-center rounded-full border-[3px] border-white/90 shadow-lg shadow-black/40 ${uri ? '' : 'opacity-40'}`}>
                <View className="size-[62px] items-center justify-center rounded-full bg-white">
                  {sharing ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <HugeiconsIcon icon={SentIcon} color="black" size={26} strokeWidth={2.25} />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <View className="min-h-10 w-full justify-center px-9 pt-4">
            {sharing ? (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
                <Text className="text-center text-footnote text-white/50">Sharing…</Text>
              </Animated.View>
            ) : error ? (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
                <Text numberOfLines={2} className="text-center text-footnote text-red-400">
                  {error}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
