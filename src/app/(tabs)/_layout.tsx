import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Timeline</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="rectangle.stack" drawable="ic_menu_recent_history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="camera">
        <NativeTabs.Trigger.Label>Camera</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="camera" drawable="ic_menu_camera" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" drawable="ic_menu_myplaces" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
