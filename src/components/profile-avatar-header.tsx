import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

// Top-left tap target into /profile/me, shared across every main screen.
export function ProfileAvatarHeader({ className }: { className?: string }) {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <Link href="/profile/me" asChild>
      <Pressable className={cn('active:opacity-70', className)}>
        <UserAvatar person={profile} size={10} />
      </Pressable>
    </Link>
  );
}
