import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, GradientButton, GradientText, ScoreRing } from '@/components';
import { analysisStore, useAnalysis } from '@/store/analysisStore';
import { profileStore, useProfile } from '@/features/profile/profileStore';
import { useAuth } from '@/features/auth/authStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

export default function HomeTab() {
  const router = useRouter();
  const { history, isPremium } = useAnalysis();
  const { streak } = useProfile();
  const { session } = useAuth();

  const latest = history[0];
  const firstName = (session?.name || 'there').split(' ')[0];

  // Daily visit -> advances the streak (retention loop).
  useEffect(() => {
    profileStore.recordActivity();
  }, []);

  return (
    <Screen scroll subduedBackground contentStyle={styles.content}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Txt variant="overline" color={palette.textSecondary}>
            {new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING'}
          </Txt>
          <GradientText variant="title" style={{ marginTop: 2 }}>
            {firstName}
          </GradientText>
        </View>
        {!isPremium && (
          <Pressable onPress={() => router.push('/paywall')} hitSlop={hitSlop}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proPill}>
              <Ionicons name="diamond" size={13} color={palette.void} />
              <Txt variant="caption" color={palette.void} style={{ fontFamily: 'Inter_700Bold' }}>
                Premium
              </Txt>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Streak */}
      <Animated.View entering={FadeInDown.duration(450)} style={{ marginTop: spacing.lg }}>
        <View style={styles.streakCard}>
          <LinearGradient colors={['#FF9F45', '#FF6B6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flameBadge}>
            <Ionicons name="flame" size={22} color={palette.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" color={palette.textPrimary}>
              {streak.current} day{streak.current === 1 ? '' : 's'} streak
            </Txt>
            <Txt variant="caption" color={palette.textSecondary}>
              {streak.current <= 1
                ? 'You showed up today — come back tomorrow to build it.'
                : `Longest: ${streak.longest} days · keep it going.`}
            </Txt>
          </View>
        </View>
      </Animated.View>

      {/* Latest score or first-scan prompt */}
      {latest ? (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginTop: spacing.lg }}>
          <Pressable onPress={() => { analysisStore.setCurrent(latest); router.push('/results'); }}>
            <GlassCard glow radius={radius.xl} padding={spacing.xl}>
              <View style={styles.heroRow}>
                <ScoreRing value={latest.overall} size={128} strokeWidth={11} animate label="AURA" />
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
                      View analysis
                    </Txt>
                    <Ionicons name="arrow-forward" size={14} color={palette.violetBright} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginTop: spacing.lg }}>
          <GlassCard glow radius={radius.xl} padding={spacing.xl}>
            <Txt variant="heading">Get your aura score</Txt>
            <Txt variant="body" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
              Scan your face for an honest analysis and a personalized glow-up plan.
            </Txt>
          </GlassCard>
        </Animated.View>
      )}

      {/* New scan CTA */}
      <Animated.View entering={FadeInDown.delay(180).duration(500)} style={{ marginTop: spacing.xl }}>
        <GradientButton
          label={latest ? 'New scan' : 'Scan my face'}
          icon={<Ionicons name="scan" size={20} color={palette.white} />}
          onPress={() => router.push('/scan')}
        />
      </Animated.View>

      {/* Credibility */}
      <Animated.View entering={FadeInDown.delay(260).duration(500)} style={{ marginTop: spacing.xl }}>
        <View style={styles.credStrip}>
          <Ionicons name="shield-checkmark" size={15} color={palette.violetBright} />
          <Txt variant="caption" color={palette.textSecondary} style={{ flex: 1 }}>
            Grounded in dermatology, strength science & facial aesthetics
          </Txt>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 130 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
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
  flameBadge: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroInfo: { flex: 1, gap: spacing.xs },
  potentialRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
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
});
