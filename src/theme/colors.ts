/**
 * Aurafy color system.
 *
 * The brand is built around a dark, cinematic canvas with a signature "aura"
 * gradient that runs from violet -> magenta -> warm gold. Everything else is a
 * carefully tuned neutral so the gradients and glass surfaces pop.
 */

export const palette = {
  // Core canvas — near-black with a faint violet undertone (not flat #000).
  void: '#07060B',
  ink: '#0C0A14',
  surface: '#14111F',
  surfaceRaised: '#1B1726',

  // Hairline borders / dividers used on glass surfaces.
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',

  // Text.
  textPrimary: '#F7F5FF',
  textSecondary: 'rgba(247,245,255,0.66)',
  textTertiary: 'rgba(247,245,255,0.40)',

  // Aura signature hues.
  violet: '#7C5CFF',
  violetBright: '#9D7BFF',
  magenta: '#E15CFF',
  gold: '#FFC65C',
  goldBright: '#FFD98A',

  // Semantic accents.
  success: '#54E3A6',
  warning: '#FFC65C',
  danger: '#FF6B81',

  // Pure utility.
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Reusable multi-stop gradients. Tuples are kept readonly so they can be passed
 * straight into expo-linear-gradient's `colors` prop without type friction.
 */
export const gradients = {
  // The hero "aura" — the brand's defining gradient.
  aura: ['#7C5CFF', '#E15CFF', '#FFC65C'] as const,
  auraSoft: ['#9D7BFF', '#E15CFF'] as const,
  // Vertical wash used behind full screens.
  canvas: ['#100C1C', '#07060B'] as const,
  // Glass fill — a subtle top-lit sheen.
  glass: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)'] as const,
  // Gold "premium" gradient for paywall + highlights.
  gold: ['#FFD98A', '#FFC65C', '#FF9F45'] as const,
  // Score states.
  scoreHigh: ['#9D7BFF', '#54E3A6'] as const,
  scoreMid: ['#7C5CFF', '#E15CFF'] as const,
} as const;

/** Layered shadow tokens (iOS) / elevation hint (Android). */
export const shadow = {
  glow: {
    shadowColor: palette.violet,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  goldGlow: {
    shadowColor: palette.gold,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
