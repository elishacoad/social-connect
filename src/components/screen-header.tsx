import { type ReactNode } from 'react';
import { View } from 'react-native';

import { ProfileAvatarHeader } from '@/components/profile-avatar-header';
import { Text } from '@/components/ui/text';

// Fixed height and gutter so the account avatar lands on exactly the same
// pixel on every tab. Each screen used to bring its own padding and title
// size, which made the avatar jump as you switched tabs.
export function ScreenHeader({ title, action }: { title?: string; action?: ReactNode }) {
  return (
    <View className="h-16 flex-row items-center justify-between px-6">
      <View className="flex-row items-center gap-3">
        <ProfileAvatarHeader />
        {title ? (
          <Text variant="h1" className="text-left">
            {title}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
