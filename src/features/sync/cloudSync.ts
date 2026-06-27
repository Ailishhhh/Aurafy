import { supabase } from '@/lib/supabase';
import { authStore } from '@/features/auth/authStore';
import { profileStore } from '@/features/profile/profileStore';
import { analysisStore } from '@/store/analysisStore';
import type { Analysis } from '@/features/analysis/types';

/**
 * Cloud sync orchestrator.
 *
 * One-directional dependency: this module observes the stores and mirrors them
 * to Supabase (profiles + scans), and pulls the server copy on login. Stores
 * never import this, so there are no cycles.
 *
 * Strategy:
 *   - On a real (non-guest) login -> pullAll() loads profile + scans into stores.
 *   - Profile changes  -> debounced upsert into `profiles`.
 *   - New scans        -> insert into `scans` (tracked by id to avoid dupes).
 *   - Premium changes  -> profile upsert.
 * A `pulling` guard prevents the pull from echoing straight back as writes.
 */

let initialized = false;
let pulling = false;
let userId: string | null = null;
let lastPremium = false;
const pushedScanIds = new Set<string>();
let profileTimer: ReturnType<typeof setTimeout> | null = null;

function currentUserId(): string | null {
  const { session } = authStore.getSnapshot();
  return session && !session.guest ? session.id : null;
}

function scanToRow(uid: string, a: Analysis) {
  return {
    id: a.id,
    user_id: uid,
    overall: a.overall,
    potential: a.potential,
    face_shape: a.faceShape ?? null,
    headline: a.headline,
    data: a,
  };
}

async function pullAll(uid: string) {
  if (!supabase) return;
  pulling = true;
  try {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (prof) {
      profileStore.applyRemote(
        {
          goals: prof.goals ?? [],
          ageRange: prof.age_range ?? undefined,
          gender: prof.gender ?? undefined,
          timePerDay: prof.time_per_day ?? undefined,
          completed: !!prof.onboarding_completed,
        },
        {
          current: prof.streak_current ?? 0,
          longest: prof.streak_longest ?? 0,
          lastActive: prof.streak_last_active ?? null,
        },
      );
      if (typeof prof.is_premium === 'boolean') {
        lastPremium = prof.is_premium;
        analysisStore.setPremium(prof.is_premium);
      }
    }

    const { data: scans } = await supabase
      .from('scans')
      .select('data')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(30);
    if (Array.isArray(scans) && scans.length) {
      const history = scans.map((r) => r.data as Analysis).filter(Boolean);
      history.forEach((a) => pushedScanIds.add(a.id));
      analysisStore.applyRemoteHistory(history);
    }
  } catch {
    /* offline / not yet provisioned — app keeps working locally */
  } finally {
    pulling = false;
  }
}

async function pushProfile(uid: string) {
  if (!supabase) return;
  const { profile, streak } = profileStore.getSnapshot();
  const { isPremium } = analysisStore.getSnapshot();
  try {
    await supabase.from('profiles').upsert(
      {
        id: uid,
        goals: profile.goals,
        age_range: profile.ageRange ?? null,
        gender: profile.gender ?? null,
        time_per_day: profile.timePerDay ?? null,
        onboarding_completed: profile.completed,
        streak_current: streak.current,
        streak_longest: streak.longest,
        streak_last_active: streak.lastActive,
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  } catch {
    /* ignore — will re-sync on next change */
  }
}

async function pushScan(uid: string, a: Analysis) {
  if (!supabase) return;
  try {
    await supabase.from('scans').upsert(scanToRow(uid, a), { onConflict: 'id' });
  } catch {
    /* ignore */
  }
}

function schedulePushProfile() {
  if (!userId) return;
  if (profileTimer) clearTimeout(profileTimer);
  profileTimer = setTimeout(() => userId && pushProfile(userId), 800);
}

function onAuthChange() {
  const uid = currentUserId();
  if (uid && uid !== userId) {
    userId = uid;
    pushedScanIds.clear();
    pullAll(uid);
  } else if (!uid) {
    userId = null;
    pushedScanIds.clear();
  }
}

function onProfileChange() {
  if (pulling || !userId) return;
  schedulePushProfile();
}

function onAnalysisChange() {
  if (pulling || !userId) return;
  const { history, isPremium } = analysisStore.getSnapshot();

  if (isPremium !== lastPremium) {
    lastPremium = isPremium;
    schedulePushProfile();
  }

  const latest = history[0];
  if (latest && !pushedScanIds.has(latest.id)) {
    pushedScanIds.add(latest.id);
    pushScan(userId, latest);
  }
}

/** Call once after stores hydrate (from the root layout). */
export function initCloudSync() {
  if (initialized || !supabase) return;
  initialized = true;
  authStore.subscribe(onAuthChange);
  profileStore.subscribe(onProfileChange);
  analysisStore.subscribe(onAnalysisChange);
  onAuthChange(); // handle an already-restored session
}
