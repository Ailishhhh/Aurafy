import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Txt, GlassCard } from '@/components';
import { palette, radius, spacing } from '@/theme';
import type { GlowUpStep } from './types';

const CATEGORY_META: Record<
  GlowUpStep['category'],
  { icon: keyof typeof Ionicons.glyphMap; tint: string }
> = {
  skincare: { icon: 'water', tint: '#54C9E3' },
  grooming: { icon: 'cut', tint: '#E15CFF' },
  fitness: { icon: 'barbell', tint: '#54E3A6' },
  style: { icon: 'shirt', tint: '#FFC65C' },
  habits: { icon: 'moon', tint: '#9D7BFF' },
};

type StepCardProps = {
  step: GlowUpStep;
  index: number;
  completed: boolean;
  onToggle: () => void;
  /** Render blurred + locked (premium gate). */
  locked?: boolean;
  onUnlock?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StepCard({ step, index, completed, onToggle, locked, onUnlock }: StepCardProps) {
  const meta = CATEGORY_META[step.category];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (locked) {
      onUnlock?.();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => (scale.value = withSpring(0.98, { damping: 18, stiffness: 260 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 200 }))}
      style={animatedStyle}
    >
      <GlassCard padding={spacing.lg} radius={radius.lg} glow={completed}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: `${meta.tint}22` }]}>
            <Ionicons name={meta.icon} size={20} color={meta.tint} />
          </View>

          <View style={{ flex: 1 }}>
            <Txt variant="bodySemi" color={palette.textPrimary}>
              {step.title}
            </Txt>
            <Txt variant="caption" color={palette.textSecondary} style={{ marginTop: 3 }}>
              {step.description}
            </Txt>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Txt variant="caption" color={palette.textTertiary}>
                  {step.effort}
                </Txt>
              </View>
              <View style={[styles.tag, styles.gainTag]}>
                <Ionicons name="trending-up" size={11} color={palette.gold} />
                <Txt variant="caption" color={palette.gold}>
                  +{(step.potentialGain / 10).toFixed(1)} potential
                </Txt>
              </View>
            </View>
          </View>

          <View style={[styles.check, completed && styles.checkOn]}>
            {completed && <Ionicons name="checkmark" size={16} color={palette.void} />}
          </View>
        </View>

        {locked && (
          <View style={styles.lockOverlay}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.lockContent}>
              <Ionicons name="lock-closed" size={18} color={palette.goldBright} />
              <Txt variant="label" color={palette.textPrimary}>
                Unlock with Premium
              </Txt>
            </View>
          </View>
        )}
      </GlassCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.hairlineStrong,
  },
  gainTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,198,92,0.12)',
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
