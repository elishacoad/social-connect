import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChatCircleIcon, CheckIcon, PaperPlaneRightIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentActionsMenu } from '@/components/moment-actions-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { MomentReply, useMomentReplies } from '@/hooks/use-moment-replies';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { createReply } from '@/queries/moment-replies';
import { deleteMoment, getMoment, updateMomentCaption } from '@/queries/moments';
import { formatRelativeLabel } from '@/utils/format-relative';

type Moment = Awaited<ReturnType<typeof getMoment>>;

function ReplyRow({ reply }: { reply: MomentReply }) {
  return (
    <View className="flex-row items-start gap-2.5 px-6 py-2.5">
      <Avatar alt={reply.author?.display_name ?? ''} className="mt-0.5 size-8">
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
      <View className="flex-1 gap-0.5 rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text className="text-sm font-semibold">{reply.author?.display_name}</Text>
          <Text variant="muted" className="text-[11px]">
            {formatRelativeLabel(reply.created_at)}
          </Text>
        </View>
        <Text className="text-sm leading-5">{reply.body}</Text>
      </View>
    </View>
  );
}

function EmptyReplies() {
  return (
    <View className="items-center gap-2 px-6 py-10">
      <ChatCircleIcon color="#8a8a90" size={28} />
      <Text variant="muted" className="text-center text-sm">
        No replies yet. Be the first to say something.
      </Text>
    </View>
  );
}

export default function MomentDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { session } = useAuth();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const { replies, loading } = useMomentReplies(id);

  const isOwn = !!moment && !!session && moment.author_id === session.user.id;

  useEffect(() => {
    getMoment(id)
      .then((m) => {
        setMoment(m);
        if (edit === '1') {
          setCaptionDraft(m.caption ?? '');
          setEditing(true);
        }
        return getMomentMediaUrl(m.media_path);
      })
      .then(setUrl)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function startEdit() {
    if (!moment) return;
    setCaptionDraft(moment.caption ?? '');
    setEditing(true);
  }

  async function saveCaption() {
    if (!moment || savingCaption) return;
    setSavingCaption(true);
    try {
      const updated = await updateMomentCaption(moment.id, captionDraft.trim());
      setMoment(updated);
      setEditing(false);
    } catch {
      Alert.alert('Something went wrong', 'Could not save that caption. Try again.');
    } finally {
      setSavingCaption(false);
    }
  }

  function confirmDelete() {
    if (!moment) return;
    Alert.alert('Delete moment?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMoment(moment.id);
            router.dismissTo('/');
          } catch {
            Alert.alert('Something went wrong', 'Could not delete that moment. Try again.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: '',
          headerRight: isOwn ? () => <MomentActionsMenu onEdit={startEdit} onDelete={confirmDelete} /> : undefined,
        }}
      />
      <ScrollView className="flex-1">
        {moment ? (
          <View className="gap-2 p-6 pt-2">
            <View className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
              {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" /> : null}
            </View>

            <View className="mt-2 flex-row items-center gap-2">
              <Avatar alt={moment.author?.display_name ?? ''} className="size-7">
                {moment.author?.avatar_url ? (
                  <AvatarImage source={{ uri: moment.author.avatar_url }} />
                ) : (
                  <AvatarFallback>
                    <Text className="border-0 text-xs">
                      {moment.author?.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </AvatarFallback>
                )}
              </Avatar>
              <Text className="font-semibold">{moment.author?.display_name ?? 'Someone'}</Text>
              <Text variant="muted" className="text-xs">
                · {formatRelativeLabel(moment.created_at)}
              </Text>
            </View>

            {editing ? (
              <View className="gap-2">
                <Input
                  value={captionDraft}
                  onChangeText={setCaptionDraft}
                  placeholder="Add a caption…"
                  maxLength={140}
                  multiline
                  autoFocus
                  className="h-auto py-2"
                />
                <View className="flex-row justify-end gap-2">
                  <Pressable
                    onPress={() => setEditing(false)}
                    disabled={savingCaption}
                    className="flex-row items-center gap-1 rounded-full border border-border px-3.5 py-2 active:bg-accent">
                    <XIcon color="#8a8a90" size={16} />
                    <Text className="text-sm">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveCaption}
                    disabled={savingCaption}
                    className="flex-row items-center gap-1 rounded-full bg-primary px-3.5 py-2 active:bg-primary/90">
                    {savingCaption ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <>
                        <CheckIcon color="white" size={16} weight="bold" />
                        <Text className="text-sm text-primary-foreground">Save</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : moment.caption ? (
              <Text className="text-sm leading-5">{moment.caption}</Text>
            ) : null}
          </View>
        ) : null}

        <View className="border-t border-border pb-4 pt-2">
          {!loading && replies.length === 0 ? <EmptyReplies /> : null}
          {replies.map((reply) => (
            <ReplyRow key={reply.id} reply={reply} />
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background">
        <View className="flex-row items-end gap-2 px-4 py-3">
          <Input
            value={body}
            onChangeText={setBody}
            placeholder="Reply…"
            maxLength={500}
            multiline
            className="h-auto max-h-28 flex-1 rounded-full py-2.5"
          />
          <Pressable
            onPress={handleSend}
            disabled={!body.trim() || sending}
            className="size-10 items-center justify-center rounded-full bg-primary active:bg-primary/90 disabled:opacity-40">
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <PaperPlaneRightIcon color="white" size={18} weight="fill" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
