import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Friendship, useFriends } from '@/hooks/use-friends';
import { freshnessRatio } from '@/utils/fade';

function FriendRow({ friendship }: { friendship: Friendship }) {
  const friend = friendship.friend;
  if (!friend) return null;

  // Recent relationships render vivid; drifting ones desaturate/dim toward
  // the fade cutoff — no numeric score or timestamp shown, purely visual
  // per product.md ("no scores, percentages, or rankings").
  const ratio = freshnessRatio(friendship);

  return (
    <Link href={{ pathname: '/profile/[id]', params: { id: friend.id } }} asChild>
      <Pressable
        className="flex-row items-center gap-3 rounded-2xl bg-card p-3 active:opacity-70"
        style={{ opacity: 0.4 + 0.6 * ratio }}>
        <Avatar alt={friend.display_name} className="size-12">
          {friend.avatar_url ? (
            <AvatarImage source={{ uri: friend.avatar_url }} />
          ) : (
            <AvatarFallback>
              <Text className="border-0">{friend.display_name.charAt(0).toUpperCase()}</Text>
            </AvatarFallback>
          )}
        </Avatar>
        <Text className="font-semibold">{friend.display_name}</Text>
      </Pressable>
    </Link>
  );
}

function EmptyFriends() {
  return (
    <View className="flex-1 items-center justify-center gap-3 pt-24">
      <Text variant="h3" className="text-center">
        No friends yet
      </Text>
      <Text variant="muted" className="text-center">
        Connect with someone in person to add your first friend.
      </Text>
      <Link href="/connect" asChild>
        <Button className="mt-2">
          <Text>Connect</Text>
        </Button>
      </Link>
    </View>
  );
}

export default function FriendsScreen() {
  const { friendships, faded, loading } = useFriends();
  const [showDrifted, setShowDrifted] = useState(false);

  const data = showDrifted ? [...friendships, ...faded] : friendships;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-3">
        <View className="flex-row items-center gap-3">
          <ProfileAvatarHeader />
          <Text variant="h2" className="border-0 pb-0 text-left">
            Friends
          </Text>
        </View>
        <Link href="/connect" asChild>
          <Button variant="outline" size="sm">
            <Text>Connect</Text>
          </Button>
        </Link>
      </View>

      <FlatList
        data={data}
        keyExtractor={(friendship) => friendship.id ?? ''}
        renderItem={({ item }) => <FriendRow friendship={item} />}
        contentContainerClassName="grow gap-2 px-6 pb-8"
        ListEmptyComponent={!loading ? EmptyFriends : null}
        ListFooterComponent={
          faded.length > 0 ? (
            <Pressable onPress={() => setShowDrifted((v) => !v)} className="items-center py-3 active:opacity-70">
              <Text variant="muted" className="text-sm">
                {showDrifted ? 'Hide drifted friends' : 'Show drifted friends'}
              </Text>
            </Pressable>
          ) : null
        }
        className="flex-1"
      />
    </SafeAreaView>
  );
}
