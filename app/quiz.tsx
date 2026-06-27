import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Screen, Txt, GradientButton } from '@/components';
import { profileStore, type Profile } from '@/features/profile/profileStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

type Option = { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap };
type Question = {
  id: keyof Profile;
  type: 'single' | 'multi';
  title: string;
  subtitle: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    id: 'goals',
    type: 'multi',
    title: 'What do you want to improve?',
    subtitle: 'Pick all that apply — we\'ll prioritise your plan around these.',
    options: [
      { value: 'skin', label: 'Clearer skin', icon: 'water' },
      { value: 'jawline', label: 'Sharper jawline', icon: 'scan' },
      { value: 'hair', label: 'Hair & grooming', icon: 'cut' },
      { value: 'physique', label: 'Build physique', icon: 'barbell' },
      { value: 'height', label: 'Height & posture', icon: 'resize' },
      { value: 'confidence', label: 'More confidence', icon: 'flame' },
    ],
  },
  {
    id: 'ageRange',
    type: 'single',
    title: 'How old are you?',
    subtitle: 'This tailors your plan — especially height & growth advice.',
    options: [
      { value: 'under16', label: 'Under 16' },
      { value: '16-19', label: '16 – 19' },
      { value: '20-24', label: '20 – 24' },
      { value: '25-29', label: '25 – 29' },
      { value: '30plus', label: '30+' },
    ],
  },
  {
    id: 'gender',
    type: 'single',
    title: 'Your gender',
    subtitle: 'Helps us tailor grooming & physique recommendations.',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other / prefer not to say' },
    ],
  },
  {
    id: 'timePerDay',
    type: 'single',
    title: 'How much time can you commit daily?',
    subtitle: 'We\'ll size your routine so you actually stick to it.',
    options: [
      { value: '5 min', label: '~5 minutes' },
      { value: '15 min', label: '~15 minutes' },
      { value: '30+ min', label: '30+ minutes' },
    ],
  },
];

export default function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({ goals: [] });

  const q = QUESTIONS[step];
  const progress = useSharedValue((step + 1) / QUESTIONS.length);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const current = answers[q.id];
  const answered = q.type === 'multi' ? Array.isArray(current) && current.length > 0 : !!current;

  const toggle = (value: string) => {
    Haptics.selectionAsync();
    setAnswers((prev) => {
      if (q.type === 'multi') {
        const arr = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
        return { ...prev, [q.id]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
      }
      return { ...prev, [q.id]: value };
    });
  };

  const isSelected = (value: string) =>
    q.type === 'multi' ? (current as string[])?.includes(value) : current === value;

  const next = () => {
    if (!answered) return;
    if (step < QUESTIONS.length - 1) {
      const ns = step + 1;
      setStep(ns);
      progress.value = withTiming((ns + 1) / QUESTIONS.length, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      profileStore.complete({
        goals: (answers.goals as string[]) ?? [],
        ageRange: answers.ageRange as any,
        gender: answers.gender as any,
        timePerDay: answers.timePerDay as string,
      });
      router.replace('/home');
    }
  };

  const back = () => {
    if (step === 0) {
      router.back();
      return;
    }
    const ns = step - 1;
    setStep(ns);
    progress.value = withTiming((ns + 1) / QUESTIONS.length, { duration: 300, easing: Easing.out(Easing.cubic) });
  };

  return (
    <Screen subduedBackground>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Pressable onPress={back} hitSlop={hitSlop} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, barStyle]}>
            <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <Txt variant="caption" color={palette.textTertiary}>
          {step + 1}/{QUESTIONS.length}
        </Txt>
      </View>

      <Animated.View key={q.id} entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)} style={styles.body}>
        <Txt variant="title" style={{ marginTop: spacing.xl }}>
          {q.title}
        </Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          {q.subtitle}
        </Txt>

        <View style={styles.options}>
          {q.options.map((opt) => {
            const sel = isSelected(opt.value);
            return (
              <Pressable key={opt.value} onPress={() => toggle(opt.value)}>
                {sel ? (
                  <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.optRing}>
                    <View style={[styles.optInner, styles.optInnerSel]}>
                      {opt.icon && <Ionicons name={opt.icon} size={20} color={palette.violetBright} />}
                      <Txt variant="bodyMedium" color={palette.textPrimary} style={{ flex: 1 }}>
                        {opt.label}
                      </Txt>
                      <Ionicons name="checkmark-circle" size={22} color={palette.violetBright} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.optPlain}>
                    {opt.icon && <Ionicons name={opt.icon} size={20} color={palette.textSecondary} />}
                    <Txt variant="bodyMedium" color={palette.textPrimary} style={{ flex: 1 }}>
                      {opt.label}
                    </Txt>
                    <View style={styles.emptyDot} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <GradientButton
          label={step < QUESTIONS.length - 1 ? 'Continue' : 'Build my plan'}
          disabled={!answered}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconBtn: { width: 32, height: 40, justifyContent: 'center' },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: palette.hairlineStrong, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  body: { flex: 1 },
  options: { marginTop: spacing['2xl'], gap: spacing.md },
  optRing: { borderRadius: radius.lg, padding: 1.5 },
  optInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg - 1,
    backgroundColor: palette.surfaceRaised,
  },
  optInnerSel: {},
  optPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: palette.hairlineStrong,
  },
  footer: { paddingTop: spacing.lg },
});
