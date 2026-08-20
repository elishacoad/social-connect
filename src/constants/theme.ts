// NativeTabs (native tab bar) and SVG icon props need plain color values, not
// classNames, so they can't consume NativeWind/RNR's CSS custom properties
// directly. These mirror the light/dark values in global.css — keep both in sync.
export const Colors = {
  light: {
    text: '#0a0a0a',
    background: '#ffffff',
    backgroundElement: '#f5f5f5',
    card: '#fafafa',
    border: '#e5e5e5',
    mutedForeground: '#737373',
    destructive: '#ef4444',
    primary: '#171717',
    primaryForeground: '#fafafa',
  },
  dark: {
    text: '#fafafa',
    background: '#0a0a0a',
    backgroundElement: '#262626',
    card: '#171717',
    border: '#262626',
    mutedForeground: '#a3a3a3',
    destructive: '#f87171',
    primary: '#fafafa',
    primaryForeground: '#171717',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof Colors)['light']]: string };
