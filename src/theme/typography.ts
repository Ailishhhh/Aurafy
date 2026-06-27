/**
 * Typography system.
 *
 * Display / headings use "Sora" (geometric, confident, a little luxe) and body
 * copy uses "Inter" (highly legible at small sizes). Font keys below map to the
 * names registered in app/_layout.tsx via expo-font.
 */

export const fonts = {
  display: 'Sora_700Bold',
  displaySemi: 'Sora_600SemiBold',
  heading: 'Sora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

/** Semantic text styles consumed by the <Text> wrapper component. */
export const typeScale = {
  // Oversized hero number (e.g. the score reveal).
  hero: {
    fontFamily: fonts.display,
    fontSize: 88,
    lineHeight: 92,
    letterSpacing: -2,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySemi: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  // All-caps overline used for section eyebrows.
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typeScale;
