import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Txt } from '@/components';
import { palette, gradients, radius, spacing } from '@/theme';

type PhotoSlotProps = {
  label: string;
  hint: string;
  required?: boolean;
  uri?: string;
  onChange: (uri: string | undefined) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A single tappable photo slot. Tapping presents a camera/gallery choice via
 * the OS picker. The aura gradient frame fills in once a photo is chosen so the
 * "completion" state reads instantly.
 */
export function PhotoSlot({ label, hint, required, uri, onChange }: PhotoSlotProps) {
  const [busy, setBusy] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pick = async (mode: 'camera' | 'library') => {
    try {
      setBusy(true);
      const perm =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          `Aurafy needs ${mode === 'camera' ? 'camera' : 'photo'} access to continue.`,
        );
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      };
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onChange(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const onPress = () => {
    Alert.alert(label, hint, [
      { text: 'Take photo', onPress: () => pick('camera') },
      { text: 'Choose from gallery', onPress: () => pick('library') },
      ...(uri ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => onChange(undefined) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={busy}
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 16, stiffness: 240 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 200 }))}
      style={[styles.wrap, animatedStyle]}
    >
      {uri ? (
        <LinearGradient colors={gradients.aura} style={styles.frame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.imageClip}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={22} color={palette.success} />
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={28} color={palette.violetBright} />
          </View>
          <Txt variant="bodySemi" color={palette.textPrimary} center style={{ marginTop: spacing.md }}>
            {label}
          </Txt>
          <Txt variant="caption" color={palette.textTertiary} center style={{ marginTop: 2 }}>
            {required ? 'Required' : 'Optional'}
          </Txt>
        </View>
      )}
    </AnimatedPressable>
  );
}

const RADIUS = radius.xl;

const styles = StyleSheet.create({
  wrap: { flex: 1, aspectRatio: 3 / 4 },
  frame: { flex: 1, borderRadius: RADIUS, padding: 2 },
  imageClip: {
    flex: 1,
    borderRadius: RADIUS - 2,
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(7,6,11,0.6)',
    borderRadius: 999,
  },
  empty: {
    flex: 1,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: palette.hairlineStrong,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124,92,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
