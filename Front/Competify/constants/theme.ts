/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Spotify Color Palette
export const SpotifyColors = {
  green: '#1DB954',
  black: '#191414',
  darkGray: '#121212',
  mediumGray: '#282828',
  lightGray: '#B3B3B3',
  white: '#FFFFFF',
};

// Vinyl Rank Colors
export const VinylRanks = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const tintColorLight = SpotifyColors.green;
const tintColorDark = SpotifyColors.green;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: SpotifyColors.white,
    background: SpotifyColors.black,
    tint: tintColorDark,
    icon: SpotifyColors.lightGray,
    tabIconDefault: SpotifyColors.lightGray,
    tabIconSelected: tintColorDark,
    card: SpotifyColors.mediumGray,
    border: SpotifyColors.darkGray,
  },
  spotify: {
    primary: SpotifyColors.green,
    background: SpotifyColors.black,
    surface: SpotifyColors.mediumGray,
    darkSurface: SpotifyColors.darkGray,
    text: SpotifyColors.white,
    textSecondary: SpotifyColors.lightGray,
    success: '#1DB954',
    error: '#E22134',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
