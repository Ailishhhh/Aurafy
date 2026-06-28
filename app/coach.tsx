import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, GradientButton } from '@/components';
import { coachStore, useCoach } from '@/features/coach/coachStore';
import { UnlockGate } from '@/features/invite/UnlockGate';
import { useAnalysis } from '@/store/analysisStore';
import { useInvite } from '@/features/invite/inviteStore';
import { REQUIRED_INVITES } from '@/config';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

export default function Coach() {
  const router = useRouter();
  const { plan, status } = useCoach();
  const { isPremium } = useAnalysis();
  const { invitesSent } = useInvite();
  const unlocked = isPremium || invitesSent >= REQUIRED_INVITES;

  useEffect(() => {
    if (unlocked && status === 'idle' && !plan) coachStore.generate();
  }, [unlocked, status, plan]);

  return (
    <Screen scroll subduedBackground contentStyle={{ paddingBottom: spacing['5xl'] }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          YOUR COACH PLAN
        </Txt>
        <View style={styles.iconBtn} />
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient colors={['rgba(124,92,255,0.25)', 'transparent']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroIcon}>
            <Ionicons name="barbell" size={26} color={palette.violetBright} />
          </View>
          <Txt variant="title" style={{ marginTop: spacing.md }}>
            Your personalized plan
          </Txt>
          <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: 2 }}>
            Built around your body, your goals, where you train, and how you eat.
          </Txt>
        </LinearGradient>
      </Animated.View>

      {/* Ask the AI coach */}
      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginTop: spacing.lg }}>
        <GradientButton
          label="Ask your coach anything"
          variant="glass"
          icon={<Ionicons name="chatbubbles" size={18} color={palette.textPrimary} />}
          onPress={() => router.push('/chat/general')}
        />
      </Animated.View>

      {/* Locked */}
      {!unlocked && (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginTop: spacing.xl }}>
          <UnlockGate onPremium={() => router.push('/paywall')} />
        </Animated.View>
      )}

      {/* Loading */}
      {unlocked && status === 'loading' && (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.violetBright} />
          <Txt variant="body" color={palette.textSecondary} style={{ marginTop: spacing.md }}>
            Your coach is building your plan...
          </Txt>
        </View>
      )}

      {/* Error */}
      {unlocked && status === 'error' && (
        <View style={{ marginTop: spacing.xl }}>
          <GradientButton label="Try again" onPress={() => coachStore.generate()} />
        </View>
      )}

      {/* Plan */}
      {unlocked && status === 'done' && plan && (
        <Animated.View entering={FadeIn.duration(400)}>
          {!!plan.summary && (
            <Txt variant="bodyLg" color={palette.textPrimary} style={{ marginTop: spacing.xl }}>
              {plan.summary}
            </Txt>
          )}

          {/* Targets */}
          <View style={styles.targets}>
            <GlassCard glow radius={radius.lg} padding={spacing.lg} style={styles.targetCard}>
              <Txt variant="overline" color={palette.textSecondary}>CALORIES</Txt>
              <Txt variant="heading" color={palette.textPrimary} style={{ marginTop: 4 }}>{plan.calorieTarget}</Txt>
            </GlassCard>
            <GlassCard glow radius={radius.lg} padding={spacing.lg} style={styles.targetCard}>
              <Txt variant="overline" color={palette.textSecondary}>PROTEIN</Txt>
              <Txt variant="heading" color={palette.textPrimary} style={{ marginTop: 4 }}>{plan.proteinTarget}</Txt>
            </GlassCard>
          </View>

          {/* Workout */}
          <Section icon="barbell" title="Workout" subtitle={plan.workout.split} />
          <View style={{ gap: spacing.md }}>
            {plan.workout.days.map((d, i) => (
              <GlassCard key={i} radius={radius.lg} padding={spacing.lg}>
                <View style={styles.dayHeader}>
                  <Txt variant="bodySemi" color={palette.textPrimary}>{d.day}</Txt>
                  <Txt variant="caption" color={palette.violetBright}>{d.focus}</Txt>
                </View>
                <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                  {d.exercises.map((e, j) => (
                    <View key={j} style={styles.exRow}>
                      <View style={styles.dot} />
                      <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>{e}</Txt>
                    </View>
                  ))}
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Nutrition */}
          <Section icon="restaurant" title="Nutrition" subtitle={plan.nutrition.approach} />
          <GlassCard radius={radius.xl} padding={spacing.xl}>
            <View style={{ gap: spacing.lg }}>
              {plan.nutrition.meals.map((m, i) => (
                <View key={i}>
                  <Txt variant="bodySemi" color={palette.textPrimary}>{m.name}</Txt>
                  <Txt variant="body" color={palette.textSecondary} style={{ marginTop: 2 }}>{m.idea}</Txt>
                </View>
              ))}
              {plan.nutrition.tips.length > 0 && <View style={styles.sep} />}
              {plan.nutrition.tips.map((t, i) => (
                <View key={`t${i}`} style={styles.exRow}>
                  <Ionicons name="checkmark-circle" size={16} color={palette.success} />
                  <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>{t}</Txt>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Habits */}
          {plan.habits.length > 0 && (
            <>
              <Section icon="repeat" title="Daily habits" />
              <GlassCard radius={radius.xl} padding={spacing.xl}>
                <View style={{ gap: spacing.md }}>
                  {plan.habits.map((h, i) => (
                    <View key={i} style={styles.exRow}>
                      <View style={styles.dot} />
                      <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>{h}</Txt>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </>
          )}

          {!!plan.notes && (
            <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing['2xl'] }}>
              {plan.notes}
            </Txt>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <GradientButton
              label="Regenerate plan"
              variant="glass"
              icon={<Ionicons name="refresh" size={18} color={palette.textPrimary} />}
              onPress={() => coachStore.generate()}
            />
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

function Section({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={palette.violetBright} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="heading">{title}</Txt>
        {!!subtitle && <Txt variant="caption" color={palette.textSecondary}>{subtitle}</Txt>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.xl, padding: spacing.xl },
  heroIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(124,92,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: spacing['4xl'], alignItems: 'center' },
  targets: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  targetCard: { flex: 1 },
  section: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing['2xl'], marginBottom: spacing.md },
  sectionIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(124,92,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.violetBright, marginTop: 8 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: palette.hairline },
});
