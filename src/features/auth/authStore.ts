import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session as SupaSession, User } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from '@/lib/supabase';

/**
 * Auth store backed by Supabase.
 *
 * - Real accounts: Supabase email/password auth (sessions persisted + auto
 *   refreshed by the Supabase client via AsyncStorage).
 * - Guest: a local-only session (not synced) for users who skip sign-up.
 * - Fallback: if Supabase keys are missing, everything degrades to a local
 *   session so the app still runs.
 *
 * The `session` shape is stable, so screens never care which path produced it.
 */

export type Session = {
  id: string;
  email: string;
  name: string;
  guest: boolean;
  createdAt: number;
};

type State = {
  session: Session | null;
  hydrated: boolean;
};

const GUEST_KEY = 'aurafy.guest.v1';
const LOCAL_KEY = 'aurafy.localauth.v1'; // only used when Supabase is unavailable

let state: State = { session: null, hydrated: false };
let guest: Session | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function setState(p: Partial<State>) {
  state = { ...state, ...p };
  emit();
}

function deriveName(email: string) {
  const handle = (email || '').split('@')[0] || 'there';
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

function mapUser(user: User): Session {
  const name = (user.user_metadata?.name as string) || deriveName(user.email || '');
  return { id: user.id, email: user.email || '', name, guest: false, createdAt: Date.now() };
}

/** Supabase session wins; otherwise fall back to a local guest if present. */
function computeSession(supa: SupaSession | null): Session | null {
  if (supa?.user) return mapUser(supa.user);
  return guest;
}

async function loadGuest() {
  try {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    guest = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    guest = null;
  }
}

export const authStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return state;
  },

  async hydrate() {
    await loadGuest();

    if (supabaseEnabled && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        setState({ session: computeSession(data.session), hydrated: true });
      } catch {
        setState({ session: guest, hydrated: true });
      }
      // Keep state in sync with sign-in / sign-out / token refresh.
      supabase.auth.onAuthStateChange((_event, supaSession) => {
        setState({ session: computeSession(supaSession) });
      });
      return;
    }

    // Local fallback (no Supabase configured).
    try {
      const raw = await AsyncStorage.getItem(LOCAL_KEY);
      setState({ session: raw ? (JSON.parse(raw) as Session) : guest, hydrated: true });
    } catch {
      setState({ session: guest, hydrated: true });
    }
  },

  async signUp(email: string, password: string, name?: string): Promise<void> {
    const e = email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { data: { name: name?.trim() || deriveName(e) } },
      });
      if (error) throw new Error(error.message);
      // If email confirmation is on, no session is returned yet.
      if (!data.session) {
        throw new Error('Account created! Check your email to confirm, then sign in.');
      }
      setState({ session: computeSession(data.session) });
      return;
    }
    // Local fallback
    const session: Session = {
      id: `u_${Date.now()}`,
      email: e,
      name: name?.trim() || deriveName(e),
      guest: false,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(session));
    setState({ session });
  },

  async signIn(email: string, password: string): Promise<void> {
    const e = email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) throw new Error(error.message);
      setState({ session: computeSession(data.session) });
      return;
    }
    // Local fallback
    const session: Session = {
      id: `u_${Date.now()}`,
      email: e,
      name: deriveName(e),
      guest: false,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(session));
    setState({ session });
  },

  async continueAsGuest(): Promise<void> {
    guest = {
      id: `guest_${Date.now()}`,
      email: '',
      name: 'Guest',
      guest: true,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(guest)).catch(() => {});
    setState({ session: guest });
  },

  async signOut(): Promise<void> {
    guest = null;
    await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
    await AsyncStorage.removeItem(LOCAL_KEY).catch(() => {});
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setState({ session: null });
  },
};

export function useAuth() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
