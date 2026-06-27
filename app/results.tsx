import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Screen,
  Txt,
  GlassCard,
  GradientButton,
  GradientText,
  ScoreRing,
  MetricBar,
} from '@/components';
import { useAnalysis } from '@/store/analysisStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

export default function Results() {
  const router = useRouter();
  const { current } = useAnalysis();

  // Guard: if someone lands here without an analysis, send them home.
  useEffect(() => {
    if (!current) router.replace('/');
  }, [current, router]);

  if (!current) return null;

  const delta = ((current.potential - current.overall) / 10).toFixed(1);

  return (
    <Screen scroll subduedBackground>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/')} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          YOUR RESULTS
        </Txt>
        <Pressable onPress={() => router.push('/share')} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={palette.textPrimary} />
        </Pressable>
      </View>

      {/* Hero score */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
        <ScoreRing value={current.overall} size={250} />
        <Animated.View entering={FadeInDown.delay(900).duration(600)}>
          <Txt variant="heading" center style={{ marginTop: spacing.xl, maxWidth: 320 }}>
            {current.headline}
          </Txt>
        </Animated.View>
      </Animated.View>

      {/* Potential card */}
      <Animated.View entering={FadeInDown.delay(1100).duration(600)} style={{ marginTop: spacing['2xl'] }}>
        <GlassCard glow radius={radius.xl} padding={spacing.xl}>
          <View style={styles.potentialRow}>
            <View style={{ flex: 1 }}>
              <Txt variant="overline" color={palette.gold}>
                YOUR POTENTIAL
              </Txt>
              <View style={styles.potentialValue}>
                <GradientText variant="title" colors={gradients.gold}>
                  {(current.potential / 10).toFixed(1)}
                </GradientText>
                <Txt variant="heading" color={palette.textTertiary} style={{ marginBottom: 2 }}>
                  /10
                </Txt>
              </View>
              <Txt variant="body" color={palette.textSecondary} style={{ marginTop: 4 }}>
                Reachable with your personalized plan
              </Txt>
            </View>
            <LinearGradient colors={gradients.gold} style={styles.deltaBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="trending-up" size={16} color={palette.void} />
              <Txt variant="bodyBold" color={palette.void}>
                +{delta}
              </Txt>
            </LinearGradient>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Feature breakdown */}
      <Animated.View entering={FadeInDown.delay(1280).duration(600)} style={{ marginTop: spacing['2xl'] }}>
        <Txt variant="overline" color={palette.textSecondary} style={{ marginBottom: spacing.md }}>
          FEATURE BREAKDOWN
        </Txt>
        <GlassCard radius={radius.xl} padding={spacing.xl}>
          <View style={{ gap: spacing.xl }}>
            {current.metrics.map((m, i) => (
              <MetricBar key={m.key} label={m.label} value={m.score} delay={1400 + i * 120} />
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Top insight */}
      <Animated.View entering={FadeInDown.delay(1500).duration(600)} style={{ marginTop: spacing.lg }}>
        <GlassCard radius={radius.xl} padding={spacing.lg}>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Ionicons name="bulb" size={18} color={palette.gold} />
            </View>
            <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>
              {current.metrics[0]?.note}
            </Txt>
          </View>
        </GlassCard>
      </Animated.View>

      {/* CTAs */}
      <Animated.View entering={FadeInDown.delay(1650).duration(600)} style={styles.ctas}>
        <GradientButton
          label="See my glow-up plan"
          icon={<Ionicons name="map" size={18} color={palette.white} />}
          onPress={() => router.push('/plan')}
        />
        <GradientButton
          label="Share my aura card"
          variant="glass"
          icon={<Ionicons name="share-social" size={18} color={palette.textPrimary} />}
          onPress={() => router.push('/share')}
          style={{ marginTop: spacing.md }}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: spacing.sm },
  potentialRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  potentialValue: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,198,92,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctas: { marginTop: spacing['2xl'] },
});
