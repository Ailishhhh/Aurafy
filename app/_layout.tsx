import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { palette } from '@/theme';
import { analysisStore } from '@/store/analysisStore';
import { authStore } from '@/features/auth/authStore';
import { profileStore } from '@/features/profile/profileStore';
import { inviteStore } from '@/features/invite/inviteStore';
import { coachStore } from '@/features/coach/coachStore';
import { chatStore } from '@/features/coach/chatStore';
import { initCloudSync } from '@/features/sync/cloudSync';
import { billing } from '@/features/billing/billing';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Load persisted auth + profile + invites + history on launch.
  useEffect(() => {
    authStore.hydrate();
    profileStore.hydrate();
    inviteStore.hydrate();
    coachStore.hydrate();
    chatStore.hydrate();
    analysisStore.hydrate();
    // Mirror data to Supabase once stores start emitting (no-op for guests).
    initCloudSync();
    // Initialise RevenueCat (no-op in Expo Go / until an API key is set).
    billing.configure();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.void }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.void },
            animation: 'fade',
            animationDuration: 280,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="quiz" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="program/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="coach" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="chat/[topic]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="scan" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="analyzing" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="results" options={{ animation: 'fade' }} />
          <Stack.Screen name="plan" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="share" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="paywall"
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
