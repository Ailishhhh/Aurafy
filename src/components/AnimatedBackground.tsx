import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { palette, gradients } from '@/theme';

type OrbProps = {
  color: string;
  size: number;
  /** Anchor position as a fraction of the screen (0..1). */
  x: number;
  y: number;
  /** Drift amplitude in px. */
  driftX: number;
  driftY: number;
  duration: number;
  delay?: number;
};

/**
 * A single soft, blurred light orb. We render a true radial gradient via SVG
 * (so the falloff is buttery, not a hard circle) and let Reanimated drift +
 * breathe it on the UI thread for a 60fps "living" backdrop.
 */
function Orb({ color, size, x, y, driftX, driftY, duration, delay = 0 }: OrbProps) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [-driftX, driftX]) },
      { translateY: interpolate(t.value, [0, 1], [driftY, -driftY]) },
      { scale: interpolate(t.value, [0, 1], [0.92, 1.12]) },
    ],
    opacity: interpolate(t.value, [0, 1], [0.55, 0.85]),
  }));

  const gradId = `orb-${color.replace('#', '')}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          left: width * x - size / 2,
          top: height * y - size / 2,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

type AnimatedBackgroundProps = {
  /** Slightly reduce orb intensity on dense content screens. */
  subdued?: boolean;
};

/**
 * Full-screen brand backdrop: a dark vertical canvas wash with three drifting
 * aura orbs (violet, magenta, gold). Drop this as the first child of any screen.
 */
export function AnimatedBackground({ subdued }: AnimatedBackgroundProps) {
  const { width } = useWindowDimensions();
  const base = width * 1.15;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={gradients.canvas}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, subdued && { opacity: 0.55 }]}>
        <Orb color={palette.violet} size={base} x={0.18} y={0.16} driftX={28} driftY={36} duration={9000} />
        <Orb color={palette.magenta} size={base * 0.9} x={0.86} y={0.34} driftX={32} driftY={24} duration={11000} delay={400} />
        <Orb color={palette.gold} size={base * 0.8} x={0.5} y={0.92} driftX={24} driftY={30} duration={13000} delay={900} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});
