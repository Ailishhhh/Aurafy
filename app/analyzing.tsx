import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Screen, Txt } from '@/components';
import { analysisStore, useAnalysis } from '@/store/analysisStore';
import { analyzeFace } from '@/features/analysis/service';
import { palette, gradients, radius, spacing } from '@/theme';

const STATUSES = [
  'Mapping facial landmarks',
  'Measuring symmetry & ratios',
  'Analyzing jawline & cheekbones',
  'Assessing skin & eye area',
  'Calculating your aura score',
  'Building your glow-up plan',
] as const;

export default function Analyzing() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { pending } = useAnalysis();
  const [statusIndex, setStatusIndex] = useState(0);

  const frameSize = Math.min(width - spacing.xl * 2, 300);
  const sweep = useSharedValue(0);
  const spin = useSharedValue(0);

  // Kick off the analysis + redirect when done.
  useEffect(() => {
    if (!pending) {
      router.replace('/');
      return;
    }
    let active = true;
    analyzeFace(pending).then((analysis) => {
      if (!active) return;
      analysisStore.commit(analysis);
      router.replace('/results');
    });
    return () => {
      active = false;
    };
  }, [pending, router]);

  // Looping animations.
  useEffect(() => {
    sweep.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, false);
    spin.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [sweep, spin]);

  // Cycle status copy.
  useEffect(() => {
    const id = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUSES.length);
    }, 750);
    return () => clearInterval(id);
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sweep.value, [0, 1], [0, frameSize - 4]) }],
    opacity: interpolate(sweep.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, { width: frameSize + 36, height: frameSize + 36 }, ringStyle]}>
          <LinearGradient
            colors={gradients.aura}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: (frameSize + 36) / 2, opacity: 0.5 }]}
          />
        </Animated.View>

        <View style={[styles.frame, { width: frameSize, height: frameSize }]}>
          {pending?.front && (
            <Image source={{ uri: pending.front }} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
          <View style={styles.scanTint} />
          {/* Sweeping scan line */}
          <Animated.View style={[styles.scanLineWrap, sweepStyle]}>
            <LinearGradient
              colors={['transparent', palette.violetBright, palette.goldBright, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanLine}
            />
          </Animated.View>
          {/* Corner brackets */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <View key={c} style={[styles.corner, cornerStyles[c]]} />
          ))}
        </View>
      </View>

      <View style={styles.statusBlock}>
        <Animated.View key={statusIndex} entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <Txt variant="heading" center color={palette.textPrimary}>
            {STATUSES[statusIndex]}
          </Txt>
        </Animated.View>
        <Txt variant="body" center color={palette.textTertiary} style={{ marginTop: spacing.sm }}>
          Hang tight — crafting your personalized analysis
        </Txt>
      </View>
    </Screen>
  );
}

const cornerStyles = StyleSheet.create({
  tl: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
});

const styles = StyleSheet.create({
  content: { justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  frame: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  scanTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,6,11,0.25)' },
  scanLineWrap: { position: 'absolute', left: 0, right: 0, height: 4 },
  scanLine: { height: 4, width: '100%' },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: palette.goldBright,
    borderRadius: 4,
  },
  statusBlock: { marginTop: spacing['5xl'], minHeight: 70, alignItems: 'center' },
});
