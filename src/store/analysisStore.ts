import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Analysis } from '@/features/analysis/types';

/**
 * Global store for analyses + user progress, built on useSyncExternalStore.
 *
 * A subset of state (history, current, completed steps, premium flag) is
 * persisted to AsyncStorage so the user's scan history and progress survive app
 * restarts. `pending` (in-flight scan photos) is intentionally NOT persisted.
 */

type State = {
  current: Analysis | null;
  history: Analysis[];
  pending: { front: string; side?: string } | null;
  completedSteps: Record<string, boolean>;
  isPremium: boolean;
  /** True once we've loaded persisted state (so UI can avoid a flash). */
  hydrated: boolean;
};

type PersistedState = Pick<State, 'current' | 'history' | 'completedSteps' | 'isPremium'>;

const PERSIST_KEY = 'aurafy.state.v1';

let state: State = {
  current: null,
  history: [],
  pending: null,
  completedSteps: {},
  isPremium: false,
  hydrated: false,
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  const toSave: PersistedState = {
    current: state.current,
    history: state.history,
    completedSteps: state.completedSteps,
    isPremium: state.isPremium,
  };
  // Fire-and-forget; persistence failures must never break the UI.
  AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(toSave)).catch(() => {});
}

function setState(partial: Partial<State>, save = true) {
  state = { ...state, ...partial };
  emit();
  if (save) persist();
}

export const analysisStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  /** Load persisted state on app start. Call once from the root layout. */
  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(PERSIST_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedState;
        setState(
          {
            current: saved.current ?? null,
            history: Array.isArray(saved.history) ? saved.history : [],
            completedSteps: saved.completedSteps ?? {},
            isPremium: !!saved.isPremium,
            hydrated: true,
          },
          false,
        );
        return;
      }
    } catch {
      // ignore corrupt/missing storage
    }
    setState({ hydrated: true }, false);
  },

  setPending(photos: { front: string; side?: string }) {
    setState({ pending: photos }, false);
  },
  commit(analysis: Analysis) {
    setState({
      current: analysis,
      history: [analysis, ...state.history].slice(0, 30),
      pending: null,
    });
  },
  /** Make an existing analysis the current one (e.g. opening it from history). */
  setCurrent(analysis: Analysis) {
    setState({ current: analysis }, false);
  },
  toggleStep(id: string) {
    setState({
      completedSteps: { ...state.completedSteps, [id]: !state.completedSteps[id] },
    });
  },
  setPremium(value: boolean) {
    setState({ isPremium: value });
  },
  reset() {
    setState({ current: null, pending: null });
  },
};

export function useAnalysis() {
  return useSyncExternalStore(analysisStore.subscribe, analysisStore.getSnapshot);
}
