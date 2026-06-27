import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase client (lazy singleton).
 *
 * The URL + anon (publishable) key are PUBLIC by design — security is enforced
 * by Row Level Security policies on the database, not by hiding the key. They
 * live in app.json `extra` so a fresh clone works without env setup.
 *
 * Sessions are persisted to AsyncStorage and auto-refreshed. If the keys are
 * absent, `supabase` is null and the app falls back to local-only auth.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const url = extra.supabaseUrl;
const anonKey = extra.supabaseAnonKey;

export const supabaseEnabled = !!(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
