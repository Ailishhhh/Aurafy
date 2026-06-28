import { Tabs } from 'expo-router';
import { LiquidTabBar } from '@/components/LiquidTabBar';

/**
 * Main app shell: a 4-tab navigator (Home / Programs / Progress / Profile)
 * rendered with our floating liquid-glass tab bar. The center Scan button lives
 * in the tab bar itself and pushes the scan flow (it is not a tab screen).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <LiquidTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="programs" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
