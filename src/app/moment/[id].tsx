import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatIcon, Cancel01Icon, SentIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentActionsMenu } from '@/components/moment-actions-menu';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { MomentReply, isPendingReply, useMomentReplies } from '@/hooks/use-moment-replies';
import { confirmDestructive } from '@/lib/alerts';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { deleteMoment, getMoment, updateMomentCaption } from '@/queries/moments';
import { formatRelativeLabel } from '@/utils/format-relative';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Moment = Awaited<ReturnType<typeof getMoment>>;

function ReplyRow({
  reply,
  mine,
  startsRun,
  endsRun,
  pending,
}: {
  reply: MomentReply;
  mine: boolean;
  startsRun: boolean;
  endsRun: boolean;
  pending: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-end gap-2 px-6',
        startsRun ? 'mt-4' : 'mt-1',
        mine && 'justify-end',
        pending && 'opacity-60'
      )}>
      {!mine ? (
        endsRun ? (
          <UserAvatar person={reply.author} size={8} />
        ) : (
          <View className="size-8" />
        )
      ) : null}

      <View className={cn('max-w-[80%]', mine && 'items-end')}>
        {startsRun && !mine ? (
          <Text variant="label" className="mb-1 ml-1">
            {reply.author?.display_name}
          </Text>
        ) : null}
        <View
          className={cn(
            'rounded-2xl px-3.5 py-2.5',
            mine ? 'bg-primary' : 'bg-muted',
            endsRun && (mine ? 'rounded-br-md' : 'rounded-bl-md')
          )}>
          <Text className={cn(mine && 'text-primary-foreground')}>
            {reply.body}
          </Text>
        </View>
        {endsRun ? (
          <Text variant="micro" className="mx-1 mt-1 tabular-nums">
            {pending ? 'Sending…' : formatRelativeLabel(reply.created_at)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyReplies({ authorName }: { authorName?: string | null }) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-3 px-10 py-8">
      <View className="size-14 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={BubbleChatIcon} color={colors.mutedForeground} size={24} strokeWidth={1.5} />
      </View>
      <View className="gap-1">
        <Text variant="bodyStrong" className="text-center">No replies yet</Text>
        <Text variant="muted" className="text-center">
          {authorName ? `Say something to ${authorName}.` : 'Say something.'}
        </Text>
      </View>
    </View>
  );
}

function MomentSkeleton() {
  return (
    <View className="gap-3 p-6 pt-1">
      <View className="aspect-[4/5] w-full rounded-2xl bg-muted" />
      <View className="h-3 w-20 rounded-full bg-muted" />
      <View className="h-4 w-2/3 rounded-full bg-muted" />
    </View>
  );
}

export default function MomentDetailScreen() {
  const colors = useThemeColors();
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { session, profile } = useAuth();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const { replies, loading, error, send, sending } = useMomentReplies(id);

  const isOwn = !!moment && !!session && moment.author_id === session.user.id;
  const canSend = body.trim().length > 0 && !sending;
  const captionDirty = !!moment && captionDraft.trim() !== (moment.caption ?? '');

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
    if (!body.trim() || sending || !session) return;
    const draft = body.trim();
    setSendError(null);
    setBody('');
    try {
      await send(
        {
          id: session.user.id,
          display_name: profile?.display_name ?? '',
          username: profile?.username ?? '',
          avatar_url: profile?.avatar_url ?? null,
        },
        draft
      );
    } catch (err) {
      setBody(draft);
      setSendError(errorMessage(err, 'Could not send that reply. Try again.'));
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
    confirmDestructive({
      title: 'Delete moment?',
      onConfirm: async () => {
        await deleteMoment(moment.id);
        router.dismissTo('/');
      },
      failureMessage: 'Could not delete that moment. Try again.',
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: '',
          headerShadowVisible: false,
          headerTitle: () =>
            moment ? (
              <View className="flex-row items-center gap-2">
                <UserAvatar person={moment.author} size={6} />
                <Text variant="bodyStrong">
                  {moment.author?.display_name ?? 'Someone'}
                </Text>
              </View>
            ) : (
              <View />
            ),
          headerRight: isOwn ? () => <MomentActionsMenu onEdit={startEdit} onDelete={confirmDelete} /> : undefined,
        }}
      />
      <ScrollView
        className="flex-1"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-6">
        {moment ? (
          <View className="gap-3 p-6 pt-1">
            <View className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
              {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" /> : null}
              <View
                pointerEvents="none"
                className="absolute inset-0 rounded-2xl border border-black/10 dark:border-white/10"
              />
            </View>

            <Text variant="overline">
              {formatRelativeLabel(moment.created_at)}
            </Text>

            {editing ? (
              <View className="gap-2">
                <Input
                  value={captionDraft}
                  onChangeText={setCaptionDraft}
                  placeholder="Add a caption…"
                  maxLength={140}
                  multiline
                  autoFocus
                  className="h-auto rounded-2xl py-2.5 leading-6"
                />
                <View className="flex-row items-center justify-end gap-2">
                  <Text variant="micro" className="mr-auto tabular-nums">
                    {captionDraft.length}/140
                  </Text>
                  <Button
                    variant="outline"
                    size="pill"
                    onPress={() => setEditing(false)}
                    disabled={savingCaption}>
                    <HugeiconsIcon icon={Cancel01Icon} color={colors.mutedForeground} size={16} />
                    <Text>Cancel</Text>
                  </Button>
                  <Button
                    size="pill"
                    className="min-w-[92px]"
                    onPress={saveCaption}
                    loading={savingCaption}
                    disabled={!captionDirty}>
                    <HugeiconsIcon icon={Tick02Icon} color="white" size={16} strokeWidth={2.5} />
                    <Text>Save</Text>
                  </Button>
                </View>
              </View>
            ) : moment.caption ? (
              <Text>{moment.caption}</Text>
            ) : null}
          </View>
        ) : (
          <MomentSkeleton />
        )}

        <View className="border-t border-border pb-2 pt-1">
          {error ? (
            <Text variant="muted" className="px-6 py-6 text-center">
              Could not load replies.
            </Text>
          ) : null}
          {!loading && !error && replies.length === 0 ? (
            <EmptyReplies authorName={moment?.author?.display_name} />
          ) : null}
          {replies.map((reply, index) => {
            const previous = replies[index - 1];
            const next = replies[index + 1];
            return (
              <ReplyRow
                key={reply.id}
                reply={reply}
                mine={reply.author_id === session?.user.id}
                startsRun={previous?.author_id !== reply.author_id}
                endsRun={next?.author_id !== reply.author_id}
                pending={isPendingReply(reply)}
              />
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background">
        {sendError ? (
          <Text className="text-destructive px-4 pt-2 text-footnote">{sendError}</Text>
        ) : null}
        <View className="flex-row items-end gap-2 px-4 py-3">
          <Input
            value={body}
            onChangeText={setBody}
            placeholder="Reply…"
            maxLength={500}
            multiline
            className="h-auto max-h-28 flex-1 rounded-full border-transparent bg-muted px-4 py-2.5 leading-5 shadow-none"
          />
          <Button size="iconPill" onPress={handleSend} loading={sending} disabled={!canSend}>
            <HugeiconsIcon
              icon={SentIcon}
              color={canSend ? 'white' : colors.mutedForeground}
              size={18}
              strokeWidth={2.5}
            />
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
