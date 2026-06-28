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
import { Screen, Txt, Field, GradientButton } from '@/components';
import { profileStore } from '@/features/profile/profileStore';
import { palette, gradients, spacing, radius, hitSlop } from '@/theme';

type Option = { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap; desc?: string };
type Step =
  | { kind: 'choice'; id: string; multi?: boolean; title: string; subtitle: string; options: Option[]; optional?: boolean }
  | { kind: 'measure'; id: 'measure'; title: string; subtitle: string; optional?: boolean }
  | { kind: 'text'; id: 'about'; title: string; subtitle: string; placeholder: string; optional?: boolean };

const STEPS: Step[] = [
  {
    kind: 'choice', id: 'goals', multi: true,
    title: 'What do you want to improve?',
    subtitle: 'Pick all that apply — we prioritise your plan around these.',
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
    kind: 'choice', id: 'ageRange',
    title: 'How old are you?',
    subtitle: 'This tailors your plan — especially height & growth advice.',
    options: [
      { value: 'under16', label: 'Under 16' }, { value: '16-19', label: '16 – 19' },
      { value: '20-24', label: '20 – 24' }, { value: '25-29', label: '25 – 29' }, { value: '30plus', label: '30+' },
    ],
  },
  {
    kind: 'choice', id: 'gender',
    title: 'Your gender',
    subtitle: 'Helps tailor grooming & physique recommendations.',
    options: [
      { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other / prefer not to say' },
    ],
  },
  {
    kind: 'measure', id: 'measure',
    title: 'Your height & weight',
    subtitle: 'Lets us calculate your calorie & protein targets. Optional.',
    optional: true,
  },
  {
    kind: 'choice', id: 'bodyType',
    title: 'Your current build',
    subtitle: 'Be honest — it shapes your physique plan.',
    options: [
      { value: 'lean', label: 'Lean / skinny', icon: 'body' },
      { value: 'average', label: 'Average', icon: 'body' },
      { value: 'heavier', label: 'Heavier / soft', icon: 'body' },
      { value: 'muscular', label: 'Muscular', icon: 'barbell' },
    ],
  },
  {
    kind: 'choice', id: 'trainingPlace',
    title: 'Where will you train?',
    subtitle: 'We only prescribe what you can actually do.',
    options: [
      { value: 'gym', label: 'Gym', icon: 'barbell', desc: 'Full equipment access' },
      { value: 'home', label: 'Home', icon: 'home', desc: 'Bodyweight / minimal gear' },
      { value: 'none', label: 'Not training yet', icon: 'walk', desc: 'Start gentle' },
    ],
  },
  {
    kind: 'choice', id: 'diet',
    title: 'Your diet',
    subtitle: 'So your meals actually fit your life.',
    options: [
      { value: 'veg', label: 'Vegetarian', icon: 'leaf' },
      { value: 'eggetarian', label: 'Eggetarian', icon: 'egg' },
      { value: 'nonveg', label: 'Non-vegetarian', icon: 'restaurant' },
      { value: 'vegan', label: 'Vegan', icon: 'leaf' },
    ],
  },
  {
    kind: 'choice', id: 'timePerDay',
    title: 'How much time can you commit daily?',
    subtitle: "We'll size your routine so you actually stick to it.",
    options: [
      { value: '5 min', label: '~5 minutes' }, { value: '15 min', label: '~15 minutes' }, { value: '30+ min', label: '30+ minutes' },
    ],
  },
  {
    kind: 'choice', id: 'coachVibe',
    title: 'How should your coach talk to you?',
    subtitle: 'Set the tone of your analysis & plan.',
    options: [
      { value: 'gentle', label: 'Gentle', icon: 'heart', desc: 'Supportive & encouraging' },
      { value: 'honest', label: 'Honest', icon: 'chatbox-ellipses', desc: 'Straight, balanced truth' },
      { value: 'brutal', label: 'Brutal', icon: 'flame', desc: 'No sugar-coating at all' },
    ],
  },
  {
    kind: 'text', id: 'about',
    title: 'Tell your coach about you',
    subtitle: 'Anything — your routine, struggles, goals, lifestyle. The more you share, the more personal your plan. Optional.',
    placeholder: "e.g. I'm a student, I sit a lot, I want to look sharper for college, I can hit the gym 4x a week, I struggle with late nights...",
    optional: true,
  },
];

export default function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({ goals: [] });

  const s = STEPS[step];
  const progress = useSharedValue((step + 1) / STEPS.length);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const answered = (() => {
    if (s.optional) return true;
    if (s.kind === 'choice') {
      const v = answers[s.id];
      return s.multi ? Array.isArray(v) && v.length > 0 : !!v;
    }
    return true;
  })();

  const setProgress = (i: number) =>
    (progress.value = withTiming((i + 1) / STEPS.length, { duration: 300, easing: Easing.out(Easing.cubic) }));

  const toggle = (value: string) => {
    Haptics.selectionAsync();
    setAnswers((prev) => {
      if (s.kind === 'choice' && s.multi) {
        const arr: string[] = Array.isArray(prev[s.id]) ? prev[s.id] : [];
        return { ...prev, [s.id]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
      }
      return { ...prev, [s.id]: value };
    });
  };

  const isSelected = (value: string) =>
    s.kind === 'choice' && (s.multi ? (answers[s.id] as string[])?.includes(value) : answers[s.id] === value);

  const next = () => {
    if (!answered) return;
    if (step < STEPS.length - 1) {
      const ns = step + 1; setStep(ns); setProgress(ns);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      profileStore.complete({
        goals: (answers.goals as string[]) ?? [],
        ageRange: answers.ageRange,
        gender: answers.gender,
        heightCm: answers.heightCm ? Number(answers.heightCm) : undefined,
        weightKg: answers.weightKg ? Number(answers.weightKg) : undefined,
        bodyType: answers.bodyType,
        trainingPlace: answers.trainingPlace,
        diet: answers.diet,
        timePerDay: answers.timePerDay,
        coachVibe: answers.coachVibe,
        about: (answers.about as string)?.trim() || undefined,
      });
      router.replace('/home');
    }
  };

  const back = () => {
    if (step === 0) return router.back();
    const ns = step - 1; setStep(ns); setProgress(ns);
  };

  return (
    <Screen subduedBackground>
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
          {step + 1}/{STEPS.length}
        </Txt>
      </View>

      <Animated.View key={s.id} entering={FadeIn.duration(280)} exiting={FadeOut.duration(120)} style={styles.body}>
        <Txt variant="title" style={{ marginTop: spacing.lg }}>
          {s.title}
        </Txt>
        <Txt variant="bodyLg" color={palette.textSecondary} style={{ marginTop: spacing.sm }}>
          {s.subtitle}
        </Txt>

        {s.kind === 'choice' && (
          <View style={styles.options}>
            {s.options.map((opt) => {
              const sel = isSelected(opt.value);
              const inner = (
                <View style={[styles.optInner, sel ? styles.optInnerSel : null]}>
                  {opt.icon && <Ionicons name={opt.icon} size={20} color={sel ? palette.violetBright : palette.textSecondary} />}
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyMedium" color={palette.textPrimary}>{opt.label}</Txt>
                    {!!opt.desc && <Txt variant="caption" color={palette.textTertiary}>{opt.desc}</Txt>}
                  </View>
                  {sel ? (
                    <Ionicons name="checkmark-circle" size={22} color={palette.violetBright} />
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </View>
              );
              return (
                <Pressable key={opt.value} onPress={() => toggle(opt.value)}>
                  {sel ? (
                    <LinearGradient colors={gradients.aura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.optRing}>
                      {inner}
                    </LinearGradient>
                  ) : (
                    <View style={styles.optPlainWrap}>{inner}</View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {s.kind === 'measure' && (
          <View style={[styles.options, styles.measureRow]}>
            <View style={{ flex: 1 }}>
              <Field
                label="Height (cm)"
                placeholder="175"
                keyboardType="number-pad"
                value={answers.heightCm ?? ''}
                onChangeText={(t) => setAnswers((p) => ({ ...p, heightCm: t.replace(/[^0-9]/g, '') }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Weight (kg)"
                placeholder="68"
                keyboardType="number-pad"
                value={answers.weightKg ?? ''}
                onChangeText={(t) => setAnswers((p) => ({ ...p, weightKg: t.replace(/[^0-9]/g, '') }))}
              />
            </View>
          </View>
        )}

        {s.kind === 'text' && (
          <View style={styles.options}>
            <Field
              placeholder={s.placeholder}
              multiline
              value={answers.about ?? ''}
              onChangeText={(t) => setAnswers((p) => ({ ...p, about: t }))}
              style={styles.textArea}
            />
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        {s.optional && !answered ? null : null}
        <GradientButton
          label={step < STEPS.length - 1 ? (s.optional ? 'Continue' : 'Continue') : 'Build my plan'}
          disabled={!answered}
          onPress={next}
        />
        {s.optional && (
          <Pressable onPress={next} hitSlop={hitSlop} style={styles.skip}>
            <Txt variant="bodyMedium" color={palette.textTertiary}>
              Skip
            </Txt>
          </Pressable>
        )}
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
  options: { marginTop: spacing.xl, gap: spacing.md },
  measureRow: { flexDirection: 'row', gap: spacing.md },
  optRing: { borderRadius: radius.lg, padding: 1.5 },
  optInner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    borderRadius: radius.lg - 1, backgroundColor: palette.surfaceRaised,
  },
  optInnerSel: {},
  optPlainWrap: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: palette.hairline,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: palette.hairlineStrong },
  textArea: { height: 140, paddingTop: 14, textAlignVertical: 'top' },
  footer: { paddingTop: spacing.lg, gap: spacing.sm },
  skip: { alignSelf: 'center', paddingVertical: spacing.sm },
});
