import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { signOut } from '@/queries/auth';
import { getFriendship } from '@/queries/friendships';
import { getMomentsByAuthor } from '@/queries/moments';
import { getProfile, ProfileRow } from '@/queries/profiles';
import { freshnessRatio } from '@/utils/fade';

function useMomentThumbnails(authorId: string | undefined) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!authorId) return;
    getMomentsByAuthor(authorId)
      .then((moments) => Promise.allSettled(moments.map((moment) => getMomentMediaUrl(moment.media_path))))
      .then((results) =>
        setUrls(
          results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
            .map((r) => r.value)
        )
      )
      .catch(() => setUrls([]));
  }, [authorId]);

  return urls;
}

function MomentsGrid({ urls, ratio }: { urls: string[]; ratio: number }) {
  if (urls.length === 0) {
    return (
      <View className="mt-8 w-full items-center">
        <Text variant="muted">No moments yet.</Text>
      </View>
    );
  }

  return (
    <View className="mt-8 w-full flex-row flex-wrap gap-1" style={{ opacity: 0.4 + 0.6 * ratio }}>
      {urls.map((url) => (
        <Image
          key={url}
          source={{ uri: url }}
          style={{ width: '32%', aspectRatio: 1, borderRadius: 8 }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}

function ProfileHeader({ profile, isMe }: { profile: ProfileRow; isMe: boolean }) {
  const urls = useMomentThumbnails(profile.id);
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    if (isMe) return;
    getFriendship(profile.id)
      .then((friendship) => setRatio(friendship ? freshnessRatio(friendship) : 1))
      .catch(() => setRatio(1));
  }, [isMe, profile.id]);

  return (
    <View className="w-full max-w-[800px] items-center gap-2 p-6">
      <Avatar alt={profile.display_name} className="mb-2 size-24">
        {profile.avatar_url ? (
          <AvatarImage source={{ uri: profile.avatar_url }} />
        ) : (
          <AvatarFallback>
            <Text variant="h3" className="border-0">
              {profile.display_name.charAt(0).toUpperCase()}
            </Text>
          </AvatarFallback>
        )}
      </Avatar>

      <Text variant="h3">{profile.display_name}</Text>
      <Text variant="muted">@{profile.username}</Text>
      <Text variant="muted" className="text-center">
        Living memory collection, not a portfolio.
      </Text>

      <MomentsGrid urls={urls} ratio={ratio} />

      {isMe ? (
        <Button variant="outline" onPress={() => signOut()} className="mt-8">
          <Text>Sign out</Text>
        </Button>
      ) : (
        <Link href={{ pathname: '/connect', params: { friendId: profile.id } }} asChild>
          <Button className="mt-8">
            <Text>Reconnect</Text>
          </Button>
        </Link>
      )}
    </View>
  );
}

function MyProfile() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ProfileHeader profile={profile} isMe />;
}

function FriendProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    getProfile(id)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [id]);

  if (!profile) return null;
  return <ProfileHeader profile={profile} isMe={false} />;
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerClassName="flex-grow items-center bg-background">
      {id === 'me' ? <MyProfile /> : <FriendProfile id={id} />}
    </ScrollView>
  );
}
