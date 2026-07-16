import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { refreshProfile, useAuth } from '@/hooks/use-auth';
import { uploadAvatar } from '@/lib/supabase-storage';
import { isUsernameAvailable, updateProfile } from '@/queries/profiles';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function OnboardingScreen() {
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleContinue() {
    if (!session) return;
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores');
      return;
    }
    if (!displayName.trim()) {
      setError('Add a name so friends recognize you');
      return;
    }

    setLoading(true);
    try {
      if (!(await isUsernameAvailable(normalizedUsername))) {
        setError('That username is taken');
        return;
      }

      let avatarUrl: string | undefined;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(session.user.id, avatarUri);
      }

      await updateProfile(session.user.id, {
        username: normalizedUsername,
        display_name: displayName.trim(),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      // Root layout re-routes to (tabs) once profile.display_name is non-empty.
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 gap-6">
        <View className="gap-1">
          <Text variant="h2" className="border-0 pb-0 text-left">
            Set up your profile
          </Text>
          <Text variant="muted">This is how friends will find and recognize you.</Text>
        </View>

        <Pressable onPress={handlePickAvatar} className="self-center">
          <Avatar alt="Your profile picture" className="size-24">
            {avatarUri ? (
              <AvatarImage source={{ uri: avatarUri }} />
            ) : (
              <AvatarFallback>
                <Text variant="muted">Add photo</Text>
              </AvatarFallback>
            )}
          </Avatar>
        </Pressable>

        <View className="gap-4">
          <View className="gap-2">
            <Label nativeID="display_name">Name</Label>
            <Input
              aria-labelledby="display_name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
            />
          </View>

          <View className="gap-2">
            <Label nativeID="username">Username</Label>
            <Input
              aria-labelledby="username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="lowercase, no spaces"
            />
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button onPress={handleContinue} disabled={loading || !displayName || !username}>
            <Text>{loading ? 'Saving…' : 'Continue'}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
