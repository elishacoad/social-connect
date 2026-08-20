import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { Friendship, useFriends } from '@/hooks/use-friends';
import { freshnessRatio } from '@/utils/fade';

function FriendRow({ friendship, drifted = false }: { friendship: Friendship; drifted?: boolean }) {
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
          <Avatar alt={friend.display_name} className="size-11" style={{ opacity: presence }}>
            {friend.avatar_url ? (
              <AvatarImage source={{ uri: friend.avatar_url }} />
            ) : (
              <AvatarFallback>
                <Text className="border-0">{friend.display_name.charAt(0).toUpperCase()}</Text>
              </AvatarFallback>
            )}
          </Avatar>
        </View>
        <Text className="flex-1 font-semibold" numberOfLines={1} style={{ opacity: presence }}>
          {friend.display_name}
        </Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#a1a1aa" strokeWidth={2} />
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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="flex-1 items-center justify-center gap-4 px-4 pb-24">
      <View className="size-20 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon icon={UserGroupIcon} size={34} color="#8a8a90" strokeWidth={1.5} />
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
  return (
    <View className="pt-4">
      <View className="mb-1 h-px bg-border/70" />
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between py-3 active:opacity-60">
        <View className="flex-row items-center gap-2">
          <Text variant="muted" className="text-sm font-medium">
            Drifted
          </Text>
          <Text variant="muted" className="text-sm tabular-nums opacity-70">
            {faded.length}
          </Text>
        </View>
        <HugeiconsIcon
          icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={18}
          color="#a1a1aa"
          strokeWidth={2}
        />
      </Pressable>

      {expanded ? (
        <View className="pt-1">
          <Text variant="muted" className="pb-1 text-xs leading-4">
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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { friendships, faded, loading } = useFriends();
  const [showDrifted, setShowDrifted] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-3">
        <View className="flex-row items-center gap-3">
          <ProfileAvatarHeader />
          <Text variant="h2" className="border-0 pb-0 text-left">
            Friends
          </Text>
        </View>
        <Link href="/connect" asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex-row gap-1.5 rounded-full transition-transform active:scale-[0.96]">
            <HugeiconsIcon icon={UserAdd01Icon} size={16} color={colors.text} strokeWidth={2} />
            <Text>Connect</Text>
          </Button>
        </Link>
      </View>

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
                <Text variant="muted" className="text-center text-sm">
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
          className="flex-1"
        />
      )}
    </SafeAreaView>
  );
}
