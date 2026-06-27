export { palette, gradients, shadow } from './colors';
export { spacing, radius, motion, hitSlop } from './spacing';
export { fonts, typeScale, type TypeVariant } from './typography';

import { palette, gradients, shadow } from './colors';
import { spacing, radius, motion, hitSlop } from './spacing';
import { fonts, typeScale } from './typography';

/** Single aggregated theme object for ergonomic imports. */
export const theme = {
  palette,
  gradients,
  shadow,
  spacing,
  radius,
  motion,
  hitSlop,
  fonts,
  typeScale,
} as const;

export type Theme = typeof theme;
