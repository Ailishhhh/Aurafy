import { Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Txt, GlassCard, GradientButton } from '@/components';
import { inviteStore, useInvite } from './inviteStore';
import { APP_DOWNLOAD_URL, REQUIRED_INVITES } from '@/config';
import { palette, gradients, radius, spacing } from '@/theme';

type UnlockGateProps = {
  onPremium: () => void;
};

/**
 * The "invite to unlock" gate shown on results for free users. Every invite
 * spreads the app (viral loop) AND progresses the user toward unlocking — so a
 * point of friction becomes the growth engine. Premium is the instant bypass.
 */
export function UnlockGate({ onPremium }: UnlockGateProps) {
  const { invitesSent } = useInvite();
  const remaining = Math.max(0, REQUIRED_INVITES - invitesSent);

  const invite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await Share.share({
        message: `I just got my honest glow-up analysis on Aurafy 🔥 Get your aura score + a real plan to level up your looks.\n\nDownload: ${APP_DOWNLOAD_URL}`,
      });
      // Count it unless the user explicitly dismissed the share sheet.
      if (res.action !== Share.dismissedAction) {
        inviteStore.recordInvite();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <GlassCard glow radius={radius.xl} padding={spacing.xl}>
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={20} color={palette.goldBright} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">Unlock your full analysis</Txt>
          <Txt variant="body" color={palette.textSecondary} style={{ marginTop: 2 }}>
            See your full breakdown, glow-up plan & hairstyle picks.
          </Txt>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {Array.from({ length: REQUIRED_INVITES }).map((_, i) => (
          <View
            key={i}
            style={[styles.pip, { backgroundColor: i < invitesSent ? palette.violetBright : palette.hairlineStrong }]}
          />
        ))}
      </View>
      <Txt variant="caption" color={palette.textSecondary} style={{ marginBottom: spacing.lg }}>
        {invitesSent} / {REQUIRED_INVITES} friends invited
        {remaining > 0 ? ` · ${remaining} to go` : ' · unlocking...'}
      </Txt>

      <GradientButton
        label={remaining > 0 ? `Invite ${remaining} friend${remaining === 1 ? '' : 's'} to unlock` : 'Invite friends'}
        icon={<Ionicons name="people" size={18} color={palette.white} />}
        onPress={invite}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Txt variant="caption" color={palette.textTertiary}>
          or
        </Txt>
        <View style={styles.line} />
      </View>

      <GradientButton
        label="Unlock instantly with Premium"
        variant="gold"
        icon={<Ionicons name="diamond" size={16} color={palette.void} />}
        onPress={onPremium}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  lockBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,198,92,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.sm },
  pip: { flex: 1, height: 8, borderRadius: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: palette.hairlineStrong },
});
