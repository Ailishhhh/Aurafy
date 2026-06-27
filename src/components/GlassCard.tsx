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
 * Frosted glass container — the workhorse surface of the app.
 *
 * Construction (outer -> inner):
 *   1. A rounded clip wrapper.
 *   2. BlurView for the real frosted backdrop.
 *   3. A faint top-lit gradient sheen so the glass reads as lit from above.
 *   4. The content.
 * When `glow` is set we wrap the whole thing in a 1px aura-gradient ring.
 */
export function GlassCard({
  children,
  style,
  padding = spacing.xl,
  radius = radii.lg,
  intensity = 28,
  glow,
}: GlassCardProps) {
  const card = (
    <View style={[styles.clip, { borderRadius: radius }, !glow && styles.hairline, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={gradients.glass}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );

  if (!glow) return card;

  // 1px gradient ring: an aura gradient with the card inset by the border width.
  return (
    <LinearGradient
      colors={gradients.aura}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.glowRing, { borderRadius: radius + 1 }]}
    >
      {card}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: 'rgba(20,17,31,0.55)',
  },
  hairline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  glowRing: {
    padding: 1,
  },
});
