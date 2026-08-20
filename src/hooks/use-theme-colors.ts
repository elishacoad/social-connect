import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

export function useThemeColors(): ThemeColors {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
