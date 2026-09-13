/**
 * NitiSaathi Design System — Color Palette
 * Derived from the stitch_screens design tokens.
 */
export const Colors = {
  // Primary brand — deep red
  primary: '#82001B',
  primaryContainer: '#A61C2E',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFB9B8',
  primaryFixed: '#FFDAD9',
  primaryFixedDim: '#FFB3B2',
  inversePrimary: '#FFB3B2',

  // Secondary — lighter red
  secondary: '#B7102A',
  secondaryContainer: '#DB313F',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#FFFBFF',
  secondaryFixed: '#FFDAD8',
  secondaryFixedDim: '#FFB3B1',

  // Tertiary — green (positive/success)
  tertiary: '#004923',
  tertiaryContainer: '#006332',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#75E096',
  tertiaryFixed: '#8DF9AC',
  tertiaryFixedDim: '#71DC92',
  onTertiaryFixedVariant: '#005229',

  // Error
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#93000A',

  // Surface & background
  background: '#FCF9F8',
  backgroundOffWhite: '#F7F5F2',
  surface: '#FCF9F8',
  surfaceBright: '#FCF9F8',
  surfaceDim: '#DCD9D9',
  surfaceVariant: '#E5E2E1',
  surfaceContainer: '#F0EDED',
  surfaceContainerLow: '#F6F3F2',
  surfaceContainerHigh: '#EAE7E7',
  surfaceContainerHighest: '#E5E2E1',
  surfaceContainerLowest: '#FFFFFF',

  // Text
  onBackground: '#1C1B1B',
  onSurface: '#1C1B1B',
  onSurfaceVariant: '#594140',
  textWarmGray: '#6B6560',

  // Outline
  outline: '#8D706F',
  outlineVariant: '#E1BEBD',

  // Inverse
  inverseSurface: '#313030',
  inverseOnSurface: '#F3F0EF',

  // Special
  cautionTint: '#F8D7DC',
  vividRed: '#E63946',
  surfaceTint: '#B32736',

  // White / pure
  white: '#FFFFFF',
  black: '#000000',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
