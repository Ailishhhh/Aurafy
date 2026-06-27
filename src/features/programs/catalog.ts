import { type Ionicons } from '@expo/vector-icons';

/**
 * Modular "programs" catalog — the structured, evidence-based self-improvement
 * tracks that turn Aurafy from a one-off face rater into a self-optimization
 * platform.
 *
 * Content principles:
 *   - Grounded in mainstream evidence (dermatology, strength & conditioning,
 *     posture/physio). No fake claims, no fabricated expert endorsements.
 *   - HONEST about limits (e.g. adults cannot increase bone length).
 *   - Every health/medical program carries a disclaimer to consult a pro.
 */

export type ProgramBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'warning'; text: string };

export type ProgramSection = {
  heading: string;
  blocks: ProgramBlock[];
};

export type Program = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent color for the program card + header. */
  accent: string;
  /** Short tagline shown on the dashboard card. */
  tagline: string;
  /** Credibility line (the discipline it's grounded in). */
  basis: string;
  intro: string;
  sections: ProgramSection[];
  disclaimer?: string;
  /** Whether the full program is premium-gated. */
  premium?: boolean;
};

const DISCLAIMER =
  'This is general educational guidance, not medical advice. Consult a qualified professional before starting any new exercise, diet, or treatment — especially if you are under 18 or have a health condition.';

