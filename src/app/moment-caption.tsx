import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
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
    if (!session) return;
    setError(null);
    setSharing(true);
    try {
      const mediaPath = await uploadMomentMedia(session.user.id, uri);
      await createMoment({ media_path: mediaPath, caption: caption.trim() || null });
      // Timeline/camera daily-post-status re-fetch on focus; no manual refresh needed here.
      router.dismissTo('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSharing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-between px-6 py-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: 16 }}
            contentFit="cover"
          />
          <Input
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a tiny caption (optional)"
            maxLength={140}
            multiline
            className="h-auto w-full py-3"
          />
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
        </View>

        <View className="gap-2">
          <Button onPress={handleShare} disabled={sharing}>
            <Text>{sharing ? 'Sharing…' : 'Share moment'}</Text>
          </Button>
          <Button variant="ghost" onPress={() => router.back()} disabled={sharing}>
            <Text>Discard</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
