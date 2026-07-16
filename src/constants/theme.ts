// NativeTabs (native tab bar) needs plain color values, not classNames, so
// it can't consume NativeWind/RNR's CSS custom properties directly. These
// mirror the light/dark values in global.css — keep both in sync.
export const Colors = {
  light: {
    text: '#0a0a0a',
    background: '#ffffff',
    backgroundElement: '#f5f5f5',
  },
  dark: {
    text: '#fafafa',
    background: '#0a0a0a',
    backgroundElement: '#262626',
  },
} as const;
