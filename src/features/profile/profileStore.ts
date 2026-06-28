import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Profile + streak store.
 *
 * Holds the onboarding questionnaire answers (used to personalize the AI and the
 * dashboard) and the daily streak (the core retention loop). Persisted to
 * AsyncStorage. Streak advances once per local calendar day on app open.
 */

export type AgeRange = 'under16' | '16-19' | '20-24' | '25-29' | '30plus';
export type Gender = 'male' | 'female' | 'other';
export type BodyType = 'lean' | 'average' | 'heavier' | 'muscular';
export type TrainingPlace = 'gym' | 'home' | 'none';
export type Diet = 'veg' | 'nonveg' | 'eggetarian' | 'vegan';
export type CoachVibe = 'gentle' | 'honest' | 'brutal';

export type Profile = {
  completed: boolean;
  goals: string[];
  ageRange?: AgeRange;
  gender?: Gender;
  timePerDay?: string;
  // Deep-onboarding fields (used to personalize the AI + physique plan).
  heightCm?: number;
  weightKg?: number;
  bodyType?: BodyType;
  trainingPlace?: TrainingPlace;
  diet?: Diet;
  coachVibe?: CoachVibe;
  /** Free-text "describe yourself" — fed straight into the AI. */
  about?: string;
};

export type Streak = {
  current: number;
  longest: number;
  /** Local YYYY-MM-DD of the last active day, or null. */
  lastActive: string | null;
  total: number;
};

type State = {
  profile: Profile;
  streak: Streak;
  hydrated: boolean;
};

const KEY = 'aurafy.profile.v1';

const EMPTY_PROFILE: Profile = { completed: false, goals: [] };
const EMPTY_STREAK: Streak = { current: 0, longest: 0, lastActive: null, total: 0 };

let state: State = { profile: EMPTY_PROFILE, streak: EMPTY_STREAK, hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function persist() {
  AsyncStorage.setItem(
    KEY,
    JSON.stringify({ profile: state.profile, streak: state.streak }),
  ).catch(() => {});
}
function setState(p: Partial<State>, save = true) {
  state = { ...state, ...p };
  emit();
  if (save) persist();
}

/** Local calendar date as YYYY-MM-DD (timezone-correct, unlike toISOString). */
function localDay(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  const diff = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.round(diff / 86400000);
}

export const profileStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return state;
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { profile?: Profile; streak?: Streak };
        setState(
          {
            profile: { ...EMPTY_PROFILE, ...saved.profile },
            streak: { ...EMPTY_STREAK, ...saved.streak },
            hydrated: true,
          },
          false,
        );
        return;
      }
    } catch {
      /* ignore */
    }
    setState({ hydrated: true }, false);
  },

  setAnswers(partial: Partial<Profile>) {
    setState({ profile: { ...state.profile, ...partial } });
  },

  complete(answers: Partial<Profile>) {
    setState({ profile: { ...state.profile, ...answers, completed: true } });
  },

  /** Merge server state into the local store (used by cloud sync on login). */
  applyRemote(profile: Partial<Profile>, streak: Partial<Streak>) {
    setState({
      profile: { ...state.profile, ...profile },
      streak: { ...state.streak, ...streak },
    });
  },

  /**
   * Register today's activity and update the streak.
   *  - same day already counted -> no change
   *  - consecutive day          -> current + 1
   *  - gap                      -> reset to 1
   */
  recordActivity() {
    const today = localDay();
    const { lastActive, current, longest, total } = state.streak;
    if (lastActive === today) return;

    let nextCurrent = 1;
    if (lastActive && daysBetween(lastActive, today) === 1) nextCurrent = current + 1;

    setState({
      streak: {
        current: nextCurrent,
        longest: Math.max(longest, nextCurrent),
        lastActive: today,
        total: total + 1,
      },
    });
  },

  async wipe() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ profile: EMPTY_PROFILE, streak: EMPTY_STREAK }, false);
  },
};

export function useProfile() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);
}
