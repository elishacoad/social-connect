import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChatCircleIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { FeedMoment, useFeed } from '@/hooks/use-feed';
import { useFriends } from '@/hooks/use-friends';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { freshnessRatio } from '@/utils/fade';
import { formatRelativeLabel } from '@/utils/format-relative';

function MomentCard({ moment, ratio }: { moment: FeedMoment; ratio: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const replyCount = moment.moment_replies?.[0]?.count ?? 0;

  useEffect(() => {
    getMomentMediaUrl(moment.media_path)
      .then(setUrl)
      .catch(() => setUrl(null));
  }, [moment.media_path]);

  return (
    <Link href={{ pathname: '/moment/[id]', params: { id: moment.id } }} asChild>
      <Pressable
        className="gap-1 rounded-2xl bg-card p-3 active:opacity-80"
        style={{ opacity: 0.4 + 0.6 * ratio }}>
        <View className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
          {url ? <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" /> : null}
        </View>
        <Text className="font-semibold">{moment.author?.display_name ?? 'Someone'}</Text>
        {moment.caption ? <Text className="text-sm">{moment.caption}</Text> : null}
        <View className="flex-row items-center justify-between">
          <Text variant="muted" className="text-xs">
            {formatRelativeLabel(moment.created_at)}
          </Text>
          {replyCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <ChatCircleIcon color="#8a8a90" size={14} />
              <Text variant="muted" className="text-xs">
                {replyCount}
              </Text>
            </View>
          ) : null}
        </View>
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
        renderItem={({ item }) => <MomentCard moment={item} ratio={ratioFor(item.author_id)} />}
        contentContainerClassName="grow gap-3 px-6 pb-8"
        ListEmptyComponent={!loading ? EmptyFeed : null}
        ListFooterComponent={moments.length > 0 ? Exhausted : null}
        className="flex-1"
      />
    </SafeAreaView>
  );
}
