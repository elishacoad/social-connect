import {
  Alert02Icon,
  AtIcon,
  CameraAdd02Icon,
  LockPasswordIcon,
  Note01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { refreshProfile, useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { uploadAvatar } from '@/lib/supabase-storage';
import { errorMessage } from '@/lib/errors';
import { updatePassword } from '@/queries/auth';
import { isUsernameAvailable, updateProfile } from '@/queries/profiles';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function EditProfileScreen() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <EditProfileForm
      profileId={profile.id}
      initialUsername={profile.username}
      initialBio={profile.bio}
      initialAvatarUrl={profile.avatar_url}
      initialDisplayName={profile.display_name}
    />
  );
}

function EditProfileForm({
  profileId,
  initialUsername,
  initialBio,
  initialAvatarUrl,
  initialDisplayName,
}: {
  profileId: string;
  initialUsername: string;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  initialDisplayName: string;
}) {
  const [avatarUri, setAvatarUri] = useState(initialAvatarUrl);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = useThemeColors();

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      if (
        normalizedUsername !== initialUsername &&
        !(await isUsernameAvailable(normalizedUsername, profileId))
      ) {
        setError('That username is taken');
        return;
      }

      let avatarUrl: string | undefined;
      if (avatarUri && avatarUri !== initialAvatarUrl) {
        avatarUrl = await uploadAvatar(profileId, avatarUri);
      }

      await updateProfile(profileId, {
        username: normalizedUsername,
        bio: bio.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      if (newPassword) {
        try {
          await updatePassword(newPassword);
        } catch (err) {
          await refreshProfile();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(`Profile saved, but the password was not changed: ${errorMessage(err, 'please try again')}`);
          return;
        }
      }

      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(errorMessage(err, 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={handlePickAvatar} className="mt-2 items-center self-center">
            <Avatar alt={initialDisplayName} className="size-24 border border-black/10 dark:border-white/10">
              {avatarUri ? (
                <AvatarImage source={{ uri: avatarUri }} />
              ) : (
                <AvatarFallback>
                  <Text variant="h3">
                    {initialDisplayName.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              )}
            </Avatar>
            <View className="bg-primary absolute bottom-0 right-0 size-8 items-center justify-center rounded-full border-2 border-background">
              <HugeiconsIcon
                icon={CameraAdd02Icon}
                size={16}
                strokeWidth={1.8}
                color={colors.primaryForeground}
              />
            </View>
          </Pressable>

          <View className="mt-8 gap-5">
            <View className="gap-2">
              <Label nativeID="username" >
                Username
              </Label>
              <View className="relative justify-center">
                <View pointerEvents="none" className="absolute left-4 z-10">
                  <HugeiconsIcon icon={AtIcon} size={18} strokeWidth={1.75} color={colors.mutedForeground} />
                </View>
                <Input
                  aria-labelledby="username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="lowercase, no spaces"
                  className="h-14 rounded-2xl pl-12 pr-4"
                />
              </View>
            </View>

            <View className="gap-2">
              <Label nativeID="bio" >
                Bio
              </Label>
              <View className="relative">
                <View pointerEvents="none" className="absolute left-4 top-3 z-10">
                  <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.75} color={colors.mutedForeground} />
                </View>
                <Input
                  aria-labelledby="bio"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="A few words about you"
                  multiline
                  textAlignVertical="top"
                  maxLength={160}
                  className="h-24 rounded-2xl py-3 pl-12 pr-4"
                />
              </View>
            </View>

            <View className="gap-2">
              <Label nativeID="new-password" >
                New password
              </Label>
              <View className="relative justify-center">
                <View pointerEvents="none" className="absolute left-4 z-10">
                  <HugeiconsIcon icon={LockPasswordIcon} size={18} strokeWidth={1.75} color={colors.mutedForeground} />
                </View>
                <Input
                  aria-labelledby="new-password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  placeholder="Leave blank to keep current password"
                  className="h-14 rounded-2xl pl-12 pr-12"
                />
                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  className="absolute right-1 size-10 items-center justify-center rounded-lg active:bg-muted">
                  <HugeiconsIcon
                    icon={passwordVisible ? ViewOffSlashIcon : ViewIcon}
                    size={18}
                    strokeWidth={1.75}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View className="bg-destructive/10 flex-row items-start gap-2 rounded-xl px-3 py-2.5">
                <View className="pt-0.5">
                  <HugeiconsIcon icon={Alert02Icon} size={16} strokeWidth={1.75} color={colors.destructive} />
                </View>
                <Text className="text-destructive flex-1 text-footnote">{error}</Text>
              </View>
            ) : null}

            <Button
              onPress={handleSave}
              disabled={loading || !username.trim()}
              className="mt-2 h-14 rounded-2xl">
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text className="font-sans-semibold text-body">Save changes</Text>
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
