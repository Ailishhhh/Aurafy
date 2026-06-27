import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAnalysis } from '@/store/analysisStore';
import { useAuth } from '@/features/auth/authStore';
import { palette } from '@/theme';

/**
 * Entry gate. Waits for persisted auth + app state to hydrate, then routes:
 *   - not signed in        -> /auth
 *   - signed in, has scans -> /home
 *   - signed in, brand new -> /onboarding
 * While hydrating we render a blank dark screen to avoid a flash of wrong UI.
 */
export default function Index() {
  const { hydrated, history } = useAnalysis();
  const { hydrated: authHydrated, session } = useAuth();

  if (!hydrated || !authHydrated) {
    return <View style={{ flex: 1, backgroundColor: palette.void }} />;
  }

  if (!session) return <Redirect href="/auth" />;
  return <Redirect href={history.length > 0 ? '/home' : '/onboarding'} />;
}
