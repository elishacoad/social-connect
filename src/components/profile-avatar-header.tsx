import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

// Top-left tap target into /profile/me, shared across every main screen.
export function ProfileAvatarHeader({ className }: { className?: string }) {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <Link href="/profile/me" asChild>
      <Pressable className={cn('active:opacity-70', className)}>
        <Avatar alt={profile.display_name} className="size-10">
          {profile.avatar_url ? (
            <AvatarImage source={{ uri: profile.avatar_url }} />
          ) : (
            <AvatarFallback>
              <Text className="border-0 text-sm">{profile.display_name.charAt(0).toUpperCase()}</Text>
            </AvatarFallback>
          )}
        </Avatar>
      </Pressable>
    </Link>
  );
}
