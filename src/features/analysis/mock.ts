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
      'Definition is softened by facial fat — leaning out and mewing will sharpen the angle noticeably.',
      'Jaw is okay from the front but lacks projection; body-fat loss + posture work are your levers.',
    ],
  },
  {
    key: 'skin',
    label: 'Skin Quality',
    notes: [
      'Visible texture and some marks are dragging this down. A retinoid + SPF routine fixes most of it.',
      'Uneven tone and mild congestion. Targeted actives (azelaic/vitamin C) will even it out.',
    ],
  },
  {
    key: 'symmetry',
    label: 'Symmetry',
    notes: [
      'Minor asymmetry, well within normal — not a priority, focus your effort elsewhere.',
      'Reads fairly balanced; consistent sleep side and posture help maintain it.',
    ],
  },
  {
    key: 'eyes',
    label: 'Eye Area',
    notes: [
      'Under-eye puffiness and darkness are aging the area — sleep, lower sodium and a caffeine eye cream help.',
      'Decent shape, but tired-looking. De-puffing and brow shaping will make them pop.',
    ],
  },
  {
    key: 'hair',
    label: 'Hair & Frame',
    notes: [
      'Current style doesn\'t suit your face shape and is costing you real points — a tailored cut is a fast win.',
      'Hair is healthy but unstyled; the right cut + product noticeably lifts overall harmony.',
    ],
  },
  {
    key: 'cheekbones',
    label: 'Cheekbones',
    notes: [
      'Mid-face is a bit flat/soft — lowering body fat will reveal more cheekbone definition.',
      'Reasonable structure hidden under some facial fat; leaning out is the unlock.',
    ],
  },
];

const PLAN_LIBRARY: GlowUpStep[] = [
  {
    id: 'pigmentation',
    title: 'Fade pigmentation & post-acne marks',
    description: 'Even out skin tone with targeted actives. Apply AM, always finish with SPF 50 (sun undoes all progress).',
    category: 'skincare',
    effort: 'routine',
    potentialGain: 7,
    products: ['azelaic acid 10%', 'vitamin C serum', 'SPF 50'],
  },
  {
    id: 'acne-routine',
    title: 'Clear active acne',
    description: 'A consistent anti-acne routine. If breakouts are cystic or widespread, see a dermatologist for prescription options.',
    category: 'skincare',
    effort: 'routine',
    potentialGain: 8,
    products: ['2% salicylic acid cleanser', 'adapalene 0.1% gel'],
    seeSpecialist: true,
  },
  {
    id: 'texture-retinoid',
    title: 'Smooth skin texture',
    description: 'A nightly retinoid boosts cell turnover for clearer, smoother skin within 8-12 weeks. Start 2x/week.',
    category: 'skincare',
    effort: 'long game',
    potentialGain: 6,
    products: ['retinol 0.3-0.5%', 'ceramide moisturizer'],
  },
  {
    id: 'haircut',
    title: 'Get a cut for your face shape',
    description: 'Bring a reference photo. The right frame is the single biggest instant upgrade to your harmony score.',
    category: 'grooming',
    effort: 'quick win',
    potentialGain: 7,
  },
  {
    id: 'bodyfat',
    title: 'Lower body fat to ~12-15%',
    description: 'Reveals jawline and cheekbone definition more than anything else. Slight calorie deficit + resistance training.',
    category: 'fitness',
    effort: 'long game',
    potentialGain: 9,
  },
  {
    id: 'brows',
    title: 'Shape your eyebrows',
    description: 'Tidy the strays and define the arch to frame your eyes. A barber or brow technician can set the shape first.',
    category: 'grooming',
    effort: 'quick win',
    potentialGain: 5,
  },
  {
    id: 'undereye',
    title: 'Reduce under-eye puffiness',
    description: 'Cut evening sodium, prioritise sleep, and use a caffeine eye cream to de-puff and brighten the eye area.',
    category: 'habits',
    effort: 'quick win',
    potentialGain: 4,
    products: ['caffeine eye cream'],
  },
  {
    id: 'mewing-posture',
    title: 'Mewing + fix forward-head posture',
    description: 'Correct tongue posture and daily chin tucks improve jaw projection and side profile over months.',
    category: 'fitness',
    effort: 'long game',
    potentialGain: 4,
  },
  {
    id: 'sleep',
    title: 'Lock in 7-8h of sleep',
    description: 'Foundational for skin repair, reduced puffiness and a sharper eye area. Non-negotiable.',
    category: 'habits',
    effort: 'routine',
    potentialGain: 5,
  },
];

const HEADLINES = [
  'Decent base, but a few clear weak points are holding your score down — all fixable.',
  'You have potential, but your skin and grooming are leaving easy points on the table.',
  'Average right now — the plan below is where the real gains are.',
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
    // Realistic, varied range — most metrics land below "attractive" so the
    // plan has obvious value (matches the honest live prompt).
    score: rand(42, 74),
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
    faceShape: pick(['oval', 'square', 'round', 'oblong', 'heart']),
    hairstyles: pick([
      ['Textured crop', 'Side part', 'Two-block'],
      ['Pompadour', 'Quiff', 'Crew cut with stubble'],
      ['Forward fringe', 'Mid fade', 'Curtain fringe'],
    ]),
    metrics,
    plan,
    photos,
  };
}
