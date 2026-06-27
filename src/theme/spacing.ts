/**
 * Spacing + radius + timing tokens.
 *
 * A single 4pt base grid keeps every screen rhythmically consistent. Using
 * named tokens (instead of magic numbers) is what makes a UI feel "designed"
 * rather than assembled.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  '2xl': 36,
  pill: 999,
} as const;

/** Animation timing — tuned for a calm, premium feel (no snappy/cheap easing). */
export const motion = {
  fast: 220,
  base: 380,
  slow: 620,
  reveal: 1100,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
