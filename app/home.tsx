import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Screen,
  Txt,
  GlassCard,
  GradientButton,
  GradientText,
  ScoreRing,
  Sparkline,
} from '@/components';
import { analysisStore, useAnalysis } from '@/store/analysisStore';
import type { Analysis } from '@/features/analysis/types';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { history, isPremium } = useAnalysis();

  const latest = history[0];
  // Oldest -> newest for the trend line.
  const trend = useMemo(() => history.map((h) => h.overall).reverse(), [history]);
  const delta = useMemo(() => {
    if (history.length < 2) return null;
    return history[0].overall - history[history.length - 1].overall;
  }, [history]);

  const openAnalysis = (a: Analysis) => {
    analysisStore.setCurrent(a);
    router.push('/results');
  };

  return (
    <Screen scroll subduedBackground>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Txt variant="overline" color={palette.textSecondary}>
            WELCOME BACK
          </Txt>
          <GradientText variant="title" style={{ marginTop: 2 }}>
            Aurafy
          </GradientText>
        </View>
        {!isPremium && (
          <Pressable onPress={() => router.push('/paywall')} hitSlop={hitSlop}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}>
              <Ionicons name="diamond" size={13} color={palette.void} />
              <Txt variant="caption" color={palette.void} style={{ fontFamily: 'Inter_700Bold' }}>
                Go Premium
              </Txt>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Latest score hero */}
      {latest && (
        <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: spacing.xl }}>
          <Pressable onPress={() => openAnalysis(latest)}>
            <GlassCard glow radius={radius.xl} padding={spacing.xl}>
              <View style={styles.heroRow}>
                <ScoreRing value={latest.overall} size={132} strokeWidth={11} animate label="CURRENT" />
                <View style={styles.heroInfo}>
                  <Txt variant="label" color={palette.textSecondary}>
                    POTENTIAL
                  </Txt>
                  <View style={styles.potentialRow}>
                    <GradientText variant="title" colors={gradients.gold}>
                      {(latest.potential / 10).toFixed(1)}
                    </GradientText>
                    <Txt variant="heading" color={palette.textTertiary} style={{ marginBottom: 2 }}>
                      /10
                    </Txt>
                  </View>
                  <View style={styles.viewLink}>
                    <Txt variant="label" color={palette.violetBright}>
                      View full analysis
                    </Txt>
                    <Ionicons name="arrow-forward" size={14} color={palette.violetBright} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      )}

      {/* Progress trend */}
      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ marginTop: spacing.lg }}>
        <GlassCard radius={radius.xl} padding={spacing.xl}>
          <View style={styles.trendHeader}>
            <Txt variant="overline" color={palette.textSecondary}>
              YOUR PROGRESS
            </Txt>
            {delta !== null && (
              <View style={[styles.deltaPill, { backgroundColor: delta >= 0 ? 'rgba(84,227,166,0.14)' : 'rgba(255,107,129,0.14)' }]}>
                <Ionicons
                  name={delta >= 0 ? 'trending-up' : 'trending-down'}
                  size={13}
                  color={delta >= 0 ? palette.success : palette.danger}
                />
                <Txt variant="caption" color={delta >= 0 ? palette.success : palette.danger}>
                  {delta >= 0 ? '+' : ''}{(delta / 10).toFixed(1)}
                </Txt>
              </View>
            )}
          </View>
          {trend.length >= 2 ? (
            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Sparkline values={trend} width={width - spacing.xl * 4} />
            </View>
          ) : (
            <Txt variant="body" color={palette.textSecondary} style={{ marginTop: spacing.md }}>
              Scan again next week to start tracking your glow-up over time.
            </Txt>
          )}
        </GlassCard>
      </Animated.View>

      {/* New scan CTA */}
      <Animated.View entering={FadeInDown.delay(220).duration(500)} style={{ marginTop: spacing.xl }}>
        <GradientButton
          label="New scan"
          icon={<Ionicons name="camera" size={20} color={palette.white} />}
          onPress={() => router.push('/scan')}
        />
      </Animated.View>

      {/* History list */}
      {history.length > 0 && (
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={{ marginTop: spacing['2xl'] }}>
          <Txt variant="overline" color={palette.textSecondary} style={{ marginBottom: spacing.md }}>
            HISTORY
          </Txt>
          <View style={{ gap: spacing.sm }}>
            {history.map((h) => (
              <Pressable key={h.id} onPress={() => openAnalysis(h)}>
                <GlassCard padding={spacing.lg} radius={radius.lg}>
                  <View style={styles.historyRow}>
                    <View style={styles.scoreChip}>
                      <Txt variant="bodyBold" color={palette.textPrimary}>
                        {(h.overall / 10).toFixed(1)}
                      </Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodySemi" color={palette.textPrimary}>
                        {formatDate(h.createdAt)}
                      </Txt>
                      <Txt variant="caption" color={palette.textTertiary} numberOfLines={1}>
                        {h.headline}
                      </Txt>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroInfo: { flex: 1, gap: spacing.xs },
  potentialRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreChip: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124,92,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
