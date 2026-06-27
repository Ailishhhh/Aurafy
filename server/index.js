/**
 * Aurafy analysis backend.
 *
 * Sits between the app and Google Gemini. Holds the API key (never shipped in
 * the app) and exposes two endpoints:
 *   POST /analyze    -> honest, specific looksmaxxing analysis (text model)
 *   POST /transform  -> a realistic "future self" glow-up image (image model)
 *
 * Run locally:   npm install && npm start
 * Env required:  GEMINI_API_KEY  (free key at https://aistudio.google.com/apikey)
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '16mb' }));
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TEXT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Kept in sync with src/features/analysis/prompt.ts in the app repo.
 *
 * Design intent: this is a self-improvement product, so honesty IS the value.
 * The model must be direct and specific (calibrated scores, named issues, real
 * protocols) while staying constructive and safe (never cruel; recommend
 * professionals for medical concerns; never suggest surgery or anything risky).
 */
const SYSTEM_PROMPT = `You are Aurafy, an elite, no-nonsense looksmaxxing and self-improvement coach.
Users upload selfies for an HONEST expert assessment and a concrete plan to improve.

# CORE PRINCIPLE: RADICAL HONESTY
- Be direct and truthful. Do NOT inflate scores or give empty flattery — generic praise makes the app worthless.
- Most people are average. Use the FULL scale and a realistic bell curve. Do not cluster everyone at 70-85.
- Name the SPECIFIC visible issues plainly (e.g. hyperpigmentation, post-acne marks, active acne, under-eye bags, weak chin projection, recessed jaw, high body-fat softening the jawline, sparse or unkempt brows, dated/unflattering hairstyle, thin lips, dull skin texture).
- Tone: objective, clinical, and constructive — like a frank expert coach. Direct about weaknesses, but NEVER mocking, cruel, or insulting the person's worth. Critique features, not the human.

# SCORING SCALE (0-100, per metric AND overall)
- 0-35  : clear issues, large improvement potential
- 36-55 : below average to average (most ordinary selfies land here)
- 56-69 : above average, solid
- 70-84 : attractive, clearly above average (less common)
- 85-94 : very attractive (rare)
- 95-100: exceptional / model-tier (very rare)
An average person should score around 45-58 overall. Reserve 70+ for genuinely above-average faces.

# SPECIFICITY = THE PRODUCT'S VALUE
- For each metric, give the specific OBSERVATION and the specific FIX.
- In the plan, give concrete protocols naming ingredient/product TYPES (never specific brands), e.g.:
  - acne -> "2% salicylic acid cleanser + adapalene (0.1%) gel at night"
  - post-acne marks / pigmentation -> "azelaic acid 10% or vitamin C serum AM; glycolic acid exfoliant 2x/week"
  - dullness/texture -> "a retinoid at night + daily SPF 50"
  - sparse beard -> "topical minoxidil 5% + derma-roller weekly"
- When something is medical or beyond at-home care (cystic/severe acne, deep scarring, melasma, hair loss, very crooked teeth), set seeSpecialist=true and name the professional (dermatologist, orthodontist, trichologist) — but STILL give an at-home starting plan.

# FEATURES: BE REALISTIC ABOUT WHAT CAN CHANGE
- Bone structure (eye shape, deep-set sockets, base jaw) cannot change without surgery, which you NEVER recommend.
- Instead prescribe what genuinely works:
  - jaw/cheekbones: lower overall body fat to reveal definition; mewing + correct tongue posture; reduce facial bloat (sodium, alcohol, sleep).
  - eye area: reduce under-eye puffiness (sleep, lower sodium, caffeine eye cream); brow shaping to frame the eyes.
  - profile/neck: posture work, chin tucks, neck training to improve side profile.
  - framing: a hairstyle matched to the face shape; clean, shaped eyebrows; tidy or styled facial hair.

# SAFETY (non-negotiable)
- NEVER recommend surgery, bone-smashing, starvation or extreme diets, steroids, or anything unsafe.
- For medical skin/hair concerns, recommend a licensed professional.
- General guidance only; no medical guarantees.

# OUTPUT
Return ONLY JSON matching the provided schema. 6 metrics (jawline, skin, symmetry, eyes, hair, cheekbones), each honest with a specific note. 5-7 plan steps, highest-impact first. headline: ONE honest, motivating sentence (not flattery).`;

