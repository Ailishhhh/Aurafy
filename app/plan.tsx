import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, MetricBar } from '@/components';
import { StepCard } from '@/features/analysis/StepCard';
import { analysisStore, useAnalysis } from '@/store/analysisStore';
import { useInvite } from '@/features/invite/inviteStore';
import { REQUIRED_INVITES } from '@/config';
import { palette, spacing, radius, hitSlop } from '@/theme';

/** Number of steps a free (locked) user can see before the unlock gate. */
const FREE_STEP_LIMIT = 2;

export default function Plan() {
  const router = useRouter();
  const { current, completedSteps, isPremium } = useAnalysis();
  const { invitesSent } = useInvite();
  const unlocked = isPremium || invitesSent >= REQUIRED_INVITES;

  const doneCount = useMemo(
    () => (current ? current.plan.filter((s) => completedSteps[s.id]).length : 0),
    [current, completedSteps],
  );

  if (!current) {
    router.replace('/');
    return null;
  }

  const total = current.plan.length;
  const progress = total ? (doneCount / total) * 100 : 0;

  return (
    <Screen scroll subduedBackground>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          GLOW-UP PLAN
        </Txt>
        <View style={styles.iconBtn} />
      </View>

      <Animated.View entering={FadeInDown.duration(600)}>
        <Txt variant="title">Your roadmap</Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          Work through these, re-scan weekly, and watch your aura score climb toward
          your potential.
        </Txt>
      </Animated.View>

      {/* Progress card */}
      <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ marginTop: spacing.xl }}>
        <GlassCard glow radius={radius.xl} padding={spacing.xl}>
          <View style={styles.progressHeader}>
            <Txt variant="label" color={palette.textSecondary}>
              PROGRESS
            </Txt>
            <Txt variant="bodySemi" color={palette.textPrimary}>
              {doneCount} / {total} done
            </Txt>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <MetricBar label="Completed steps" value={progress} />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Steps */}
      <View style={styles.steps}>
        {current.plan.map((step, i) => {
          const locked = !unlocked && i >= FREE_STEP_LIMIT;
          return (
            <Animated.View key={step.id} entering={FadeInDown.delay(220 + i * 80).duration(500)}>
              <StepCard
                step={step}
                index={i}
                completed={!!completedSteps[step.id]}
                onToggle={() => analysisStore.toggleStep(step.id)}
                locked={locked}
                onUnlock={() => router.push('/paywall')}
              />
            </Animated.View>
          );
        })}
      </View>

      {!unlocked && (
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ marginTop: spacing.lg }}>
          <Pressable onPress={() => router.push('/paywall')}>
            <GlassCard glow radius={radius.xl} padding={spacing.xl}>
              <View style={styles.unlockRow}>
                <Ionicons name="sparkles" size={22} color={palette.goldBright} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodySemi" color={palette.textPrimary}>
                    Unlock your full plan
                  </Txt>
                  <Txt variant="caption" color={palette.textSecondary} style={{ marginTop: 2 }}>
                    Invite friends or go Premium to see every step
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      )}
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
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  steps: { marginTop: spacing.xl, gap: spacing.md },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
