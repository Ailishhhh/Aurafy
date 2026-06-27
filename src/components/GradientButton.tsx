import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from './Txt';
import { palette, gradients, radius, shadow, spacing } from '@/theme';

type Variant = 'aura' | 'gold' | 'glass';

type GradientButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Subtle haptic on press. Default on for the premium tactile feel. */
  haptic?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Primary action button. Springs inward on press-in and glows. The `aura` and
 * `gold` variants are filled gradients; `glass` is a frosted outline used for
 * secondary actions so the hierarchy stays obvious.
 */
export function GradientButton({
  label,
  onPress,
  variant = 'aura',
  icon,
  loading,
  disabled,
  style,
  haptic = true,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: 0.35 + glow.value * 0.35,
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 16, stiffness: 240 });
    glow.value = withTiming(1, { duration: 180 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    glow.value = withTiming(0, { duration: 280 });
  };
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const isGlass = variant === 'glass';
  const fill = variant === 'gold' ? gradients.gold : gradients.aura;
  const glowStyle = variant === 'gold' ? shadow.goldGlow : shadow.glow;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        styles.wrap,
        !isGlass && glowStyle,
        { opacity: disabled ? 0.5 : 1 },
        animatedStyle,
        style,
      ]}
    >
      {isGlass ? (
        <View style={[styles.inner, styles.glass]}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <Content label={label} icon={icon} loading={loading} color={palette.textPrimary} />
        </View>
      ) : (
        <LinearGradient
          colors={fill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          <Content
            label={label}
            icon={icon}
            loading={loading}
            color={variant === 'gold' ? palette.void : palette.white}
          />
        </LinearGradient>
      )}
    </AnimatedPressable>
  );
}

function Content({
  label,
  icon,
  loading,
  color,
}: {
  label: string;
  icon?: ReactNode;
  loading?: boolean;
  color: string;
}) {
  if (loading) return <ActivityIndicator color={color} />;
  return (
    <View style={styles.content}>
      {icon}
      <Txt variant="bodySemi" color={color} style={{ fontSize: 16 }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
  },
  inner: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    overflow: 'hidden',
  },
  glass: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
