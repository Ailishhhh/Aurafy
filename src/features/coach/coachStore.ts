import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateCoachPlan } from './service';
import type { CoachPlan } from './types';

type Status = 'idle' | 'loading' | 'done' | 'error';
type State = { plan: CoachPlan | null; status: Status; hydrated: boolean };

const KEY = 'aurafy.coach.v1';
let state: State = { plan: null, status: 'idle', hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function setState(p: Partial<State>) {
  state = { ...state, ...p };
  emit();
}

export const coachStore = {
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
      setState({ plan: raw ? (JSON.parse(raw) as CoachPlan) : null, status: raw ? 'done' : 'idle', hydrated: true });
    } catch {
      setState({ hydrated: true });
    }
  },

  async generate() {
    setState({ status: 'loading' });
    try {
      const plan = await generateCoachPlan();
      setState({ plan, status: 'done' });
      AsyncStorage.setItem(KEY, JSON.stringify(plan)).catch(() => {});
    } catch {
      setState({ status: 'error' });
    }
  },

  async wipe() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ plan: null, status: 'idle' });
  },
};

export function useCoach() {
  return useSyncExternalStore(coachStore.subscribe, coachStore.getSnapshot);
}
