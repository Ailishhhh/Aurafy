import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAnalysis } from '@/store/analysisStore';
import { palette } from '@/theme';

/**
 * Entry gate. Once persisted state has hydrated, returning users (who have scan
 * history) go straight to Home; first-time users see onboarding. While
 * hydrating we render a blank dark screen so there's no flash of the wrong UI.
 */
export default function Index() {
  const { hydrated, history } = useAnalysis();

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: palette.void }} />;
  }

  return <Redirect href={history.length > 0 ? '/home' : '/onboarding'} />;
}
