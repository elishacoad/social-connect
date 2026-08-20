import {
  HandshakeIcon,
  Image02Icon,
  Logout03Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  SunsetIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth } from '@/hooks/use-auth';
import { getMomentMediaUrl } from '@/lib/supabase-storage';
import { signOut } from '@/queries/auth';
import { getFriendship } from '@/queries/friendships';
import { getMomentsByAuthor } from '@/queries/moments';
import { getProfile, ProfileRow } from '@/queries/profiles';
import { freshnessRatio } from '@/utils/fade';

type MomentThumbnail = { id: string; url: string };

const IMAGE_OUTLINE = 'border border-black/10 dark:border-white/10';

function useMomentThumbnails(authorId: string | undefined) {
  const [thumbnails, setThumbnails] = useState<MomentThumbnail[]>([]);

  useEffect(() => {
    if (!authorId) return;
    getMomentsByAuthor(authorId)
      .then((moments) =>
        Promise.allSettled(
          moments.map((moment) => getMomentMediaUrl(moment.media_path).then((url) => ({ id: moment.id, url })))
        )
      )
      .then((results) =>
        setThumbnails(
          results
            .filter((r): r is PromiseFulfilledResult<MomentThumbnail> => r.status === 'fulfilled')
            .map((r) => r.value)
        )
      )
      .catch(() => setThumbnails([]));
  }, [authorId]);

  return thumbnails;
}

function driftLabel(ratio: number) {
  if (ratio > 0.66) return 'Still bright';
  if (ratio > 0.33) return 'Softening';
  if (ratio > 0) return 'Fading';
  return 'Drifted';
}

function chunkIntoRows<T>(items: T[], perRow: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  return rows;
}

function EmptyMoments({ isMe }: { isMe: boolean }) {
  const colors = useThemeColors();
  return (
    <View className="mt-4 w-full items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-10">
      <HugeiconsIcon icon={Image02Icon} color={colors.mutedForeground} size={26} strokeWidth={1.5} />
      <Text variant="muted" className="text-center leading-5">
        {isMe
          ? 'Your moments will collect here.\nCapture one and it stays.'
          : 'Nothing here yet.\nTheir moments will show up as they capture them.'}
      </Text>
    </View>
  );
}

function MomentsGrid({
  thumbnails,
  ratio,
  isMe,
}: {
  thumbnails: MomentThumbnail[];
  ratio: number;
  isMe: boolean;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(0.4 + 0.6 * ratio, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, ratio]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (thumbnails.length === 0) return <EmptyMoments isMe={isMe} />;

  return (
    <Animated.View className="mt-4 w-full gap-1.5" style={fadeStyle}>
      {chunkIntoRows(thumbnails, 3).map((row) => (
        <View key={row[0].id} className="w-full flex-row gap-1.5">
          {row.map((thumbnail) => (
            <Link key={thumbnail.id} href={{ pathname: '/moment/[id]', params: { id: thumbnail.id } }} asChild>
              <Pressable
                className={`aspect-square flex-1 overflow-hidden rounded-xl active:opacity-70 ${IMAGE_OUTLINE}`}>
                <Image source={{ uri: thumbnail.url }} style={{ flex: 1 }} contentFit="cover" />
              </Pressable>
            </Link>
          ))}
          {Array.from({ length: 3 - row.length }).map((_, index) => (
            <View key={`filler-${index}`} className="flex-1" />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

function ProfileHeader({ profile, isMe }: { profile: ProfileRow; isMe: boolean }) {
  const colors = useThemeColors();
  const thumbnails = useMomentThumbnails(profile.id);
  const [ratio, setRatio] = useState(1);
  const scheme = useColorScheme();
  const onPrimary = scheme === 'dark' ? '#0a0a0a' : '#ffffff';

  useEffect(() => {
    if (isMe) return;
    getFriendship(profile.id)
      .then((friendship) => setRatio(friendship ? freshnessRatio(friendship) : 1))
      .catch(() => setRatio(1));
  }, [isMe, profile.id]);

  return (
    <View className="w-full max-w-[800px] px-5 pb-14 pt-2">
      <Animated.View entering={FadeInDown.duration(320)} className="items-center">
        <UserAvatar person={profile} size={24} className={IMAGE_OUTLINE} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(320).delay(80)} className="mt-4 items-center gap-0.5">
        <Text variant="h3">{profile.display_name}</Text>
        <Text variant="muted">@{profile.username}</Text>
      </Animated.View>

      {profile.bio ? (
        <Animated.View entering={FadeInDown.duration(320).delay(160)} className="items-center">
          <Text variant="muted" className="mt-3 max-w-[300px] text-center leading-5">
            {profile.bio}
          </Text>
        </Animated.View>
      ) : null}

      {isMe ? (
        <Animated.View entering={FadeInDown.duration(320).delay(240)}>
          <Link href="/profile/edit" asChild>
            <Button variant="outline" className="mt-7 h-12 w-full rounded-2xl active:scale-[0.96]">
              <HugeiconsIcon
                icon={PencilEdit01Icon}
                size={18}
                strokeWidth={1.8}
                color={colors.text}
              />
              <Text className="text-body">Edit profile</Text>
            </Button>
          </Link>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(320).delay(240)}>
          <Link href={{ pathname: '/connect', params: { friendId: profile.id } }} asChild>
            <Button className="mt-7 h-12 w-full rounded-2xl active:scale-[0.96]">
              <HugeiconsIcon icon={HandshakeIcon} color={onPrimary} size={20} strokeWidth={1.8} />
              <Text>Reconnect</Text>
            </Button>
          </Link>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.duration(320).delay(320)}
        className="mt-8 flex-row items-center justify-between">
        <Text variant="overline">
          Moments
        </Text>
        {!isMe && (
          <View className="flex-row items-center gap-1.5">
            <HugeiconsIcon icon={SunsetIcon} color={colors.mutedForeground} size={15} strokeWidth={1 + ratio} />
            <Text variant="caption">
              {driftLabel(ratio)}
            </Text>
          </View>
        )}
      </Animated.View>

      <MomentsGrid thumbnails={thumbnails} ratio={ratio} isMe={isMe} />

      {isMe && (
        <View className="mt-10 items-center gap-1">
          {__DEV__ ? (
            <Link href="/ds" asChild>
              <Button variant="ghost" className="h-11 rounded-2xl px-5 active:scale-[0.96]">
                <HugeiconsIcon icon={PaintBoardIcon} color={colors.mutedForeground} size={18} strokeWidth={1.5} />
                <Text className="text-muted-foreground">Design system</Text>
              </Button>
            </Link>
          ) : null}
          <Button
            variant="ghost"
            onPress={() => signOut()}
            className="h-11 rounded-2xl px-5 active:scale-[0.96]">
            <HugeiconsIcon icon={Logout03Icon} color={colors.mutedForeground} size={18} strokeWidth={1.5} />
            <Text className="text-muted-foreground">Sign out</Text>
          </Button>
        </View>
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
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top + 52 }}
      contentContainerClassName="flex-grow items-center bg-background">
      {id === 'me' ? <MyProfile /> : <FriendProfile id={id} />}
    </ScrollView>
  );
}
