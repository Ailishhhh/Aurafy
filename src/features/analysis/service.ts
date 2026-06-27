import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import type { Analysis, GlowUpStep, Metric, MetricKey } from './types';
import { generateMockAnalysis } from './mock';
import { buildUserPrompt } from './prompt';

/**
 * Analysis service facade.
 *
 * Every screen calls `analyzeFace()` and never cares where data comes from.
 *
 * Behaviour:
 *   - If EXPO_PUBLIC_AI_ENDPOINT is set, POST the base64 photos to our backend
 *     proxy (which holds the model API key and runs SYSTEM_PROMPT), then parse
 *     + validate the JSON into an `Analysis`.
 *   - Otherwise (or on any failure) fall back to the local mock so the app is
 *     always usable in development and never hard-crashes on a bad response.
 *
 * SECURITY: the model API key lives ONLY on the backend. We never ship it in
 * the client bundle.
 */

const ENDPOINT =
  process.env.EXPO_PUBLIC_AI_ENDPOINT ||
  (Constants.expoConfig?.extra as { aiEndpoint?: string } | undefined)?.aiEndpoint;

// The image-transform endpoint lives alongside /analyze on the same server.
const TRANSFORM_ENDPOINT = ENDPOINT ? ENDPOINT.replace(/\/analyze\/?$/, '/transform') : undefined;

/** Whether the live AI transform feature is available (endpoint configured). */
export const transformAvailable = !!TRANSFORM_ENDPOINT;

const VALID_KEYS: MetricKey[] = ['jawline', 'skin', 'symmetry', 'eyes', 'hair', 'cheekbones'];
const VALID_CATEGORIES = new Set<GlowUpStep['category']>(['skincare', 'grooming', 'fitness', 'style', 'habits']);
const VALID_EFFORTS = new Set<GlowUpStep['effort']>(['quick win', 'routine', 'long game']);

export async function analyzeFace(photos: { front: string; side?: string }): Promise<Analysis> {
  if (ENDPOINT) {
    try {
      const remote = await analyzeViaBackend(ENDPOINT, photos);
      if (remote) return remote;
    } catch (err) {
      // Swallow + fall back: a failed network call should never block the user.
      if (__DEV__) console.warn('[Aurafy] remote analysis failed, using mock:', err);
    }
  }

  // Local mock path. Small delay so the analyzing animation has room to breathe.
  await new Promise((r) => setTimeout(r, 2400));
  return generateMockAnalysis(photos);
}

async function analyzeViaBackend(
  endpoint: string,
  photos: { front: string; side?: string },
): Promise<Analysis | null> {
  const front = await toBase64(photos.front);
  const side = photos.side ? await toBase64(photos.side) : undefined;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: buildUserPrompt(!!side),
      images: side ? [front, side] : [front],
    }),
  });

  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  const json = await res.json();
  return normalizeAnalysis(json, photos);
}

async function toBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

/**
 * Defensive parsing: clamp scores, keep only known enum values, and guarantee
 * potential > overall. A model can occasionally return out-of-range or partial
 * data; the UI must always receive a well-formed Analysis.
 */
function normalizeAnalysis(raw: any, photos: { front: string; side?: string }): Analysis {
  const clamp = (n: unknown, lo = 0, hi = 100) =>
    Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

  const metrics: Metric[] = Array.isArray(raw?.metrics)
    ? raw.metrics
        .filter((m: any) => VALID_KEYS.includes(m?.key))
        .map((m: any) => ({
          key: m.key as MetricKey,
          label: String(m.label ?? m.key),
          score: clamp(m.score),
          note: String(m.note ?? ''),
        }))
    : [];

  if (metrics.length === 0) throw new Error('No valid metrics in response');

  const overall = raw?.overall != null
    ? clamp(raw.overall)
    : Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);

  const potential = Math.max(clamp(raw?.potential), Math.min(98, overall + 8));

  const plan: GlowUpStep[] = Array.isArray(raw?.plan)
    ? raw.plan
        .filter((s: any) => VALID_CATEGORIES.has(s?.category) && VALID_EFFORTS.has(s?.effort))
        .map((s: any, i: number) => ({
          id: String(s.id ?? `step_${i}`),
          title: String(s.title ?? ''),
          description: String(s.description ?? ''),
          category: s.category as GlowUpStep['category'],
          effort: s.effort as GlowUpStep['effort'],
          potentialGain: clamp(s.potentialGain, 1, 10),
          products: Array.isArray(s.products)
            ? s.products.map((p: any) => String(p)).filter(Boolean).slice(0, 4)
            : undefined,
          seeSpecialist: typeof s.seeSpecialist === 'boolean' ? s.seeSpecialist : undefined,
        }))
    : [];

  return {
    id: `a_${Date.now()}`,
    createdAt: Date.now(),
    overall,
    potential,
    headline: String(raw?.headline ?? 'You\'ve got a strong foundation to build on.'),
    faceShape: typeof raw?.faceShape === 'string' ? raw.faceShape : undefined,
    hairstyles: Array.isArray(raw?.hairstyles)
      ? raw.hairstyles.map((h: any) => String(h)).filter(Boolean).slice(0, 4)
      : undefined,
    metrics,
    plan,
    photos,
  };
}


/**
 * Generate the "future self" glow-up image from the user's front selfie.
 * Calls the backend /transform endpoint (Gemini image model) and returns a
 * ready-to-render data URI. Throws on failure so the UI can show a retry state.
 */
export async function transformFace(frontUri: string): Promise<string> {
  if (!TRANSFORM_ENDPOINT) throw new Error('Transform endpoint not configured');
  const b64 = await toBase64(frontUri);
  const res = await fetch(TRANSFORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64 }),
  });
  if (!res.ok) throw new Error(`Transform failed (${res.status})`);
  const json = await res.json();
  if (!json?.image) throw new Error('No image returned');
  const mime: string = json.mimeType || 'image/png';
  return `data:${mime};base64,${json.image}`;
}
