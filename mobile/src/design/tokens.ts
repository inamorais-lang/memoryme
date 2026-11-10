/**
 * Design system — the only place where colors, type, spacing, radii and
 * shadows are defined. Screens and components must import from here.
 *
 * Direction: clean and minimal (lots of white, no outlines), with loud,
 * trendy colours that carry the humour. Every button is filled with colour.
 */

export const colors = {
  paper: '#F7F6F2',
  surface: '#FFFFFF',
  ink: '#141414',
  inkMuted: '#6E6D72',
  inkFaint: '#E4E3DF',

  // Main action: hot pink.
  primary: '#FF3D81',
  primaryPressed: '#E52A6C',
  onPrimary: '#FFFFFF',
  // Second action: acid lime.
  secondary: '#C8F53A',
  secondaryPressed: '#B4E021',
  onSecondary: '#141414',
  // Small actions: soft lilac with electric violet text.
  tertiary: '#ECE6FF',
  tertiaryPressed: '#DDD3FF',
  onTertiary: '#5B35F5',

  danger: '#E5484D',
  overlay: 'rgba(20, 20, 20, 0.55)',
  // Thought balloon: soft pastels, never white. Text stays ink.
  balloonTints: ['#FFDCEA', '#D3F1F6', '#D8F4E4', '#E6DEFF', '#FFE6D2', '#DCE8FF'],
  // Personality cards.
  accents: ['#E6FF94', '#FFD1E3', '#E0D6FF', '#FFDDBF', '#C9E9FF', '#FFF3A3'],
} as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 31, letterSpacing: -0.7 },
  heading: { fontFamily: fonts.displayBold, fontSize: 19, lineHeight: 23, letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  buttonSmall: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 },
  balloon: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
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
  md: 18,
  lg: 26,
  balloon: 26,
  pill: 999,
} as const;

/** Only used to mark a selected item; the rest of the UI has no outlines. */
export const border = {
  width: 2,
  widthBold: 2.5,
  color: colors.ink,
} as const;

/** Soft, low shadows: depth without clutter. */
export const shadow = {
  sm: '0px 2px 8px rgba(20, 20, 20, 0.06)',
  md: '0px 8px 24px rgba(20, 20, 20, 0.10)',
  balloon: '0px 10px 30px rgba(0, 0, 0, 0.22)',
} as const;

export const layout = {
  gutter: space.lg,
  buttonHeight: 56,
  buttonHeightSmall: 44,
  minTap: 44,
  maxContentWidth: 520,
} as const;

export const motion = {
  pressScale: 0.96,
  fast: 120,
  normal: 220,
} as const;
