import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Friendship, useFriends } from '@/hooks/use-friends';
import { freshnessRatio } from '@/utils/fade';
import { useThemeColors } from '@/hooks/use-theme-colors';

function FriendRow({ friendship, drifted = false }: { friendship: Friendship; drifted?: boolean }) {
  const colors = useThemeColors();
  const friend = friendship.friend;
  if (!friend) return null;

  // Recent relationships render vivid; drifting ones desaturate/dim toward
  // the fade cutoff — no numeric score or timestamp shown, purely visual
  // per product.md ("no scores, percentages, or rankings").
  const ratio = drifted ? 0 : freshnessRatio(friendship);
  const presence = 0.45 + 0.55 * ratio;

  return (
    <Link href={{ pathname: '/profile/[id]', params: { id: friend.id } }} asChild>
      <Pressable
        className="flex-row items-center gap-3 py-3 active:opacity-60">
        <View
          className="rounded-full border-2 p-[3px]"
          style={{ borderColor: `rgba(120,120,124,${0.08 + 0.34 * ratio})` }}>
          <UserAvatar person={friend} size={11} style={{ opacity: presence }} />
        </View>
        <Text variant="bodyStrong" className="flex-1" numberOfLines={1} style={{ opacity: presence }}>
          {friend.display_name}
        </Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.mutedForeground} strokeWidth={2} />
      </Pressable>
    </Link>
  );
}

function FriendSeparator() {
  return <View className="h-px bg-border/60" />;
}

function FriendRowSkeleton({ opacity }: { opacity: number }) {
  return (
    <View
      className="flex-row items-center gap-3 py-3"
      style={{ opacity }}>
      <View className="size-[54px] rounded-full bg-muted" />
      <View className="h-4 w-40 rounded-full bg-muted" />
    </View>
  );
}

function EmptyFriends() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center gap-4 px-4 pb-24">
      <View className="size-20 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={UserGroupIcon} size={34} color={colors.mutedForeground} strokeWidth={1.5} />
      </View>
      <Text variant="h3" className="text-center">
        Nobody here yet
      </Text>
      <Text variant="muted" className="max-w-[16rem] text-center leading-5">
        Friends are added in person. Meet up with someone and connect face to face.
      </Text>
      <Link href="/connect" asChild>
        <Button className="mt-1 flex-row gap-2">
          <HugeiconsIcon icon={UserAdd01Icon} size={18} color={colors.background} strokeWidth={2} />
          <Text>Connect</Text>
        </Button>
      </Link>
    </View>
  );
}

function DriftedSection({
  faded,
  expanded,
  onToggle,
}: {
  faded: Friendship[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="pt-4">
      <View className="mb-1 h-px bg-border/70" />
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between py-3 active:opacity-60">
        <View className="flex-row items-center gap-2">
          <Text variant="label">
            Drifted
          </Text>
          <Text variant="muted" className="tabular-nums opacity-70">
            {faded.length}
          </Text>
        </View>
        <HugeiconsIcon
          icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={18}
          color={colors.mutedForeground}
          strokeWidth={2}
        />
      </Pressable>

      {expanded ? (
        <View className="pt-1">
          <Text variant="caption" className="pb-1">
            Still here, just quieter. Meeting again brings them back.
          </Text>
          {faded.map((friendship, i) => (
            <View key={friendship.id ?? ''}>
              {i > 0 ? <FriendSeparator /> : null}
              <FriendRow friendship={friendship} drifted />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useThemeColors();
  const { friendships, faded, loading, refresh } = useFriends();
  const [showDrifted, setShowDrifted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader
        title="Friends"
        action={
          <Link href="/connect" asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-row gap-1.5 rounded-full transition-transform active:scale-[0.96]">
              <HugeiconsIcon icon={UserAdd01Icon} size={16} color={colors.text} strokeWidth={2} />
              <Text>Connect</Text>
            </Button>
          </Link>
        }
      />

      {loading ? (
        <View className="px-6">
          {[1, 0.7, 0.45].map((opacity) => (
            <FriendRowSkeleton key={opacity} opacity={opacity} />
          ))}
        </View>
      ) : (
        <FlatList
          data={friendships}
          keyExtractor={(friendship) => friendship.id ?? ''}
          renderItem={({ item }) => <FriendRow friendship={item} />}
          contentContainerClassName="grow px-6 pb-8"
          ItemSeparatorComponent={FriendSeparator}
          ListEmptyComponent={
            faded.length > 0 ? (
              <View className="items-center py-6">
                <Text variant="muted" className="text-center">
                  Everyone has drifted for now.
                </Text>
              </View>
            ) : (
              <EmptyFriends />
            )
          }
          ListFooterComponent={
            faded.length > 0 ? (
              <DriftedSection
                faded={faded}
                expanded={showDrifted}
                onToggle={() => setShowDrifted((v) => !v)}
              />
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          className="flex-1"
        />
      )}
    </SafeAreaView>
  );
}