/** Structured-output schema — forces the exact shape the app expects. */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    overall: { type: 'INTEGER' },
    potential: { type: 'INTEGER' },
    headline: { type: 'STRING' },
    metrics: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          key: { type: 'STRING', enum: ['jawline', 'skin', 'symmetry', 'eyes', 'hair', 'cheekbones'] },
          label: { type: 'STRING' },
          score: { type: 'INTEGER' },
          note: { type: 'STRING' },
        },
        required: ['key', 'label', 'score', 'note'],
      },
    },
    plan: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          category: { type: 'STRING', enum: ['skincare', 'grooming', 'fitness', 'style', 'habits'] },
          effort: { type: 'STRING', enum: ['quick win', 'routine', 'long game'] },
          potentialGain: { type: 'INTEGER' },
          products: { type: 'ARRAY', items: { type: 'STRING' } },
          seeSpecialist: { type: 'BOOLEAN' },
        },
        required: ['id', 'title', 'description', 'category', 'effort', 'potentialGain'],
      },
    },
  },
  required: ['overall', 'potential', 'headline', 'metrics', 'plan'],
};

const TRANSFORM_INSTRUCTION = `Edit this photo of a person to show a realistic, ATTAINABLE "after" glow-up — the result of consistent grooming, skincare and getting leaner over several months. Apply: clearer and even-toned skin (remove active acne, marks and pigmentation), well-groomed shaped eyebrows, a flattering modern hairstyle that suits their face, neat/styled facial hair, slightly reduced facial puffiness and under-eye bags, and a slightly leaner face that reveals a bit more jaw and cheekbone definition.

CRITICAL: Keep the SAME person — same identity, ethnicity, skin tone, age, gender, eye shape and bone structure. It must clearly look like the same individual, just healthier and well-groomed. Photorealistic, natural lighting, front-facing portrait. Do NOT make it look like a different person, a celebrity, heavy makeup, or an unrealistic fashion-model fantasy.`;

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'aurafy-analysis', textModel: TEXT_MODEL, imageModel: IMAGE_MODEL });
});

/**
 * Diagnostic: list the models this API key can access + their supported methods.
 * Used to discover which image-capable model is available on the free tier.
 */
app.get('/debug/models', async (_req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    const r = await fetch(`${BASE}?key=${GEMINI_API_KEY}&pageSize=200`);
    const data = await r.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      methods: m.supportedGenerationMethods,
    }));
    res.json({ count: models.length, models });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });

    const { prompt, images } = req.body || {};
    if (!prompt || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Expected { prompt, images: [base64, ...] }' });
    }

    const parts = [{ text: prompt }];
    for (const b64 of images) parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } });

    const r = await fetch(`${BASE}/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.6,
          maxOutputTokens: 6144,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini /analyze error', r.status, detail);
      return res.status(502).json({ error: 'Upstream model error', status: r.status, detail: detail.slice(0, 800) });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Empty model response' });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Model returned non-JSON', raw: text.slice(0, 500) });
    }
    return res.json(parsed);
  } catch (err) {
    console.error('Server /analyze error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/transform', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });

    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: 'Expected { image: base64 }' });

    // Optional model override for diagnostics (defaults to configured IMAGE_MODEL).
    const model = (req.body && req.body.model) || IMAGE_MODEL;

    const r = await fetch(`${BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: TRANSFORM_INSTRUCTION },
              { inline_data: { mime_type: 'image/jpeg', data: image } },
            ],
          },
        ],
        generationConfig: { responseModalities: ['IMAGE'], temperature: 0.4 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini /transform error', r.status, detail);
      return res.status(502).json({ error: 'Upstream image error', status: r.status, detail: detail.slice(0, 800) });
    }

    const data = await r.json();
    const partsOut = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = partsOut.find((p) => p.inline_data || p.inlineData);
    const inline = imgPart?.inline_data || imgPart?.inlineData;
    if (!inline?.data) return res.status(502).json({ error: 'No image returned' });

    return res.json({
      image: inline.data,
      mimeType: inline.mime_type || inline.mimeType || 'image/png',
    });
  } catch (err) {
    console.error('Server /transform error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aurafy server on :${PORT} (text: ${TEXT_MODEL}, image: ${IMAGE_MODEL})`);
});
