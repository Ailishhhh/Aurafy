import { type ReactNode } from 'react';
import { StyleSheet, View, ScrollView, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedBackground } from './AnimatedBackground';
import { spacing } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  subduedBackground?: boolean;
  contentStyle?: ViewStyle;
  edges?: readonly Edge[];
  /** Remove default horizontal padding for edge-to-edge layouts. */
  bleed?: boolean;
};

/**
 * Standard screen shell: the animated aura backdrop + a safe-area container,
 * optionally scrollable. Every screen mounts this so the brand backdrop and
 * spacing rhythm stay identical app-wide.
 */
export function Screen({
  children,
  scroll,
  subduedBackground,
  contentStyle,
  edges = ['top', 'bottom'],
  bleed,
}: ScreenProps) {
  const padding = bleed ? undefined : { paddingHorizontal: spacing.xl };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AnimatedBackground subdued={subduedBackground} />
      <SafeAreaView style={styles.safe} edges={edges}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, padding, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07060B' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing['5xl'] },
});
