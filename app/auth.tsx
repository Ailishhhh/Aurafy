import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen, Txt, Field, GradientButton, GradientText } from '@/components';
import { authStore } from '@/features/auth/authStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

type Mode = 'signup' | 'signin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    try {
      setLoading(true);
      if (isSignup) await authStore.signUp(email, password, name);
      else await authStore.signIn(email, password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const guest = async () => {
    await authStore.continueAsGuest();
    router.replace('/');
  };

  return (
    <Screen scroll subduedBackground contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Brand */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.brand}>
          <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
            <Ionicons name="sparkles" size={26} color={palette.white} />
          </LinearGradient>
          <GradientText variant="title" style={{ textAlign: 'center', marginTop: spacing.lg }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </GradientText>
          <Txt variant="body" color={palette.textSecondary} center style={{ marginTop: spacing.sm }}>
            {isSignup
              ? 'Start your glow-up and track your progress.'
              : 'Sign in to continue your glow-up.'}
          </Txt>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.form}>
          {isSignup && (
            <Field
              label="Name"
              placeholder="Your name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          )}
          <Field
            label="Email"
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            error={error ?? undefined}
          />

          <GradientButton
            label={isSignup ? 'Create account' : 'Sign in'}
            loading={loading}
            onPress={submit}
            style={{ marginTop: spacing.sm }}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Txt variant="caption" color={palette.textTertiary}>
              or
            </Txt>
            <View style={styles.line} />
          </View>

          <GradientButton
            label="Continue with Google"
            variant="glass"
            icon={<Ionicons name="logo-google" size={18} color={palette.textPrimary} />}
            onPress={() =>
              Alert.alert('Coming soon', 'Google sign-in arrives with cloud accounts (Supabase).')
            }
          />

          <Pressable onPress={guest} hitSlop={hitSlop} style={styles.guest}>
            <Txt variant="bodyMedium" color={palette.textSecondary}>
              Continue as guest
            </Txt>
          </Pressable>
        </Animated.View>

        {/* Toggle */}
        <Animated.View entering={FadeIn.delay(320).duration(600)} style={styles.toggle}>
          <Txt variant="body" color={palette.textTertiary}>
            {isSignup ? 'Already have an account?' : 'New to Aurafy?'}{' '}
          </Txt>
          <Pressable
            onPress={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError(null);
            }}
            hitSlop={hitSlop}
          >
            <Txt variant="bodySemi" color={palette.violetBright}>
              {isSignup ? 'Sign in' : 'Create account'}
            </Txt>
          </Pressable>
        </Animated.View>

        <Txt variant="caption" color={palette.textTertiary} center style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy.
        </Txt>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingTop: spacing['4xl'] },
  brand: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { gap: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: palette.hairlineStrong },
  guest: { alignSelf: 'center', paddingVertical: spacing.sm },
  toggle: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing['2xl'] },
  legal: { marginTop: spacing.xl, maxWidth: 280, alignSelf: 'center' },
});
