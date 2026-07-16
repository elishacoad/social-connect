import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft } from 'phosphor-react-native';
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
import { cn } from '@/lib/utils';
import { isUsernameAvailable, updateProfile } from '@/queries/profiles';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const STEPS = ['photo', 'name', 'username'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const { session } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];

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

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    if (step === 'name' && !displayName.trim()) {
      setError('Add a name so friends recognize you');
      return;
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  async function handleFinish() {
    if (!session) return;
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores');
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
        className="flex-1 px-6">
        <View className="flex-row items-center gap-4 pt-2">
          {stepIndex > 0 ? (
            <Pressable onPress={goBack} hitSlop={12}>
              <ArrowLeft size={22} />
            </Pressable>
          ) : (
            <View className="size-[22px]" />
          )}
          <View className="flex-1 flex-row gap-2">
            {STEPS.map((s, i) => (
              <View
                key={s}
                className={cn('h-1.5 flex-1 rounded-full', i <= stepIndex ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </View>
        </View>

        <View className="flex-1 justify-center gap-6">
          {step === 'photo' && (
            <View className="gap-6">
              <View className="gap-1">
                <Text variant="h2" className="border-0 pb-0 text-left">
                  Add a photo
                </Text>
                <Text variant="muted">So friends recognize you at a glance. You can skip this for now.</Text>
              </View>

              <Pressable onPress={handlePickAvatar} className="self-center">
                <Avatar alt="Your profile picture" className="size-28">
                  {avatarUri ? (
                    <AvatarImage source={{ uri: avatarUri }} />
                  ) : (
                    <AvatarFallback>
                      <Text variant="muted">Add photo</Text>
                    </AvatarFallback>
                  )}
                </Avatar>
              </Pressable>

              <Button onPress={goNext}>
                <Text>{avatarUri ? 'Continue' : 'Skip for now'}</Text>
              </Button>
            </View>
          )}

          {step === 'name' && (
            <View className="gap-6">
              <View className="gap-1">
                <Text variant="h2" className="border-0 pb-0 text-left">
                  What&apos;s your name?
                </Text>
                <Text variant="muted">This is how friends will see you.</Text>
              </View>

              <View className="gap-2">
                <Label nativeID="display_name">Name</Label>
                <Input
                  aria-labelledby="display_name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={goNext}
                />
              </View>

              {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

              <Button onPress={goNext} disabled={!displayName.trim()}>
                <Text>Continue</Text>
              </Button>
            </View>
          )}

          {step === 'username' && (
            <View className="gap-6">
              <View className="gap-1">
                <Text variant="h2" className="border-0 pb-0 text-left">
                  Pick a username
                </Text>
                <Text variant="muted">Lowercase letters, numbers, and underscores. Others use this to find you.</Text>
              </View>

              <View className="gap-2">
                <Label nativeID="username">Username</Label>
                <Input
                  aria-labelledby="username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="lowercase, no spaces"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleFinish}
                />
              </View>

              {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

              <Button onPress={handleFinish} disabled={loading || !username.trim()}>
                <Text>{loading ? 'Saving…' : 'Finish'}</Text>
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
