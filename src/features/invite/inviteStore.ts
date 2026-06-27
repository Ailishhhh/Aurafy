import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Invite store — powers the "invite N friends to unlock" viral loop.
 *
 * Each time the user sends an invite (opens the share sheet from a gate) we
 * increment `invitesSent`. Once it reaches REQUIRED_INVITES (or the user goes
 * Premium) their full analysis unlocks. This is the exact mechanic that turned
 * every Umax user into a recruiter.
 *
 * A short referral code is generated once and embedded in invite links so we
 * can wire real install attribution later (via Supabase deep links).
 */

type State = {
  invitesSent: number;
  referralCode: string;
  hydrated: boolean;
};

const KEY = 'aurafy.invite.v1';

let state: State = { invitesSent: 0, referralCode: '', hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function persist() {
  AsyncStorage.setItem(
    KEY,
    JSON.stringify({ invitesSent: state.invitesSent, referralCode: state.referralCode }),
  ).catch(() => {});
}
function setState(p: Partial<State>, save = true) {
  state = { ...state, ...p };
  emit();
  if (save) persist();
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const inviteStore = {
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
        const saved = JSON.parse(raw) as Partial<State>;
        setState(
          {
            invitesSent: saved.invitesSent ?? 0,
            referralCode: saved.referralCode || genCode(),
            hydrated: true,
          },
          true,
        );
        return;
      }
    } catch {
      /* ignore */
    }
    setState({ referralCode: genCode(), hydrated: true }, true);
  },

  recordInvite() {
    setState({ invitesSent: state.invitesSent + 1 });
  },

  async wipe() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ invitesSent: 0, referralCode: genCode() }, true);
  },
};

export function useInvite() {
  return useSyncExternalStore(inviteStore.subscribe, inviteStore.getSnapshot);
}
