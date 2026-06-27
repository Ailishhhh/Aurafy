import { useSyncExternalStore } from 'react';
import type { Analysis } from '@/features/analysis/types';

/**
 * Minimal global store for the current analysis + history, built on
 * useSyncExternalStore so we avoid pulling in a state library for Phase 1.
 * History is kept in memory now; we'll persist it (AsyncStorage/Supabase) when
 * we wire the backend.
 */

type State = {
  current: Analysis | null;
  history: Analysis[];
  /** Photos captured on the scan screen, awaiting analysis. */
  pending: { front: string; side?: string } | null;
  /** Completed glow-up step ids -> true. Drives the progress tracker. */
  completedSteps: Record<string, boolean>;
  /** Whether the user has unlocked premium (full plan, unlimited scans). */
  isPremium: boolean;
};

let state: State = {
  current: null,
  history: [],
  pending: null,
  completedSteps: {},
  isPremium: false,
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  emit();
}

export const analysisStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setPending(photos: { front: string; side?: string }) {
    setState({ pending: photos });
  },
  commit(analysis: Analysis) {
    setState({
      current: analysis,
      history: [analysis, ...state.history].slice(0, 30),
      pending: null,
    });
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
