import { useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Txt, GlassCard, GradientButton } from '@/components';
import { transformFace, transformAvailable } from './service';
import type { Analysis } from './types';
import { palette, gradients, radius, spacing } from '@/theme';

type FutureSelfProps = {
  analysis: Analysis;
  isPremium: boolean;
  onUnlock: () => void;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * The "Future Self" hook — an AI-generated, realistic glow-up projection of the
 * user. For free users it's a blurred, locked teaser (the single strongest
 * reason to subscribe). For premium users it generates a before/after reveal.
 */
export function FutureSelf({ analysis, isPremium, onUnlock }: FutureSelfProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [after, setAfter] = useState<string | null>(null);

  const generate = async () => {
    try {
      setStatus('loading');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await transformFace(analysis.photos.front);
      setAfter(uri);
      setStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setStatus('error');
    }
  };

  return (
    <GlassCard glow radius={radius.xl} padding={spacing.xl}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={palette.goldBright} />
        <Txt variant="overline" color={palette.gold}>
          YOUR FUTURE SELF
        </Txt>
      </View>
      <Txt variant="heading" style={{ marginTop: spacing.sm }}>
        See who you become
      </Txt>
      <Txt variant="body" color={palette.textSecondary} style={{ marginTop: 4 }}>
        An AI projection of you after following your plan — clearer skin, sharper
        grooming, leaner face.
      </Txt>

      {/* LOCKED (free users) */}
      {!isPremium && (
        <Pressable onPress={onUnlock} style={styles.previewWrap}>
          <Image source={{ uri: analysis.photos.front }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(7,6,11,0.2)', 'rgba(7,6,11,0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.lockCenter}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={22} color={palette.goldBright} />
            </View>
            <Txt variant="bodySemi" color={palette.textPrimary} center style={{ marginTop: spacing.md }}>
              Unlock your transformation
            </Txt>
            <Txt variant="caption" color={palette.textSecondary} center style={{ marginTop: 2 }}>
              Premium · tap to reveal
            </Txt>
          </View>
        </Pressable>
      )}

      {/* PREMIUM: idle -> generate */}
      {isPremium && status === 'idle' && (
        <View style={{ marginTop: spacing.lg }}>
          {!transformAvailable && (
            <Txt variant="caption" color={palette.textTertiary} center style={{ marginBottom: spacing.sm }}>
              Connect the AI backend to enable this.
            </Txt>
          )}
          <GradientButton
            label="Reveal my future self"
            variant="gold"
            icon={<Ionicons name="color-wand" size={18} color={palette.void} />}
            disabled={!transformAvailable}
            onPress={generate}
          />
        </View>
      )}

      {/* PREMIUM: loading */}
      {isPremium && status === 'loading' && (
        <View style={[styles.previewWrap, styles.loadingBox]}>
          <ActivityIndicator color={palette.goldBright} />
          <Txt variant="caption" color={palette.textSecondary} style={{ marginTop: spacing.md }}>
            Generating your glow-up... (this can take ~20s)
          </Txt>
        </View>
      )}

      {/* PREMIUM: done -> before/after */}
      {isPremium && status === 'done' && after && (
        <Animated.View entering={FadeIn.duration(500)} style={styles.compareRow}>
          <View style={styles.compareItem}>
            <Image source={{ uri: analysis.photos.front }} style={styles.compareImg} contentFit="cover" />
            <Txt variant="label" color={palette.textTertiary} center style={{ marginTop: spacing.sm }}>
              NOW
            </Txt>
          </View>
          <Ionicons name="arrow-forward" size={20} color={palette.gold} />
          <View style={styles.compareItem}>
            <LinearGradient colors={gradients.gold} style={styles.afterFrame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Image source={{ uri: after }} style={styles.afterImg} contentFit="cover" />
            </LinearGradient>
            <Txt variant="label" color={palette.gold} center style={{ marginTop: spacing.sm }}>
              YOUR POTENTIAL
            </Txt>
          </View>
        </Animated.View>
      )}

      {isPremium && status === 'done' && (
        <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing.md }}>
          AI projection for motivation — your real results depend on the plan.
        </Txt>
      )}

      {/* PREMIUM: error */}
      {isPremium && status === 'error' && (
        <View style={{ marginTop: spacing.lg }}>
          <Txt variant="body" color={palette.danger} center style={{ marginBottom: spacing.sm }}>
            Couldn&apos;t generate right now. Try again.
          </Txt>
          <GradientButton label="Retry" variant="glass" onPress={generate} />
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewWrap: {
    marginTop: spacing.lg,
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: { backgroundColor: 'rgba(255,255,255,0.03)' },
  lockCenter: { alignItems: 'center', justifyContent: 'center' },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,198,92,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  compareItem: { flex: 1 },
  compareImg: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  afterFrame: { borderRadius: radius.lg, padding: 2 },
  afterImg: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg - 2,
    backgroundColor: palette.surface,
  },
});
