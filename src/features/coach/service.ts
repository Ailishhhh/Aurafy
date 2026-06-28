import Constants from 'expo-constants';
import { profileStore, type Profile } from '@/features/profile/profileStore';
import type { CoachPlan } from './types';

/**
 * Generates the personalized physique + nutrition plan from the user's profile
 * via the backend /coach endpoint (same server as /analyze). Falls back to a
 * sensible mock if the endpoint isn't configured or fails.
 */

const ENDPOINT =
  process.env.EXPO_PUBLIC_AI_ENDPOINT ||
  (Constants.expoConfig?.extra as { aiEndpoint?: string } | undefined)?.aiEndpoint;
const COACH_ENDPOINT = ENDPOINT ? ENDPOINT.replace(/\/analyze\/?$/, '/coach') : undefined;

function buildCoachPrompt(p: Profile): string {
  const bits: string[] = [];
  if (p.ageRange) bits.push(`age range ${p.ageRange}`);
  if (p.gender) bits.push(`gender ${p.gender}`);
  if (p.heightCm) bits.push(`height ${p.heightCm}cm`);
  if (p.weightKg) bits.push(`weight ${p.weightKg}kg`);
  if (p.bodyType) bits.push(`current build ${p.bodyType}`);
  bits.push(`trains at ${p.trainingPlace ?? 'home'}`);
  bits.push(`diet ${p.diet ?? 'nonveg'}`);
  if (p.timePerDay) bits.push(`can train ${p.timePerDay}/day`);
  if (p.goals?.length) bits.push(`goals: ${p.goals.join(', ')}`);
  if (p.coachVibe) bits.push(`coach tone: ${p.coachVibe}`);
  const about = p.about ? ` In my own words: "${p.about}".` : '';
  return `Build my fully personalized physique + nutrition plan. My profile: ${bits.join('; ')}.${about} Tailor the workout to where I train, the meals to my diet, and the calories/protein to my stats and goals.`;
}

export async function generateCoachPlan(): Promise<CoachPlan> {
  const { profile } = profileStore.getSnapshot();

  if (COACH_ENDPOINT) {
    try {
      const res = await fetch(COACH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildCoachPrompt(profile) }),
      });
      if (res.ok) {
        const raw = await res.json();
        const plan = normalize(raw);
        if (plan) return plan;
      }
    } catch {
      /* fall through to mock */
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  return mockPlan(profile);
}

function normalize(raw: any): CoachPlan | null {
  if (!raw?.workout?.days || !raw?.nutrition) return null;
  return {
    summary: String(raw.summary ?? ''),
    calorieTarget: String(raw.calorieTarget ?? ''),
    proteinTarget: String(raw.proteinTarget ?? ''),
    workout: {
      split: String(raw.workout.split ?? ''),
      days: (Array.isArray(raw.workout.days) ? raw.workout.days : []).map((d: any) => ({
        day: String(d.day ?? ''),
        focus: String(d.focus ?? ''),
        exercises: Array.isArray(d.exercises) ? d.exercises.map((e: any) => String(e)) : [],
      })),
    },
    nutrition: {
      approach: String(raw.nutrition.approach ?? ''),
      meals: (Array.isArray(raw.nutrition.meals) ? raw.nutrition.meals : []).map((m: any) => ({
        name: String(m.name ?? ''),
        idea: String(m.idea ?? ''),
      })),
      tips: Array.isArray(raw.nutrition.tips) ? raw.nutrition.tips.map((t: any) => String(t)) : [],
    },
    habits: Array.isArray(raw.habits) ? raw.habits.map((h: any) => String(h)) : [],
    notes: String(raw.notes ?? ''),
    createdAt: Date.now(),
  };
}

function mockPlan(p: Profile): CoachPlan {
  const home = p.trainingPlace === 'home';
  return {
    summary: 'A starter plan tailored to your profile. Connect the AI backend for a fully personalized version.',
    calorieTarget: p.weightKg ? `~${Math.round(p.weightKg * 31)} kcal/day` : '~30 kcal per kg bodyweight',
    proteinTarget: p.weightKg ? `~${Math.round(p.weightKg * 1.8)} g protein/day` : '1.6–2.2 g per kg bodyweight',
    workout: {
      split: home ? '4-day home split' : '4-day Upper/Lower',
      days: [
        { day: 'Day 1', focus: 'Push', exercises: home ? ['Push-ups', 'Pike push-ups', 'Dips', 'Plank'] : ['Bench press', 'Overhead press', 'Lateral raises', 'Triceps'] },
        { day: 'Day 2', focus: 'Pull', exercises: home ? ['Doorway rows', 'Towel rows', 'Superman holds'] : ['Pull-ups', 'Rows', 'Face pulls', 'Biceps'] },
        { day: 'Day 3', focus: 'Legs', exercises: ['Squats', 'Lunges', 'Calf raises', 'Glute bridges'] },
        { day: 'Day 4', focus: 'Core + conditioning', exercises: ['Hollow holds', 'Leg raises', 'Brisk walk 20 min'] },
      ],
    },
    nutrition: {
      approach: `${p.diet ?? 'balanced'} diet, whole foods, protein every meal.`,
      meals: [
        { name: 'Breakfast', idea: p.diet === 'veg' || p.diet === 'vegan' ? 'Oats + soy/whey, banana, peanut butter' : 'Eggs/omelette + oats + fruit' },
        { name: 'Lunch', idea: 'Protein + rice/roti + veggies + dal' },
        { name: 'Dinner', idea: 'Lean protein + salad + complex carbs' },
      ],
      tips: ['Hit your protein target daily', 'Hydrate 3-4L/day', 'Sleep 7-9h for recovery'],
    },
    habits: ['Train 4x/week', 'Walk 8k steps/day', 'Consistent sleep schedule'],
    notes: 'General guidance, not medical advice. Consult a professional if you have health conditions.',
    createdAt: Date.now(),
  };
}
