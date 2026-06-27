import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAnalysis } from '@/store/analysisStore';
import { useAuth } from '@/features/auth/authStore';
import { useProfile } from '@/features/profile/profileStore';
import { palette } from '@/theme';

/**
 * Entry gate. Waits for persisted auth + profile + app state to hydrate, then:
 *   - not signed in              -> /auth
 *   - signed in, no profile yet  -> /onboarding (intro) -> quiz
 *   - signed in, profile done    -> /home
 * Renders a blank dark screen while hydrating to avoid a flash of wrong UI.
 */
export default function Index() {
  const { hydrated } = useAnalysis();
  const { hydrated: authHydrated, session } = useAuth();
  const { hydrated: profileHydrated, profile } = useProfile();

  if (!hydrated || !authHydrated || !profileHydrated) {
    return <View style={{ flex: 1, backgroundColor: palette.void }} />;
  }

  if (!session) return <Redirect href="/auth" />;
  if (!profile.completed) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
