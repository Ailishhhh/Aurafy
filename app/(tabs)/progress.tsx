import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, Sparkline, GradientButton } from '@/components';
import { analysisStore, useAnalysis } from '@/store/analysisStore';
import type { Analysis } from '@/features/analysis/types';
import { palette, spacing, radius } from '@/theme';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProgressTab() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { history } = useAnalysis();

  const trend = useMemo(() => history.map((h) => h.overall).reverse(), [history]);
  const delta = useMemo(
    () => (history.length < 2 ? null : history[0].overall - history[history.length - 1].overall),
    [history],
  );

  const open = (a: Analysis) => {
    analysisStore.setCurrent(a);
    router.push('/results');
  };

  return (
    <Screen scroll subduedBackground contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Txt variant="title">Progress</Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          Watch your aura score climb as you work the plan.
        </Txt>
      </Animated.View>

      {history.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={{ marginTop: spacing['2xl'] }}>
          <GlassCard radius={radius.xl} padding={spacing.xl}>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="stats-chart" size={32} color={palette.textTertiary} />
              <Txt variant="body" color={palette.textSecondary} center>
                No scans yet. Take your first scan to start tracking your glow-up.
              </Txt>
              <GradientButton
                label="Scan my face"
                icon={<Ionicons name="scan" size={18} color={palette.white} />}
                onPress={() => router.push('/scan')}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </GlassCard>
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(100).duration(450)} style={{ marginTop: spacing.xl }}>
            <GlassCard glow radius={radius.xl} padding={spacing.xl}>
              <View style={styles.trendHeader}>
                <Txt variant="overline" color={palette.textSecondary}>
                  AURA OVER TIME
                </Txt>
                {delta !== null && (
                  <View style={[styles.deltaPill, { backgroundColor: delta >= 0 ? 'rgba(84,227,166,0.14)' : 'rgba(255,107,129,0.14)' }]}>
                    <Ionicons name={delta >= 0 ? 'trending-up' : 'trending-down'} size={13} color={delta >= 0 ? palette.success : palette.danger} />
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
                  Scan again next week to see your trend line build.
                </Txt>
              )}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(450)} style={{ marginTop: spacing['2xl'] }}>
            <Txt variant="overline" color={palette.textSecondary} style={{ marginBottom: spacing.md }}>
              HISTORY
            </Txt>
            <View style={{ gap: spacing.sm }}>
              {history.map((h) => (
                <Pressable key={h.id} onPress={() => open(h)}>
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
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 130 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreChip: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: 'rgba(124,92,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
