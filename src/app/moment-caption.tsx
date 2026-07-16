import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { PaperPlaneRightIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { uploadMomentMedia } from '@/lib/supabase-storage';
import { createMoment } from '@/queries/moments';

export default function MomentCaptionScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { session } = useAuth();
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    if (!session || sharing) return;
    setError(null);
    setSharing(true);
    try {
      const mediaPath = await uploadMomentMedia(session.user.id, uri);
      await createMoment({ media_path: mediaPath, caption: caption.trim() || null });
      router.dismissTo('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSharing(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="items-center gap-4 px-6 pt-4">
            <Input
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a tiny caption (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={140}
              multiline
              className="h-auto w-full border-white/20 bg-white/10 py-3 text-white"
            />

            <View className="aspect-square w-full overflow-hidden rounded-[40px] bg-neutral-900">
              <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" />
            </View>

            {error ? <Text className="text-center text-sm text-red-400">{error}</Text> : null}
          </View>

          <View className="flex-1 flex-row items-center justify-between px-10">
            <Pressable
              onPress={() => router.back()}
              disabled={sharing}
              className="size-12 items-center justify-center rounded-full bg-white/10 active:opacity-70">
              <XIcon color="white" size={22} />
            </Pressable>

            <Pressable
              onPress={handleShare}
              disabled={sharing}
              className="size-[76px] items-center justify-center rounded-full border-4 border-white active:opacity-70">
              <View className="size-[60px] items-center justify-center rounded-full bg-white">
                {sharing ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <PaperPlaneRightIcon color="black" size={26} weight="fill" />
                )}
              </View>
            </Pressable>

            <View className="size-12" />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
