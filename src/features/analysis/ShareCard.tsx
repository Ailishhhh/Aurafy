import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Txt, ScoreRing, GradientText } from '@/components';
import { palette, gradients, radius, spacing } from '@/theme';
import type { Analysis } from './types';

type ShareCardProps = {
  analysis: Analysis;
  width: number;
  /** Card aspect ratio (height / width). 1.25 = 4:5 post, 1.78 = 9:16 story. */
  aspect?: number;
};

/** Static, capture-ready radial orb (no animation so screenshots are crisp). */
function StaticOrb({ color, size, left, top }: { color: string; size: number; left: number; top: number }) {
  const id = `share-orb-${color.replace('#', '')}`;
  return (
    <View style={{ position: 'absolute', left, top, width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.85} />
            <Stop offset="60%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The shareable "aura card". Fixed 4:5 aspect (Instagram / story friendly).
 * Designed to be the single most screenshot-worthy artifact in the category —
 * every share is free distribution, so this gets the most polish.
 */
export function ShareCard({ analysis, width, aspect = 1.25 }: ShareCardProps) {
  const height = width * aspect;
  const topMetrics = [...analysis.metrics].sort((a, b) => b.score - a.score).slice(0, 3);
  const delta = ((analysis.potential - analysis.overall) / 10).toFixed(1);

  return (
    <View style={[styles.card, { width, height, borderRadius: radius['2xl'] }]}>
      <LinearGradient colors={['#16112A', '#07060B']} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <StaticOrb color={palette.violet} size={width * 0.9} left={-width * 0.25} top={-width * 0.2} />
      <StaticOrb color={palette.gold} size={width * 0.7} left={width * 0.55} top={height * 0.62} />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={16} color={palette.goldBright} />
          <Txt variant="overline" color={palette.textPrimary}>
            AURAFY
          </Txt>
        </View>

        {/* Score */}
        <View style={styles.scoreWrap}>
          <ScoreRing value={analysis.overall} size={width * 0.56} strokeWidth={14} animate={false} label="AURA SCORE" />
        </View>

        {/* Potential pill */}
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
          <Ionicons name="trending-up" size={14} color={palette.void} />
          <Txt variant="label" color={palette.void}>
            +{delta} potential
          </Txt>
        </LinearGradient>

        {/* Top metrics */}
        <View style={styles.metrics}>
          {topMetrics.map((m) => (
            <View key={m.key} style={styles.chip}>
              <Txt variant="caption" color={palette.textSecondary}>
                {m.label}
              </Txt>
              <GradientText variant="label" colors={gradients.auraSoft}>
                {(m.score / 10).toFixed(1)}
              </GradientText>
            </View>
          ))}
        </View>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <Txt variant="caption" color={palette.textTertiary} center>
            How attractive are you? Find out free.
          </Txt>
          <Txt variant="bodySemi" color={palette.textPrimary} center style={{ marginTop: 2 }}>
            Rate yours on Aurafy ✨
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: palette.void },
  inner: { flex: 1, padding: spacing['2xl'], alignItems: 'center', justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreWrap: { alignItems: 'center', marginTop: spacing.lg },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  chip: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    minWidth: 86,
  },
  footer: { alignItems: 'center', marginTop: spacing.lg },
});
