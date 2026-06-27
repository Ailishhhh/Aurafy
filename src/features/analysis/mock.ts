import type { Analysis, GlowUpStep, Metric, MetricKey } from './types';

/**
 * Mock analysis generator.
 *
 * Produces realistic, *constructive* analysis data so the full flow is testable
 * before the real vision API is wired in. The numbers are gently randomized but
 * biased toward an encouraging range (no demoralizing low-balls) — this matches
 * our product principle: sell a transformation, not a verdict.
 */

const METRIC_DEFS: { key: MetricKey; label: string; notes: string[] }[] = [
  {
    key: 'jawline',
    label: 'Jawline',
    notes: [
      'Solid bone structure — reducing body fat and posture work will sharpen definition.',
      'Good base. Mewing and lowering face fat can reveal a cleaner jaw angle.',
    ],
  },
  {
    key: 'skin',
    label: 'Skin Quality',
    notes: [
      'Clear tone overall. A simple AM/PM routine will boost glow and evenness.',
      'Hydration and SPF are your fastest wins here for visible improvement.',
    ],
  },
  {
    key: 'symmetry',
    label: 'Symmetry',
    notes: [
      'Naturally balanced features — most faces have minor asymmetry, yours reads well.',
      'Strong harmony. Consistent sleep side and posture help maintain it.',
    ],
  },
  {
    key: 'eyes',
    label: 'Eye Area',
    notes: [
      'Expressive eyes. Reducing under-eye puffiness will make them pop more.',
      'Good canthal tilt potential — sleep and hydration sharpen this area.',
    ],
  },
  {
    key: 'hair',
    label: 'Hair & Frame',
    notes: [
      'A cut tailored to your face shape could noticeably lift your overall harmony.',
      'Healthy density. The right style adds significant framing impact.',
    ],
  },
  {
    key: 'cheekbones',
    label: 'Cheekbones',
    notes: [
      'Defined mid-face. Lower body fat will accentuate these further.',
      'Good projection — lighting and angles already favor you here.',
    ],
  },
];

const PLAN_LIBRARY: GlowUpStep[] = [
  {
    id: 'skincare-routine',
    title: 'Build a 3-step skincare routine',
    description: 'Cleanser, moisturizer, and SPF every morning. Add a retinol 2x/week at night.',
    category: 'skincare',
    effort: 'routine',
    potentialGain: 6,
  },
  {
    id: 'hydration',
    title: 'Hydrate + cut sodium before bed',
    description: 'Reduces facial puffiness and under-eye bags within days.',
    category: 'habits',
    effort: 'quick win',
    potentialGain: 3,
  },
  {
    id: 'haircut',
    title: 'Get a cut for your face shape',
    description: 'Bring a reference photo. The right frame is the single biggest instant upgrade.',
    category: 'grooming',
    effort: 'quick win',
    potentialGain: 7,
  },
  {
    id: 'bodyfat',
    title: 'Lower body fat to ~12-15%',
    description: 'Reveals jawline and cheekbone definition more than anything else.',
    category: 'fitness',
    effort: 'long game',
    potentialGain: 9,
  },
  {
    id: 'brows',
    title: 'Tidy your eyebrows',
    description: 'A clean brow line frames the eyes and balances the upper face.',
    category: 'grooming',
    effort: 'quick win',
    potentialGain: 4,
  },
  {
    id: 'sleep',
    title: 'Lock in 7-8h of sleep',
    description: 'Better skin, sharper eye area, and reduced puffiness. Foundational.',
    category: 'habits',
    effort: 'routine',
    potentialGain: 5,
  },
  {
    id: 'posture',
    title: 'Fix forward-head posture',
    description: 'Chin tucks daily. Improves jaw projection and overall presence.',
    category: 'fitness',
    effort: 'routine',
    potentialGain: 4,
  },
  {
    id: 'style',
    title: 'Upgrade your fit + colors',
    description: 'Wear colors that match your undertone and clothes that fit your frame.',
    category: 'style',
    effort: 'routine',
    potentialGain: 5,
  },
];

const HEADLINES = [
  'You\'ve got a strong foundation to build on.',
  'High potential — a few moves unlock the next level.',
  'Great raw material. Time to sharpen it.',
];

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockAnalysis(photos: { front: string; side?: string }): Analysis {
  const metrics: Metric[] = METRIC_DEFS.map((d) => ({
    key: d.key,
    label: d.label,
    score: rand(62, 86),
    note: pick(d.notes),
  }));

  const overall = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);
  // Potential is the realistic ceiling: a meaningful but believable uplift.
  const potential = Math.min(98, overall + rand(8, 16));

  // Sort plan so the highest-impact steps surface first.
  const plan = [...PLAN_LIBRARY].sort((a, b) => b.potentialGain - a.potentialGain).slice(0, 6);

  return {
    id: `a_${Date.now()}`,
    createdAt: Date.now(),
    overall,
    potential,
    headline: pick(HEADLINES),
    metrics,
    plan,
    photos,
  };
}
