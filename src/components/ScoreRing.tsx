import { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from './Txt';
import { palette, gradients, motion } from '@/theme';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type ScoreRingProps = {
  /** Score on a 0-100 scale. Displayed as x.x on a /10 scale by default. */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Show as /100 instead of /10 (e.g. for sub-metrics). */
  scale100?: boolean;
  delay?: number;
  /** When false, render fully drawn immediately (for screenshots/capture). */
  animate?: boolean;
};

/**
 * Animated circular score gauge. The gradient arc sweeps from 0 to the target
 * while the center number counts up in sync — both driven by one shared value
 * on the UI thread so they never drift apart.
 *
 * The count-up uses the well-known Reanimated trick of animating a read-only
 * TextInput's `text` prop (Text can't take animated props, TextInput can).
 */
export function ScoreRing({
  value,
  size = 240,
  strokeWidth = 16,
  label = 'AURA SCORE',
  scale100 = false,
  delay = 200,
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, value));

  const progress = useSharedValue(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      progress.value = target;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(target, { duration: motion.reveal, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, target, delay, animate]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));

  const animatedTextProps = useAnimatedProps(() => {
    const shown = scale100 ? progress.value : progress.value / 10;
    return { text: shown.toFixed(1), defaultValue: '0.0' } as any;
  });

  const initialText = (scale100 ? target : target / 10).toFixed(1);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="scoreArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradients.scoreMid[0]} />
            <Stop offset="60%" stopColor={gradients.scoreMid[1]} />
            <Stop offset="100%" stopColor={palette.gold} />
          </SvgGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.hairlineStrong}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated progress arc — rotated so it starts at 12 o'clock. */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreArc)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <View style={styles.numberRow}>
          <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            style={styles.number}
            animatedProps={animatedTextProps}
            defaultValue={animate ? '0.0' : initialText}
          />
          <Txt variant="heading" color={palette.textTertiary} style={styles.outOf}>
            {scale100 ? '/100' : '/10'}
          </Txt>
        </View>
        {!!label && (
          <Txt variant="overline" color={palette.textSecondary}>
            {label}
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  number: {
    fontFamily: 'Sora_700Bold',
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -2,
    color: palette.textPrimary,
    padding: 0,
    margin: 0,
    minWidth: 110,
    textAlign: 'right',
  },
  outOf: {
    marginBottom: 12,
    marginLeft: 2,
  },
});
