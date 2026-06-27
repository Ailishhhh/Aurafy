import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, GradientButton } from '@/components';
import { PhotoSlot } from '@/features/analysis/PhotoSlot';
import { analysisStore } from '@/store/analysisStore';
import { palette, spacing, radius, hitSlop } from '@/theme';

const TIPS = [
  'Use soft, even lighting — face a window if you can',
  'Neutral expression, look straight at the camera',
  'Pull hair off your face and remove glasses',
] as const;

export default function Scan() {
  const router = useRouter();
  const [front, setFront] = useState<string>();
  const [side, setSide] = useState<string>();

  const canContinue = !!front;

  const onContinue = () => {
    if (!front) return;
    analysisStore.setPending({ front, side });
    router.push('/analyzing');
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
      </Pressable>

      <Animated.View entering={FadeInDown.duration(600)}>
        <Txt variant="overline" color={palette.violetBright}>
          STEP 1 OF 1
        </Txt>
        <Txt variant="title" style={{ marginTop: spacing.sm }}>
          Let&apos;s scan your face
        </Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          Add a clear front photo. A side profile is optional but makes your jawline
          and harmony analysis far more accurate.
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.slots}>
        <PhotoSlot label="Front" hint="A straight-on selfie works best." required uri={front} onChange={setFront} />
        <PhotoSlot label="Side" hint="Turn 90° for a profile shot." uri={side} onChange={setSide} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).duration(600)} style={{ marginTop: spacing['2xl'] }}>
        <GlassCard padding={spacing.lg} radius={radius.xl}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={18} color={palette.gold} />
            <Txt variant="label" color={palette.textPrimary}>
              For the most accurate score
            </Txt>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {TIPS.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.dot} />
                <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>
                  {tip}
                </Txt>
              </View>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <View style={{ marginTop: spacing['3xl'] }}>
        <GradientButton
          label={canContinue ? 'Analyze my aura' : 'Add a front photo to continue'}
          icon={canContinue ? <Ionicons name="sparkles" size={18} color={palette.white} /> : undefined}
          disabled={!canContinue}
          onPress={onContinue}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginBottom: spacing.lg, width: 40, height: 40, justifyContent: 'center' },
  slots: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing['2xl'] },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.violetBright,
    marginTop: 8,
  },
});
