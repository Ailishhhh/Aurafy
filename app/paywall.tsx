import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, GradientButton, GradientText } from '@/components';
import { billing, PLANS, PREMIUM_BENEFITS, type Plan, type PlanId } from '@/features/billing/billing';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

function PlanOption({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) {
  const inner = (
    <View style={[styles.planInner, selected && styles.planInnerSelected]}>
      <View style={{ flex: 1 }}>
        <View style={styles.planTitleRow}>
          <Txt variant="bodySemi" color={palette.textPrimary}>
            {plan.title}
          </Txt>
          {plan.badge && (
            <LinearGradient colors={gradients.gold} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Txt variant="caption" color={palette.void} style={{ fontFamily: 'Inter_700Bold' }}>
                {plan.badge}
              </Txt>
            </LinearGradient>
          )}
        </View>
        {plan.subtitle && (
          <Txt variant="caption" color={palette.textSecondary} style={{ marginTop: 2 }}>
            {plan.subtitle}
          </Txt>
        )}
      </View>
      <Txt variant="heading" color={palette.textPrimary}>
        {plan.price}
      </Txt>
      <View style={[styles.radioDot, selected && styles.radioDotOn]}>
        {selected && <Ionicons name="checkmark" size={14} color={palette.void} />}
      </View>
    </View>
  );

  return (
    <Pressable onPress={onPress}>
      {selected ? (
        <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planRing}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={styles.planRingPlain}>{inner}</View>
      )}
    </Pressable>
  );
}

export default function Paywall() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>(
    PLANS.find((p) => p.highlighted)?.id ?? PLANS[0].id,
  );
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    setBusy(true);
    const res = await billing.purchase(selected);
    setBusy(false);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  const onRestore = async () => {
    setBusy(true);
    await billing.restore();
    setBusy(false);
  };

  return (
    <Screen scroll subduedBackground>
      <View style={styles.topBar}>
        <View style={styles.iconBtn} />
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={palette.textSecondary} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <View style={styles.crownWrap}>
          <LinearGradient colors={gradients.gold} style={styles.crown} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="diamond" size={26} color={palette.void} />
          </LinearGradient>
        </View>
        <GradientText variant="title" colors={gradients.aura} style={{ textAlign: 'center', marginTop: spacing.lg }}>
          Aurafy Premium
        </GradientText>
        <Txt variant="bodyLg" color={palette.textSecondary} center style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Unlock your full potential and the complete roadmap to get there.
        </Txt>
      </Animated.View>

      {/* Benefits */}
      <Animated.View entering={FadeInDown.delay(140).duration(600)} style={{ marginTop: spacing['2xl'] }}>
        <GlassCard radius={radius.xl} padding={spacing.xl}>
          <View style={{ gap: spacing.lg }}>
            {PREMIUM_BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color={palette.success} />
                </View>
                <Txt variant="bodyMedium" color={palette.textPrimary} style={{ flex: 1 }}>
                  {b}
                </Txt>
              </View>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Plans */}
      <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.plans}>
        {PLANS.map((p) => (
          <PlanOption key={p.id} plan={p} selected={selected === p.id} onPress={() => setSelected(p.id)} />
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(420).duration(600)} style={{ marginTop: spacing.xl }}>
        <GradientButton
          label="Unlock Premium"
          variant="gold"
          loading={busy}
          icon={<Ionicons name="sparkles" size={18} color={palette.void} />}
          onPress={onContinue}
        />
        <View style={styles.footerLinks}>
          <Pressable onPress={onRestore} hitSlop={hitSlop}>
            <Txt variant="caption" color={palette.textTertiary}>
              Restore
            </Txt>
          </Pressable>
          <Txt variant="caption" color={palette.textTertiary}>
            ·
          </Txt>
          <Txt variant="caption" color={palette.textTertiary}>
            Cancel anytime
          </Txt>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: spacing.sm },
  crownWrap: { alignItems: 'center' },
  crown: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(84,227,166,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plans: { marginTop: spacing['2xl'], gap: spacing.md },
  planRing: { borderRadius: radius.lg, padding: 1.5 },
  planRingPlain: {
    borderRadius: radius.lg,
    padding: 1.5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
  },
  planInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg - 1,
    backgroundColor: palette.surface,
  },
  planInnerSelected: { backgroundColor: palette.surfaceRaised },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  radioDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotOn: { backgroundColor: palette.gold, borderColor: palette.gold },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
