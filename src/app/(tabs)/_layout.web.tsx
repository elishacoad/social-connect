import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

// Column flex, not an absolutely-positioned overlay: the nav pill sits in
// normal document flow above TabSlot, which fills the rest as `flex-1`.
// TabSlot itself is just a plain flex child (see expo-router/ui's Tabs.js /
// TabSlot.js — nothing about it requires floating), so nothing here ever
// needs to guess the pill's height to avoid covering a screen's own header.
export default function AppTabs() {
  return (
    <Tabs className="flex-1">
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Timeline</TabButton>
          </TabTrigger>
          <TabTrigger name="camera" href="/camera" asChild>
            <TabButton>Camera</TabButton>
          </TabTrigger>
          <TabTrigger name="friends" href="/friends" asChild>
            <TabButton>Friends</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} className="active:opacity-70">
      <View className={cn('rounded-xl px-3 py-1.5', isFocused ? 'bg-accent' : 'bg-transparent')}>
        <Text className={cn('text-sm', isFocused ? 'text-accent-foreground' : 'text-muted-foreground')}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} className="w-full flex-row items-center justify-center p-4">
      <View className="max-w-[800px] grow flex-row items-center gap-2 rounded-2xl bg-card px-5 py-2">
        <Text className="mr-auto text-sm font-semibold">Social Connect</Text>
        {props.children}
      </View>
    </View>
  );
}