export const PROGRAMS: Program[] = [
  {
    id: 'physique',
    title: 'Physique',
    subtitle: 'Build an aesthetic, lean frame',
    icon: 'barbell',
    accent: '#54E3A6',
    tagline: 'Home & gym plans + nutrition',
    basis: 'Grounded in strength & conditioning science',
    intro:
      'Your physique drives more of your overall attractiveness than your face alone. The goal is an aesthetic V-taper: broad shoulders and back tapering to a lean waist. You can build it at home or in the gym.',
    sections: [
      {
        heading: 'The 3 levers that matter',
        blocks: [
          {
            type: 'list',
            items: [
              'Get lean — reveal definition by lowering body fat to ~12-15%.',
              'Build the V-taper — prioritise shoulders (side delts) and back (lats).',
              'Be consistent — 3-4 quality sessions/week beats 6 random ones.',
            ],
          },
        ],
      },
      {
        heading: 'Home plan (no equipment, 4 days)',
        blocks: [
          {
            type: 'list',
            items: [
              'Push: push-ups, pike push-ups (shoulders), diamond push-ups, dips on a chair.',
              'Pull: doorway/towel rows, backpack rows; a pull-up bar is the best ~₹500 investment you can make.',
              'Legs: squats, split squats, glute bridges, calf raises.',
              'Core: planks, hollow holds, leg raises.',
              'Progress by adding reps/sets weekly and slowing the tempo.',
            ],
          },
        ],
      },
      {
        heading: 'Gym plan (Push / Pull / Legs)',
        blocks: [
          {
            type: 'list',
            items: [
              'Push: overhead press, incline dumbbell press, lateral raises, triceps.',
              'Pull: lat pulldown/pull-ups, rows, rear delts, biceps.',
              'Legs: squats, RDLs, leg press, calves.',
              'Train 4-6 reps for strength, 8-12 for size. Add weight over time (progressive overload).',
            ],
          },
        ],
      },
      {
        heading: 'Nutrition (the part most people skip)',
        blocks: [
          {
            type: 'list',
            items: [
              'Protein: ~1.6-2.2g per kg of bodyweight daily — the #1 priority.',
              'To lean out: eat ~300-500 kcal below maintenance; aim for ~0.5kg/week loss.',
              'To build: eat ~200-300 kcal above maintenance with the protein above.',
              'Base meals on whole foods; hydrate (3-4L/day); sleep 7-9h for recovery.',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            text: 'Estimate maintenance calories at roughly 30-33 kcal per kg of bodyweight, then adjust based on weekly weight trends.',
          },
        ],
      },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'height',
    title: 'Height & Posture',
    subtitle: 'Reach your potential & stand taller',
    icon: 'resize',
    accent: '#7C5CFF',
    tagline: 'Posture, decompression & presence',
    basis: 'Grounded in physiotherapy & growth science',
    intro:
      'Let\'s be honest up front: once your growth plates close (typically late teens to early 20s), you cannot increase your bone length without surgery — ignore any product claiming otherwise. But there is still real, legitimate height to gain.',
    sections: [
      {
        heading: 'If you are still growing (teens)',
        blocks: [
          {
            type: 'paragraph',
            text: 'You can help your body reach its full genetic potential — you can\'t exceed it, but you can avoid falling short of it.',
          },
          {
            type: 'list',
            items: [
              'Sleep 8-9 hours — most growth hormone is released during deep sleep.',
              'Eat enough protein, calcium, vitamin D and zinc; don\'t under-eat.',
              'Stay active (sports, sprinting, jumping) to support healthy development.',
              'Avoid smoking, vaping and excessive caffeine during growth years.',
            ],
          },
        ],
      },
      {
        heading: 'Reclaim height lost to bad posture (everyone)',
        blocks: [
          {
            type: 'paragraph',
            text: 'Poor posture and a compressed spine can hide 1-3 cm of your real height. Decompression and strengthening can recover much of it — and instantly improve how tall and confident you look.',
          },
          {
            type: 'list',
            items: [
              'Dead hangs from a bar: 30-60s daily to decompress the spine.',
              'Cat-camel, cobra and child\'s pose stretches for spinal mobility.',
              'Hip-flexor and chest stretches to undo a hunched "desk" posture.',
              'Strengthen the upper back and core (rows, face pulls, planks) to hold an upright posture.',
              'Chin tucks to fix forward-head posture.',
            ],
          },
        ],
      },
      {
        heading: 'Look taller today',
        blocks: [
          {
            type: 'list',
            items: [
              'Stand tall: shoulders back, crown of the head reaching up.',
              'Hair with volume on top adds visible height.',
              'Vertical lines & monochrome outfits; keep tops and bottoms similar tones.',
              'Well-fitted clothes and a slightly higher waistline lengthen the legs.',
            ],
          },
        ],
      },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'skincare',
    title: 'Skin',
    subtitle: 'Clear, even, healthy skin',
    icon: 'water',
    accent: '#54C9E3',
    tagline: 'A routine that actually works',
    basis: 'Grounded in evidence-based dermatology',
    intro:
      'Skin is the single fastest-moving lever on your appearance — most people can visibly improve it in 8-12 weeks with a simple, consistent routine. Keep it minimal and stick to it.',
    sections: [
      {
        heading: 'The core routine',
        blocks: [
          {
            type: 'list',
            items: [
              'AM: gentle cleanser → moisturizer → broad-spectrum SPF 50 (non-negotiable).',
              'PM: cleanser → treatment (see below) → moisturizer.',
              'Keep it simple — 3-4 products done daily beats 10 done sometimes.',
            ],
          },
        ],
      },
      {
        heading: 'Match the treatment to your concern',
        blocks: [
          {
            type: 'list',
            items: [
              'Acne: salicylic acid cleanser + adapalene 0.1% gel at night.',
              'Post-acne marks / pigmentation: azelaic acid 10% or vitamin C; exfoliate with a glycolic/lactic acid 1-2x/week.',
              'Texture / dullness / early aging: a retinoid at night, started slowly (2x/week).',
              'Dryness / barrier: a ceramide moisturizer + hydrating (hyaluronic acid) serum.',
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            text: 'Cystic/severe acne, deep scarring, or melasma need a dermatologist — prescription treatment works far better and prevents permanent scarring.',
          },
        ],
      },
      {
        heading: 'Habits that show on your face',
        blocks: [
          {
            type: 'list',
            items: [
              'Sleep 7-9h, hydrate, and cut excess sugar/dairy if you break out.',
              'Never skip SPF — sun exposure undoes pigmentation and anti-aging progress.',
              'Don\'t pick at spots; it causes the marks you\'re trying to remove.',
            ],
          },
        ],
      },
    ],
    disclaimer: DISCLAIMER,
  },
];

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
