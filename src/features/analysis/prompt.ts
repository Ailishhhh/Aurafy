/**
 * The analysis prompt + response contract.
 *
 * IMPORTANT: this prompt is intended to run on the SERVER (our backend proxy),
 * never on-device, because the model API key must stay secret. We keep it in
 * the app repo as the single source of truth so the schema the client parses
 * and the schema the backend produces can never drift.
 *
 * Product principle baked into the prompt: Aurafy is a *constructive glow-up
 * coach*, not a harsh "rate my face" tool. Scores are encouraging, language is
 * supportive, and every weak area is paired with an actionable, healthy step.
 * This is both an ethics choice and a retention/App-Store-safety choice.
 */

export const SYSTEM_PROMPT = `You are Aurafy, a supportive AI grooming and style coach.
A user has shared selfies to receive a constructive "glow-up" analysis.

Your tone is encouraging, never cruel. You NEVER insult, shame, or imply someone
is unattractive. You frame everything as potential and improvement. You only
suggest safe, healthy, mainstream self-improvement (skincare, grooming, haircut,
fitness, sleep, posture, style). You NEVER recommend surgery, extreme dieting,
"bonesmashing", or anything harmful.

Score generously and realistically on a 0-100 scale where 70 is an average,
attractive person. Avoid demoralizing low scores. The "potential" score must be
higher than the overall score and realistically achievable with the plan.

Return ONLY valid JSON matching the requested schema. No markdown, no commentary.`;

/**
 * The JSON shape we ask the model to return. Mirrors the `Analysis` type minus
 * the client-managed fields (id, createdAt, photos), which the app fills in.
 */
export const RESPONSE_SCHEMA_HINT = `{
  "overall": number (0-100),
  "potential": number (0-100, > overall),
  "headline": string (short, encouraging, no insults),
  "metrics": [
    { "key": "jawline"|"skin"|"symmetry"|"eyes"|"hair"|"cheekbones",
      "label": string, "score": number (0-100), "note": string (constructive) }
  ],
  "plan": [
    { "id": string, "title": string, "description": string,
      "category": "skincare"|"grooming"|"fitness"|"style"|"habits",
      "effort": "quick win"|"routine"|"long game",
      "potentialGain": number (1-10) }
  ]
}`;

export function buildUserPrompt(hasSide: boolean): string {
  return [
    'Analyze the attached selfie(s) and produce the glow-up analysis.',
    hasSide
      ? 'Two images are provided: a front view and a side profile.'
      : 'One front-view image is provided.',
    'Include exactly 6 metrics (jawline, skin, symmetry, eyes, hair, cheekbones)',
    'and 6 prioritized plan steps (highest-impact first).',
    `Respond with JSON only, matching: ${RESPONSE_SCHEMA_HINT}`,
  ].join(' ');
}
