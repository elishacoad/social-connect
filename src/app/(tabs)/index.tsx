import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { ChatCircleIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentActionsMenu } from '@/components/moment-actions-menu';
import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { FeedMoment, useFeed } from '@/hooks/use-feed';
import { useFriends } from '@/hooks/use-friends';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { deleteMoment } from '@/queries/moments';
import { freshnessRatio } from '@/utils/fade';
import { formatRelativeLabel } from '@/utils/format-relative';

function MomentCard({ moment, ratio, isOwn }: { moment: FeedMoment; ratio: number; isOwn: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const replyCount = moment.moment_replies?.[0]?.count ?? 0;

  useEffect(() => {
    getMomentMediaUrl(moment.media_path)
      .then(setUrl)
      .catch(() => setUrl(null));
  }, [moment.media_path]);

  function confirmDelete() {
    Alert.alert('Delete moment?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMoment(moment.id).catch(() => Alert.alert('Something went wrong')),
      },
    ]);
  }

  return (
    <Link href={{ pathname: '/moment/[id]', params: { id: moment.id } }} asChild>
      <Pressable
        className="gap-1 rounded-2xl bg-card p-3 active:opacity-80"
        style={{ opacity: 0.4 + 0.6 * ratio }}>
        <View className="flex-row items-center gap-2">
          <Avatar alt={moment.author?.display_name ?? ''} className="size-8">
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
          <View className="flex-1 gap-0.5">
            <Text className="font-semibold">{moment.author?.display_name ?? 'Someone'}</Text>
            <Text variant="muted" className="text-xs">
              {formatRelativeLabel(moment.created_at)}
            </Text>
          </View>
          {isOwn ? (
            <MomentActionsMenu
              onEdit={() => router.push({ pathname: '/moment/[id]', params: { id: moment.id, edit: '1' } })}
              onDelete={confirmDelete}
            />
          ) : null}
        </View>
        <View className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
          {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" /> : null}
        </View>
        {moment.caption ? <Text className="text-sm">{moment.caption}</Text> : null}
        {replyCount > 0 ? (
          <View className="flex-row items-center gap-1">
            <ChatCircleIcon color="#8a8a90" size={14} />
            <Text variant="muted" className="text-xs">
              {replyCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

function EmptyFeed() {
  return (
    <View className="flex-1 items-center justify-center gap-3 pt-24">
      <Text variant="h3" className="text-center">
        No moments yet
      </Text>
      <Text variant="muted" className="text-center">
        When friends share a moment, it&apos;ll show up here.
      </Text>
      <Link href="/camera" asChild>
        <Button className="mt-2">
          <Text>Capture a moment</Text>
        </Button>
      </Link>
    </View>
  );
}

function Exhausted() {
  return (
    <View className="items-center py-6">
      <Text variant="muted">You&apos;ve seen everything. That&apos;s the whole point.</Text>
    </View>
  );
}

export default function TimelineScreen() {
  const { session } = useAuth();
  const { moments, loading } = useFeed();
  const { friendships } = useFriends();

  // A fresh friendship makes a friend's moment feel vivid; a drifting one
  // feels muted — the feed's main emotional payoff per design.md. Own
  // moments always render at full freshness.
  function ratioFor(authorId: string) {
    if (authorId === session?.user.id) return 1;
    const friendship = friendships.find((f) => f.friend?.id === authorId);
    return friendship ? freshnessRatio(friendship) : 1;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-6 pb-2 pt-3">
        <ProfileAvatarHeader />
        <Text variant="h2" className="border-0 pb-0 text-left">
          Timeline
        </Text>
      </View>

      <FlatList
        data={moments}
        keyExtractor={(moment) => moment.id}
        renderItem={({ item }) => (
          <MomentCard
            moment={item}
            ratio={ratioFor(item.author_id)}
            isOwn={item.author_id === session?.user.id}
          />
        )}
        contentContainerClassName="grow gap-3 px-6 pb-8"
        ListEmptyComponent={!loading ? EmptyFeed : null}
        ListFooterComponent={moments.length > 0 ? Exhausted : null}
        className="flex-1"
      />
    </SafeAreaView>
  );
}
