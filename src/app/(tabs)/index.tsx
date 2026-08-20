import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatIcon, Camera01Icon } from '@hugeicons/core-free-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentActionsMenu } from '@/components/moment-actions-menu';
import { ScreenHeader } from '@/components/screen-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth } from '@/hooks/use-auth';
import { FeedMoment, useFeed } from '@/hooks/use-feed';
import { useFriends } from '@/hooks/use-friends';
import { confirmDestructive } from '@/lib/alerts';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { deleteMoment } from '@/queries/moments';
import { freshnessRatio } from '@/utils/fade';
import { formatRelativeLabel } from '@/utils/format-relative';

function MomentCard({
  moment,
  ratio,
  isOwn,
  onDeleted,
}: {
  moment: FeedMoment;
  ratio: number;
  isOwn: boolean;
  onDeleted: (id: string) => void;
}) {
  const colors = useThemeColors();
  const [url, setUrl] = useState<string | null>(null);
  const replyCount = moment.moment_replies?.[0]?.count ?? 0;

  useEffect(() => {
    getMomentMediaUrl(moment.media_path)
      .then(setUrl)
      .catch(() => setUrl(null));
  }, [moment.media_path]);

  function confirmDelete() {
    confirmDestructive({
      title: 'Delete moment?',
      onConfirm: () => deleteMoment(moment.id).then(() => onDeleted(moment.id)),
      failureMessage: 'Could not delete that moment. Try again.',
    });
  }

  // The photo carries the drift, not the chrome — a faded friend's name and
  // timestamp stay fully legible while their memory goes quiet.
  const mediaOpacity = 0.35 + 0.65 * ratio;
  const chromeOpacity = 0.65 + 0.35 * ratio;

  return (
    <Link href={{ pathname: '/moment/[id]', params: { id: moment.id } }} asChild>
      <Pressable
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.94 : 1,
        })}>
        <View className="flex-row items-center gap-2.5 pb-2.5">
          <UserAvatar person={moment.author} size={9} style={{ opacity: chromeOpacity }} />
          <View className="flex-1 gap-px">
            <Text numberOfLines={1} variant="bodyStrong">
              {moment.author?.display_name ?? 'Someone'}
            </Text>
            <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
              {formatRelativeLabel(moment.created_at)}
            </Text>
          </View>
          {isOwn ? (
            <View className="-mr-0.5">
              <MomentActionsMenu
                onEdit={() =>
                  router.push({ pathname: '/moment/[id]', params: { id: moment.id, edit: '1' } })
                }
                onDelete={confirmDelete}
              />
            </View>
          ) : null}
        </View>

        <View className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
          {url ? (
            <Image
              source={{ uri: url }}
              style={{ flex: 1, opacity: mediaOpacity }}
              contentFit="cover"
              transition={220}
            />
          ) : null}
          <View
            pointerEvents="none"
            className="absolute inset-0 rounded-2xl border border-black/10 dark:border-white/10"
          />
        </View>

        {moment.caption || replyCount > 0 ? (
          <View className="gap-1.5 pt-2.5" style={{ opacity: chromeOpacity }}>
            {moment.caption ? (
              <Text>{moment.caption}</Text>
            ) : null}
            {replyCount > 0 ? (
              <View className="flex-row items-center gap-1.5">
                <HugeiconsIcon icon={BubbleChatIcon} color={colors.mutedForeground} size={14} strokeWidth={2} />
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

function SkeletonFeed() {
  const [pulse] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View className="gap-6">
      {[0, 1].map((index) => (
        <Animated.View
          key={index}
          style={{ opacity: pulse }}>
          <View className="flex-row items-center gap-2.5 pb-2.5">
            <View className="size-9 rounded-full bg-muted" />
            <View className="gap-1.5">
              <View className="h-3 w-32 rounded-full bg-muted" />
              <View className="h-2.5 w-16 rounded-full bg-muted" />
            </View>
          </View>
          <View className="aspect-[4/5] w-full rounded-2xl bg-muted" />
          <View className="px-1 pb-1 pt-3">
            <View className="h-3 w-40 rounded-full bg-muted" />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function EmptyFeed() {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-4 pb-16">
      <View className="mb-1 size-16 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={Camera01Icon} color={colors.mutedForeground} size={28} strokeWidth={1.5} />
      </View>
      <Text variant="h3" className="text-center">
        No moments yet
      </Text>
      <Text variant="muted" className="max-w-[16rem] text-center leading-relaxed">
        When friends share a moment, it&apos;ll show up here.
      </Text>
      <Link href="/camera" asChild>
        <Button className="mt-3 active:scale-[0.96]">
          <Text>Capture a moment</Text>
        </Button>
      </Link>
    </View>
  );
}

function Exhausted() {
  return (
    <View className="items-center gap-3 pb-2 pt-10">
      <View className="h-px w-10 bg-border" />
      <Text variant="caption" className="text-center">
        You&apos;ve seen everything. That&apos;s the whole point.
      </Text>
    </View>
  );
}

export default function TimelineScreen() {
  const { session } = useAuth();
  const { moments, loading, refresh, removeMoment } = useFeed();
  const { friendships, refresh: refreshFriends } = useFriends();
  const [refreshing, setRefreshing] = useState(false);

  // A fresh friendship makes a friend's moment feel vivid; a drifting one
  // feels muted — the feed's main emotional payoff per design.md. Own
  // moments always render at full freshness.
  function ratioFor(authorId: string) {
    if (authorId === session?.user.id) return 1;
    const friendship = friendships.find((f) => f.friend?.id === authorId);
    return friendship ? freshnessRatio(friendship) : 1;
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshFriends()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Timeline" />

      <FlatList
        data={moments}
        keyExtractor={(moment) => moment.id}
        renderItem={({ item }) => (
          <MomentCard
            moment={item}
            ratio={ratioFor(item.author_id)}
            isOwn={item.author_id === session?.user.id}
            onDeleted={removeMoment}
          />
        )}
        contentContainerClassName="grow gap-6 px-5 pb-10 pt-1"
        ListEmptyComponent={loading ? SkeletonFeed : EmptyFeed}
        ListFooterComponent={moments.length > 0 ? Exhausted : null}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        className="flex-1"
      />
    </SafeAreaView>
  );
}
