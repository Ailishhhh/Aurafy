import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard } from '@/components';
import { PROGRAMS } from '@/features/programs/catalog';
import { palette, spacing, radius } from '@/theme';

export default function ProgramsTab() {
  const router = useRouter();

  return (
    <Screen scroll subduedBackground contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Txt variant="title">Programs</Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          Evidence-based tracks to level up every part of your look.
        </Txt>
      </Animated.View>

      {/* Personalized coach plan — the hero */}
      <Animated.View entering={FadeInDown.delay(60).duration(450)} style={{ marginTop: spacing.xl }}>
        <Pressable onPress={() => router.push('/coach')}>
          <GlassCard glow radius={radius.xl} padding={spacing.lg}>
            <View style={styles.coachRow}>
              <View style={styles.coachIcon}>
                <Ionicons name="sparkles" size={24} color={palette.goldBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodySemi" color={palette.textPrimary}>
                  Your Personalized Plan
                </Txt>
                <Txt variant="caption" color={palette.textSecondary} style={{ marginTop: 2 }}>
                  AI physique + nutrition built from your profile
                </Txt>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
            </View>
          </GlassCard>
        </Pressable>
      </Animated.View>

      <View style={styles.grid}>
        {/* Face analysis */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.cell}>
          <Pressable onPress={() => router.push('/scan')}>
            <GlassCard radius={radius.lg} padding={spacing.lg}>
              <View style={[styles.icon, { backgroundColor: 'rgba(225,92,255,0.16)' }]}>
                <Ionicons name="scan" size={22} color={palette.magenta} />
              </View>
              <Txt variant="bodySemi" color={palette.textPrimary} style={{ marginTop: spacing.md }}>
                Face Analysis
              </Txt>
              <Txt variant="caption" color={palette.textTertiary} style={{ marginTop: 2 }}>
                Scan, score & glow-up plan
              </Txt>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {PROGRAMS.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(140 + i * 70).duration(450)} style={styles.cell}>
            <Pressable onPress={() => router.push(`/program/${p.id}`)}>
              <GlassCard radius={radius.lg} padding={spacing.lg}>
                <View style={[styles.icon, { backgroundColor: `${p.accent}22` }]}>
                  <Ionicons name={p.icon} size={22} color={p.accent} />
                </View>
                <Txt variant="bodySemi" color={palette.textPrimary} style={{ marginTop: spacing.md }}>
                  {p.title}
                </Txt>
                <Txt variant="caption" color={palette.textTertiary} style={{ marginTop: 2 }}>
                  {p.tagline}
                </Txt>
              </GlassCard>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 130 },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  coachIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: 'rgba(255,198,92,0.16)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  cell: { width: '47.5%', flexGrow: 1 },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
