import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from './Txt';
import { palette, gradients, radius, spacing, motion } from '@/theme';

type MetricBarProps = {
  label: string;
  /** 0-100. */
  value: number;
  delay?: number;
};

/**
 * A single labelled feature meter (e.g. Jawline, Skin, Symmetry). The fill
 * animates in from the left with a staggered delay so a list of these reads as
 * a cascading reveal rather than everything snapping at once.
 */
export function MetricBar({ label, value, delay = 0 }: MetricBarProps) {
  const w = useSharedValue(0);
  const target = Math.max(0, Math.min(100, value));

  useEffect(() => {
    w.value = withDelay(
      delay,
      withTiming(target, { duration: motion.slow, easing: Easing.out(Easing.cubic) }),
    );
  }, [w, target, delay]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Txt variant="bodyMedium" color={palette.textSecondary}>
          {label}
        </Txt>
        <Txt variant="bodySemi" color={palette.textPrimary}>
          {(target / 10).toFixed(1)}
        </Txt>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={gradients.aura}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.hairlineStrong,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
