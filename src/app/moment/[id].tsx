import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { MomentReply, useMomentReplies } from '@/hooks/use-moment-replies';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { createReply } from '@/queries/moment-replies';
import { getMoment } from '@/queries/moments';
import { formatRelativeLabel } from '@/utils/format-relative';

type Moment = Awaited<ReturnType<typeof getMoment>>;

function ReplyRow({ reply }: { reply: MomentReply }) {
  return (
    <View className="flex-row items-start gap-2 px-6 py-2">
      <Avatar alt={reply.author?.display_name ?? ''} className="size-8">
        {reply.author?.avatar_url ? (
          <AvatarImage source={{ uri: reply.author.avatar_url }} />
        ) : (
          <AvatarFallback>
            <Text className="border-0 text-xs">
              {reply.author?.display_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </AvatarFallback>
        )}
      </Avatar>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold">{reply.author?.display_name}</Text>
        <Text className="text-sm">{reply.body}</Text>
      </View>
    </View>
  );
}

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const { replies, loading } = useMomentReplies(id);

  useEffect(() => {
    getMoment(id)
      .then((m) => {
        setMoment(m);
        return getMomentMediaUrl(m.media_path);
      })
      .then(setUrl)
      .catch(() => {});
  }, [id]);

  async function handleSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await createReply(id, body.trim());
      setBody('');
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <Stack.Screen options={{ title: '' }} />
      <ScrollView className="flex-1">
        {moment ? (
          <View className="gap-1 p-6 pt-2">
            <View className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
              {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" /> : null}
            </View>
            <Text className="mt-2 font-semibold">{moment.author?.display_name ?? 'Someone'}</Text>
            {moment.caption ? <Text className="text-sm">{moment.caption}</Text> : null}
            <Text variant="muted" className="text-xs">
              {formatRelativeLabel(moment.created_at)}
            </Text>
          </View>
        ) : null}

        <View className="gap-1 pb-4">
          {!loading && replies.length === 0 ? (
            <Text variant="muted" className="px-6 text-sm">
              No replies yet.
            </Text>
          ) : null}
          {replies.map((reply) => (
            <ReplyRow key={reply.id} reply={reply} />
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 border-t border-border px-4 py-3">
        <Input
          value={body}
          onChangeText={setBody}
          placeholder="Reply…"
          maxLength={500}
          multiline
          className="h-auto flex-1 py-2"
        />
        <Button onPress={handleSend} disabled={!body.trim() || sending} size="sm">
          <Text>Send</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
