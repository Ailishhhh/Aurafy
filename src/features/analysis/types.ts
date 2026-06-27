/**
 * Domain model for a face analysis. This shape is the contract between the AI
 * service, the results screen, the glow-up plan, and the shareable card — so it
 * lives in one place and everything imports from here.
 */

/** A single scored facial attribute. Scores are 0-100 internally. */
export type Metric = {
  key: MetricKey;
  label: string;
  /** 0-100. */
  score: number;
  /** One short, constructive insight for this attribute. */
  note: string;
};

export type MetricKey =
  | 'jawline'
  | 'skin'
  | 'symmetry'
  | 'eyes'
  | 'hair'
  | 'cheekbones';

/** A single actionable step in the glow-up plan. */
export type GlowUpStep = {
  id: string;
  title: string;
  description: string;
  /** Loose category used for grouping + iconography. */
  category: 'skincare' | 'grooming' | 'fitness' | 'style' | 'habits';
  /** Rough effort to set expectations. */
  effort: 'quick win' | 'routine' | 'long game';
  /** Estimated point uplift this step can contribute (for motivation). */
  potentialGain: number;
  /** Specific ingredient/product TYPES to use (never brand names). */
  products?: string[];
  /** True when a licensed professional (dermatologist, etc.) is warranted. */
  seeSpecialist?: boolean;
};

export type Analysis = {
  id: string;
  createdAt: number;
  /** Current overall score, 0-100. */
  overall: number;
  /** Realistic achievable score with the plan, 0-100. Always >= overall. */
  potential: number;
  /** A short, confidence-building headline (never insulting). */
  headline: string;
  /** Detected face shape (oval, round, square, oblong, heart, diamond, triangle). */
  faceShape?: string;
  /** Specific haircut names that flatter the detected face shape. */
  hairstyles?: string[];
  metrics: Metric[];
  plan: GlowUpStep[];
  /** Local URIs of the photos used (front, optional side). */
  photos: { front: string; side?: string };
};
