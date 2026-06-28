import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from './Txt';
import { palette, gradients, radius, spacing, shadow } from '@/theme';

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  home: { on: 'home', off: 'home-outline', label: 'Home' },
  programs: { on: 'grid', off: 'grid-outline', label: 'Programs' },
  progress: { on: 'stats-chart', off: 'stats-chart-outline', label: 'Progress' },
  profile: { on: 'person', off: 'person-outline', label: 'Profile' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  routeName,
  focused,
  onPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
}) {
  const meta = ICONS[routeName];
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (!meta) return null;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.86, { damping: 14, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 240 }))}
      style={[styles.item, style]}
    >
      <Ionicons
        name={focused ? meta.on : meta.off}
        size={23}
        color={focused ? palette.violetBright : palette.textTertiary}
      />
      <Txt variant="caption" color={focused ? palette.textPrimary : palette.textTertiary} style={styles.label}>
        {meta.label}
      </Txt>
    </AnimatedPressable>
  );
}

/** Glowing center Scan action — the app's primary verb. */
function ScanButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 240 }))}
      style={[styles.scanWrap, shadow.glow, style]}
    >
      <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanInner}>
        <Ionicons name="scan" size={26} color={palette.white} />
      </LinearGradient>
    </AnimatedPressable>
  );
}

/**
 * Floating liquid-glass tab bar (Apple App Store / Music style).
 *
 * A blurred, rounded pill that hovers above the bottom inset, with 4 nav tabs
 * and a glowing center Scan button (which jumps into the scan flow rather than
 * being a tab). On Android the glass is approximated with BlurView + a top-lit
 * sheen; on iOS 26 we can swap in native Liquid Glass later.
 */
export function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const go = (routeName: string, isFocused: boolean, key: string) => {
    Haptics.selectionAsync();
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(routeName as never);
  };

  const scan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan');
  };

  const routes = state.routes;
  const mid = Math.ceil(routes.length / 2); // split tabs around the center FAB

  return (
    <View pointerEvents="box-none" style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.barFill]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[StyleSheet.absoluteFill, styles.barRim]} pointerEvents="none" />

        <View style={styles.row}>
          {routes.slice(0, mid).map((route) => (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={state.index === state.routes.indexOf(route)}
              onPress={() => go(route.name, state.index === state.routes.indexOf(route), route.key)}
            />
          ))}

          <ScanButton onPress={scan} />

          {routes.slice(mid).map((route) => (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={state.index === state.routes.indexOf(route)}
              onPress={() => go(route.name, state.index === state.routes.indexOf(route), route.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '92%',
    maxWidth: 460,
    height: 66,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,15,28,0.55)',
    ...shadow.soft,
  },
  barFill: { backgroundColor: 'rgba(255,255,255,0.04)' },
  barRim: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 3, width: 60 },
  label: { fontSize: 10 },
  scanWrap: { marginTop: -28 },
  scanInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.void,
  },
});
