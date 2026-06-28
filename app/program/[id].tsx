import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard, GradientButton } from '@/components';
import { getProgram, type ProgramBlock } from '@/features/programs/catalog';
import { palette, spacing, radius, hitSlop } from '@/theme';

function Block({ block, accent }: { block: ProgramBlock; accent: string }) {
  if (block.type === 'paragraph') {
    return (
      <Txt variant="body" color={palette.textSecondary}>
        {block.text}
      </Txt>
    );
  }
  if (block.type === 'list') {
    return (
      <View style={{ gap: spacing.sm }}>
        {block.items.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <View style={[styles.bullet, { backgroundColor: accent }]} />
            <Txt variant="body" color={palette.textSecondary} style={{ flex: 1 }}>
              {item}
            </Txt>
          </View>
        ))}
      </View>
    );
  }
  // callout
  const isWarn = block.tone === 'warning';
  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: isWarn ? 'rgba(255,107,129,0.1)' : 'rgba(124,92,255,0.1)' },
      ]}
    >
      <Ionicons
        name={isWarn ? 'warning' : 'information-circle'}
        size={18}
        color={isWarn ? palette.danger : palette.violetBright}
      />
      <Txt variant="caption" color={palette.textSecondary} style={{ flex: 1 }}>
        {block.text}
      </Txt>
    </View>
  );
}

export default function ProgramScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = getProgram(String(id));

  if (!program) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
          </Pressable>
        </View>
        <Txt variant="heading">Program not found</Txt>
      </Screen>
    );
  }

  return (
    <Screen scroll subduedBackground>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          PROGRAM
        </Txt>
        <View style={styles.iconBtn} />
      </View>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={[`${program.accent}33`, 'transparent']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.iconBadge, { backgroundColor: `${program.accent}22` }]}>
            <Ionicons name={program.icon} size={26} color={program.accent} />
          </View>
          <Txt variant="title" style={{ marginTop: spacing.md }}>
            {program.title}
          </Txt>
          <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: 2 }}>
            {program.subtitle}
          </Txt>
          <View style={styles.basisRow}>
            <Ionicons name="shield-checkmark" size={13} color={program.accent} />
            <Txt variant="caption" color={palette.textSecondary}>
              {program.basis}
            </Txt>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginTop: spacing.lg }}>
        <Txt variant="bodyLg" color={palette.textPrimary}>
          {program.intro}
        </Txt>
      </Animated.View>

      {/* Sections */}
      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        {program.sections.map((section, i) => (
          <Animated.View key={section.heading} entering={FadeInDown.delay(180 + i * 90).duration(500)}>
            <GlassCard radius={radius.xl} padding={spacing.xl}>
              <Txt variant="heading" style={{ marginBottom: spacing.md }}>
                {section.heading}
              </Txt>
              <View style={{ gap: spacing.md }}>
                {section.blocks.map((b, bi) => (
                  <Block key={bi} block={b} accent={program.accent} />
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* Ask the AI coach about this program */}
      <View style={{ marginTop: spacing.xl }}>
        <GradientButton
          label={`Ask your coach about ${program.title.toLowerCase()}`}
          icon={<Ionicons name="chatbubbles" size={18} color={palette.white} />}
          onPress={() => router.push(`/chat/${program.id}`)}
        />
      </View>

      {program.disclaimer && (
        <View style={styles.disclaimer}>
          <Txt variant="caption" color={palette.textTertiary} center>
            {program.disclaimer}
          </Txt>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCard: { borderRadius: radius.xl, padding: spacing.xl },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basisRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  disclaimer: { marginTop: spacing['2xl'], paddingHorizontal: spacing.md },
});
