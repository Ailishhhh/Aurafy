import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradients, radius as radii, spacing } from '@/theme';

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Inner padding token; pass 0 for edge-to-edge content. */
  padding?: number;
  radius?: number;
  intensity?: number;
  /** Render a glowing aura gradient border instead of the plain hairline. */
  glow?: boolean;
};

/**
 * Liquid-glass container — the workhorse surface of the app.
 *
 * The "liquid glass" look is built from stacked layers (outer -> inner):
 *   1. Rounded clip wrapper.
 *   2. BlurView — the real frosted backdrop (high intensity for that thick,
 *      refractive glass body).
 *   3. A faint translucent white base fill so the glass has substance.
 *   4. A diagonal specular sheen (bright top-left -> transparent) — this is the
 *      single most important layer for the "liquid" feel: it reads as light
 *      catching the curved surface of the glass.
 *   5. A thin bright highlight running along the very top edge (the lit rim).
 *   6. A hairline rim border to crisp up the silhouette.
 *   7. Content.
 * With `glow`, the whole thing is wrapped in a 1px aura-gradient ring.
 */
export function GlassCard({
  children,
  style,
  padding = spacing.xl,
  radius = radii.lg,
  intensity = 50,
  glow,
}: GlassCardProps) {
  const card = (
    <View style={[styles.clip, { borderRadius: radius }, style]}>
      {/* 2. Frosted backdrop */}
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />

      {/* 3. Translucent base body */}
      <View style={[StyleSheet.absoluteFill, styles.baseFill]} />

      {/* 4. Diagonal specular sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 5. Lit top rim */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topRim}
        pointerEvents="none"
      />

      {/* 6. Crisp hairline rim */}
      {!glow && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }, styles.rim]}
        />
      )}

      {/* 7. Content */}
      <View style={{ padding }}>{children}</View>
    </View>
  );

  if (!glow) return card;

  // Aura gradient ring: card inset by the 1px border width.
  return (
    <LinearGradient
      colors={gradients.aura}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.glowRing, { borderRadius: radius + 1.5 }]}
    >
      {card}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: 'rgba(18,15,28,0.45)',
  },
  baseFill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  rim: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  glowRing: {
    padding: 1.5,
  },
});
