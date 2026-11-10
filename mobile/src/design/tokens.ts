/**
 * Design system — the only place where colors, type, spacing, radii and
 * shadows are defined. Screens and components must import from here.
 *
 * Direction: warm cream paper, ink outlines and hard offset shadows,
 * like a comic strip. One loud accent (tomato) for the main action.
 */

export const colors = {
  paper: '#FFF4E6',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  inkMuted: '#6B625A',
  inkFaint: '#B9AEA3',
  primary: '#FF5B3A',
  primaryPressed: '#E8482A',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  overlay: 'rgba(30, 27, 24, 0.55)',
  // Accents used to tell personalities apart.
  accents: ['#FFC94A', '#9ED9C3', '#C9B8FF', '#FFB4A2', '#A8D8FF', '#D7E8A0'],
} as const;

export const fonts = {
  displayBlack: 'Fraunces_900Black',
  displayBold: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const type = {
  hero: { fontFamily: fonts.displayBlack, fontSize: 38, lineHeight: 42, letterSpacing: -0.8 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  balloon: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 27 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  balloon: 28,
  pill: 999,
} as const;

export const border = {
  width: 2,
  widthBold: 3,
  color: colors.ink,
} as const;

/** Hard offset shadows (no blur) — part of the comic look. */
export const shadow = {
  sm: `2px 2px 0px ${colors.ink}`,
  md: `4px 4px 0px ${colors.ink}`,
} as const;

export const layout = {
  gutter: space.lg,
  buttonHeight: 56,
  minTap: 44,
  maxContentWidth: 520,
} as const;

export const motion = {
  pressScale: 0.97,
  fast: 120,
  normal: 220,
} as const;
