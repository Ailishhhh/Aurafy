import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GlassCard } from '@/components';
import { useAuth, authStore } from '@/features/auth/authStore';
import { useAnalysis, analysisStore } from '@/store/analysisStore';
import { profileStore } from '@/features/profile/profileStore';
import { inviteStore } from '@/features/invite/inviteStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

const APP_VERSION = '1.0.0';

function Row({
  icon,
  tint = palette.violetBright,
  label,
  sub,
  right,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${danger ? palette.danger : tint}1F` }]}>
        <Ionicons name={icon} size={18} color={danger ? palette.danger : tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyMedium" color={danger ? palette.danger : palette.textPrimary}>
          {label}
        </Txt>
        {!!sub && (
          <Txt variant="caption" color={palette.textTertiary} style={{ marginTop: 1 }}>
            {sub}
          </Txt>
        )}
      </View>
      {right ?? (onPress && !danger ? <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} /> : null)}
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { session } = useAuth();
  const { isPremium } = useAnalysis();
  const [notifications, setNotifications] = useState(true);

  const initial = (session?.name?.[0] || 'A').toUpperCase();

  const signOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await authStore.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const clearData = () => {
    Alert.alert('Clear all data', 'This permanently deletes your scans, progress, and account on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          await analysisStore.wipe();
          await profileStore.wipe();
          await inviteStore.wipe();
          await authStore.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Screen scroll subduedBackground>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          SETTINGS
        </Txt>
        <View style={styles.iconBtn} />
      </View>

      {/* Profile */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <GlassCard radius={radius.xl} padding={spacing.xl}>
          <View style={styles.profile}>
            <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Txt variant="title" color={palette.white}>
                {initial}
              </Txt>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Txt variant="heading">{session?.name || 'Aurafy User'}</Txt>
              <Txt variant="body" color={palette.textSecondary}>
                {session?.guest ? 'Guest account' : session?.email || ''}
              </Txt>
            </View>
            {isPremium && (
              <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proBadge}>
                <Ionicons name="diamond" size={12} color={palette.void} />
                <Txt variant="caption" color={palette.void} style={{ fontFamily: 'Inter_700Bold' }}>
                  PRO
                </Txt>
              </LinearGradient>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Premium */}
      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginTop: spacing.lg }}>
        <GlassCard radius={radius.xl} padding={spacing.md}>
          {isPremium ? (
            <Row icon="diamond" tint={palette.gold} label="Aurafy Premium" sub="Active — thank you!" />
          ) : (
            <Row
              icon="diamond"
              tint={palette.gold}
              label="Go Premium"
              sub="Unlock your full plan & future-self"
              onPress={() => router.push('/paywall')}
            />
          )}
        </GlassCard>
      </Animated.View>

      {/* Preferences */}
      <Animated.View entering={FadeInDown.delay(140).duration(500)} style={{ marginTop: spacing.lg }}>
        <Txt variant="overline" color={palette.textSecondary} style={styles.sectionLabel}>
          PREFERENCES
        </Txt>
        <GlassCard radius={radius.xl} padding={spacing.md}>
          <Row
            icon="notifications"
            label="Daily reminders"
            sub="Nudge me to stay on my plan"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: palette.violet, false: palette.hairlineStrong }}
                thumbColor={palette.white}
              />
            }
          />
        </GlassCard>
      </Animated.View>

      {/* About */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: spacing.lg }}>
        <Txt variant="overline" color={palette.textSecondary} style={styles.sectionLabel}>
          ABOUT
        </Txt>
        <GlassCard radius={radius.xl} padding={spacing.md}>
          <Row icon="shield-checkmark" label="Privacy Policy" onPress={() => Alert.alert('Privacy', 'Add your privacy policy URL before launch.')} />
          <View style={styles.sep} />
          <Row icon="document-text" label="Terms of Service" onPress={() => Alert.alert('Terms', 'Add your terms URL before launch.')} />
          <View style={styles.sep} />
          <Row icon="information-circle" label="Version" right={<Txt variant="body" color={palette.textTertiary}>{APP_VERSION}</Txt>} />
        </GlassCard>
      </Animated.View>

      {/* Account */}
      <Animated.View entering={FadeInDown.delay(260).duration(500)} style={{ marginTop: spacing.lg }}>
        <GlassCard radius={radius.xl} padding={spacing.md}>
          <Row icon="log-out" label="Sign out" onPress={signOut} />
          <View style={styles.sep} />
          <Row icon="trash" label="Clear all data" danger onPress={clearData} />
        </GlassCard>
      </Animated.View>

      <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing['2xl'] }}>
        Aurafy · made for your glow-up
      </Txt>
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
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  sectionLabel: { marginBottom: spacing.sm, marginLeft: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: palette.hairline, marginLeft: 60 },
});
