import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Screen, Txt, GradientText, GradientButton, GlassCard } from '@/components';
import { palette, gradients, spacing, radius } from '@/theme';

/** Slowly breathing aura ring used as the brand hero mark. */
function AuraMark() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.6 + pulse.value * 0.4,
  }));

  const size = 168;
  return (
    <View style={styles.markWrap}>
      <Animated.View style={[styles.markGlow, ringStyle]}>
        <Svg width={size * 1.6} height={size * 1.6}>
          <Defs>
            <RadialGradient id="markGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={palette.violetBright} stopOpacity={0.7} />
              <Stop offset="60%" stopColor={palette.magenta} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={palette.magenta} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size * 0.8} cy={size * 0.8} r={size * 0.8} fill="url(#markGlow)" />
        </Svg>
      </Animated.View>
      <LinearGradient
        colors={gradients.aura}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.markRing, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={styles.markInner}>
          <Ionicons name="sparkles" size={52} color={palette.goldBright} />
        </View>
      </LinearGradient>
    </View>
  );
}

const VALUE_PROPS = [
  { icon: 'scan-outline', text: 'AI face scan in seconds' },
  { icon: 'trending-up-outline', text: 'See your real glow-up potential' },
  { icon: 'sparkles-outline', text: 'A personalized plan that actually works' },
] as const;

export default function Onboarding() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Animated.View entering={FadeInDown.duration(700)}>
          <AuraMark />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(700)} style={styles.titleBlock}>
          <GradientText variant="hero" style={styles.wordmark}>
            Aurafy
          </GradientText>
          <Txt variant="bodyLg" color={palette.textSecondary} center style={styles.tagline}>
            Unlock your most attractive self. Scan, discover your aura score, and
            level up — one glow at a time.
          </Txt>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(360).duration(700)} style={styles.props}>
        <GlassCard padding={spacing.lg} radius={radius.xl}>
          <View style={{ gap: spacing.lg }}>
            {VALUE_PROPS.map((p) => (
              <View key={p.text} style={styles.propRow}>
                <View style={styles.propIcon}>
                  <Ionicons name={p.icon as any} size={20} color={palette.violetBright} />
                </View>
                <Txt variant="bodyMedium" color={palette.textPrimary} style={{ flex: 1 }}>
                  {p.text}
                </Txt>
              </View>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(520).duration(700)} style={styles.cta}>
        <GradientButton
          label="Get started"
          icon={<Ionicons name="arrow-forward" size={20} color={palette.white} />}
          onPress={() => router.push('/quiz')}
        />
        <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing.md }}>
          Private by design. Your photos are analyzed, never shared.
        </Txt>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingBottom: spacing['3xl'] },
  hero: { alignItems: 'center', marginTop: spacing['4xl'] },
  markWrap: { alignItems: 'center', justifyContent: 'center' },
  markGlow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  markRing: { padding: 3, alignItems: 'center', justifyContent: 'center' },
  markInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 999,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
  },
  titleBlock: { alignItems: 'center', marginTop: spacing['3xl'] },
  wordmark: { textAlign: 'center' },
  tagline: { marginTop: spacing.md, maxWidth: 320 },
  props: {},
  propRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  propIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124,92,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {},
});
