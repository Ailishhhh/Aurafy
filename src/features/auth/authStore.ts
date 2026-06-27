import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth store.
 *
 * Phase 1 is a LOCAL session store (persisted to AsyncStorage) so the full
 * auth UX works end-to-end without a backend. It is intentionally structured as
 * an abstraction: when we add Supabase, we swap the bodies of signUp/signIn/
 * signOut to call Supabase and keep the same `session` shape + hooks — no screen
 * changes required.
 *
 * NOTE: this local mode does NOT verify passwords against a server; it is a
 * stand-in for the real cloud auth that Supabase will provide.
 */

export type Session = {
  id: string;
  email: string;
  name: string;
  /** True for "continue as guest" (no email). */
  guest: boolean;
  createdAt: number;
};

type State = {
  session: Session | null;
  hydrated: boolean;
};

const KEY = 'aurafy.auth.v1';
const ACCOUNTS_KEY = 'aurafy.accounts.v1'; // local-only credential store (placeholder)

let state: State = { session: null, hydrated: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function setState(p: Partial<State>) {
  state = { ...state, ...p };
  emit();
}

async function saveSession(session: Session | null) {
  try {
    if (session) await AsyncStorage.setItem(KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function deriveName(email: string) {
  const handle = email.split('@')[0] || 'there';
  return handle.charAt(0).toUpperCase() + handle.slice(1);
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
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setState({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
    } catch {
      setState({ hydrated: true });
    }
  },

  async signUp(email: string, password: string, name?: string): Promise<Session> {
    // TODO(supabase): supabase.auth.signUp({ email, password })
    const session: Session = {
      id: `u_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: (name && name.trim()) || deriveName(email),
      guest: false,
      createdAt: Date.now(),
    };
    // Local-only credential store (placeholder so sign-in "remembers" the user).
    try {
      const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const accounts = raw ? JSON.parse(raw) : {};
      accounts[session.email] = { password, name: session.name, id: session.id };
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      /* ignore */
    }
    await saveSession(session);
    setState({ session });
    return session;
  },

  async signIn(email: string, password: string): Promise<Session> {
    // TODO(supabase): supabase.auth.signInWithPassword({ email, password })
    const e = email.trim().toLowerCase();
    let name = deriveName(e);
    let id = `u_${Date.now()}`;
    try {
      const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const accounts = raw ? JSON.parse(raw) : {};
      const acc = accounts[e];
      if (acc) {
        if (acc.password !== password) throw new Error('Incorrect password');
        name = acc.name;
        id = acc.id;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Incorrect password') throw err;
    }
    const session: Session = { id, email: e, name, guest: false, createdAt: Date.now() };
    await saveSession(session);
    setState({ session });
    return session;
  },

  async continueAsGuest(): Promise<Session> {
    const session: Session = {
      id: `guest_${Date.now()}`,
      email: '',
      name: 'Guest',
      guest: true,
      createdAt: Date.now(),
    };
    await saveSession(session);
    setState({ session });
    return session;
  },

  async signOut() {
    // TODO(supabase): supabase.auth.signOut()
    await saveSession(null);
    setState({ session: null });
  },
};

export function useAuth() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
