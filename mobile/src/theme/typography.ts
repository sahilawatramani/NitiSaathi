import { Colors } from './colors';

export const Typography = {
  displayLg: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.02 * 48,
  },
  headlineLg: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
  },
  headlineMd: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  labelLg: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.01 * 14,
  },
  labelSm: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHover: {
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  inputFocused: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;
