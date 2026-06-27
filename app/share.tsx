import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GradientButton } from '@/components';
import { ShareCard } from '@/features/analysis/ShareCard';
import { useAnalysis } from '@/store/analysisStore';
import { inviteStore } from '@/features/invite/inviteStore';
import { APP_DOWNLOAD_URL } from '@/config';
import { palette, spacing, radius, hitSlop } from '@/theme';

type Format = 'post' | 'story';

export default function Share_() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { current } = useAnalysis();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [format, setFormat] = useState<Format>('post');

  if (!current) {
    router.replace('/');
    return null;
  }

  const aspect = format === 'story' ? 1.6 : 1.25;
  // Story is taller, so render it narrower to fit on screen.
  const cardWidth = Math.min(width - spacing.xl * 2, format === 'story' ? 260 : 330);

  const inviteText = `My Aurafy aura score 🔥 How attractive are you? Find out free + get a real glow-up plan.\n\n${APP_DOWNLOAD_URL}`;

  const onShare = async () => {
    setSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Preferred: share the rendered card as an image (needs a dev build).
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('no-sharing');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Aurafy card' });
      inviteStore.recordInvite();
    } catch {
      // Fallback: text/link share (works everywhere, incl. Expo Go).
      try {
        const res = await Share.share({ message: inviteText });
        if (res.action !== Share.dismissedAction) inviteStore.recordInvite();
      } catch {
        Alert.alert('Sharing unavailable', 'Could not open the share sheet on this device.');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={palette.textPrimary} />
        </Pressable>
        <Txt variant="label" color={palette.textSecondary}>
          SHARE YOUR AURA
        </Txt>
        <View style={styles.iconBtn} />
      </View>

      {/* Format toggle */}
      <View style={styles.toggle}>
        {(['post', 'story'] as Format[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFormat(f)}
            style={[styles.toggleBtn, format === f && styles.toggleBtnOn]}
          >
            <Ionicons
              name={f === 'post' ? 'square-outline' : 'phone-portrait-outline'}
              size={15}
              color={format === f ? palette.textPrimary : palette.textTertiary}
            />
            <Txt variant="label" color={format === f ? palette.textPrimary : palette.textTertiary}>
              {f === 'post' ? 'Post' : 'Story'}
            </Txt>
          </Pressable>
        ))}
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={styles.cardWrap}>
        <View collapsable={false} ref={cardRef}>
          <ShareCard analysis={current} width={cardWidth} aspect={aspect} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.actions}>
        <GradientButton
          label="Share my card"
          icon={<Ionicons name="share-social" size={18} color={palette.white} />}
          loading={sharing}
          onPress={onShare}
        />
        <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing.md }}>
          Post it, send it, flex it. Every share spreads your aura — and counts toward unlocking.
        </Txt>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    marginTop: spacing.sm,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  toggleBtnOn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  cardWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  actions: { paddingBottom: spacing.xl },
});
