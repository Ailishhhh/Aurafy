import { useMemo, useEffect } from 'react';
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
import { profileStore, useProfile } from '@/features/profile/profileStore';
import { PROGRAMS } from '@/features/programs/catalog';
import type { Analysis } from '@/features/analysis/types';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { history, isPremium } = useAnalysis();
  const { streak } = useProfile();

  // Register today's visit -> advances the daily streak (retention loop).
  useEffect(() => {
    profileStore.recordActivity();
  }, []);

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
        <View style={styles.topRight}>
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
          <Pressable onPress={() => router.push('/settings')} hitSlop={hitSlop} style={styles.gearBtn}>
            <Ionicons name="settings-outline" size={22} color={palette.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Credibility strip */}
      <Animated.View entering={FadeInDown.duration(450)} style={{ marginTop: spacing.lg }}>
        <View style={styles.credStrip}>
          <Ionicons name="shield-checkmark" size={15} color={palette.violetBright} />
          <Txt variant="caption" color={palette.textSecondary} style={{ flex: 1 }}>
            Grounded in dermatology, strength science & facial aesthetics
          </Txt>
        </View>
      </Animated.View>

      {/* Streak banner */}
      <Animated.View entering={FadeInDown.delay(60).duration(450)} style={{ marginTop: spacing.md }}>
        <View style={styles.streakCard}>
          <LinearGradient
            colors={['#FF9F45', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.flameBadge}
          >
            <Ionicons name="flame" size={22} color={palette.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" color={palette.textPrimary}>
              {streak.current} day{streak.current === 1 ? '' : 's'} streak
            </Txt>
            <Txt variant="caption" color={palette.textSecondary}>
              {streak.current <= 1
                ? 'You showed up today — come back tomorrow to build it.'
                : `Longest: ${streak.longest} days · keep the momentum going.`}
            </Txt>
          </View>
        </View>
      </Animated.View>

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

      {/* Programs grid */}
      <Animated.View entering={FadeInDown.delay(260).duration(500)} style={{ marginTop: spacing['2xl'] }}>
        <Txt variant="overline" color={palette.textSecondary} style={{ marginBottom: spacing.md }}>
          YOUR PROGRAMS
        </Txt>
        <View style={styles.programGrid}>
          {/* Face analysis card (links to a new scan) */}
          <Pressable style={styles.programCell} onPress={() => router.push('/scan')}>
            <GlassCard radius={radius.lg} padding={spacing.lg}>
              <View style={[styles.programIcon, { backgroundColor: 'rgba(225,92,255,0.16)' }]}>
                <Ionicons name="scan" size={22} color={palette.magenta} />
              </View>
              <Txt variant="bodySemi" color={palette.textPrimary} style={{ marginTop: spacing.md }}>
                Face Analysis
              </Txt>
              <Txt variant="caption" color={palette.textTertiary} style={{ marginTop: 2 }}>
                Scan, score & glow-up plan
              </Txt>
            </GlassCard>
          </Pressable>

          {PROGRAMS.map((p) => (
            <Pressable key={p.id} style={styles.programCell} onPress={() => router.push(`/program/${p.id}`)}>
              <GlassCard radius={radius.lg} padding={spacing.lg}>
                <View style={[styles.programIcon, { backgroundColor: `${p.accent}22` }]}>
                  <Ionicons name={p.icon} size={22} color={p.accent} />
                </View>
                <Txt variant="bodySemi" color={palette.textPrimary} style={{ marginTop: spacing.md }}>
                  {p.title}
                </Txt>
                <Txt variant="caption" color={palette.textTertiary} style={{ marginTop: 2 }}>
                  {p.tagline}
                </Txt>
              </GlassCard>
            </Pressable>
          ))}
        </View>
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,159,69,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,159,69,0.3)',
  },
  flameBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gearBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  credStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(124,92,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,92,255,0.2)',
  },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  programCell: { width: '47.5%', flexGrow: 1 },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
