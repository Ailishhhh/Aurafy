import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, GradientButton } from '@/components';
import { ShareCard } from '@/features/analysis/ShareCard';
import { useAnalysis } from '@/store/analysisStore';
import { palette, spacing, hitSlop } from '@/theme';

export default function Share() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { current } = useAnalysis();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!current) {
    router.replace('/');
    return null;
  }

  const cardWidth = Math.min(width - spacing.xl * 2, 360);

  const onShare = async () => {
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Capture the card to a PNG. Requires a dev/production build — in Expo Go
      // the native module is absent, so we fail gracefully below.
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Aurafy card',
        });
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert(
        'Preview only',
        'Image sharing needs a development build (it is not supported inside Expo Go). Everything else works — this will share once the app is built.',
      );
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

      <Animated.View entering={FadeIn.duration(500)} style={styles.cardWrap} collapsable={false} ref={cardRef}>
        <ShareCard analysis={current} width={cardWidth} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.actions}>
        <GradientButton
          label="Share my card"
          icon={<Ionicons name="share-social" size={18} color={palette.white} />}
          loading={sharing}
          onPress={onShare}
        />
        <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: spacing.md }}>
          Post it, send it, flex it. Tag #Aurafy.
        </Txt>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  actions: { paddingBottom: spacing.xl },
});
