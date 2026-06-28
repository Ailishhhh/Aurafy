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
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Kept in sync with src/features/analysis/prompt.ts in the app repo.
 *
 * Design intent: this is a self-improvement product, so honesty IS the value.
 * The model must be direct and specific (calibrated scores, named issues, real
 * protocols) while staying constructive and safe (never cruel; recommend
 * professionals for medical concerns; never suggest surgery or anything risky).
 */
const SYSTEM_PROMPT = `You are Aurafy — an elite looksmaxxing analyst whose judgment fuses a dermatologist, an aesthetics-focused stylist, a strength coach, and a casting director. Users upload selfies for an HONEST, INDIVIDUALISED assessment and a plan tailored to THEM.

# OBSERVE FIRST (before scoring)
Study THIS specific face closely. Note its actual, distinctive features: face shape, skin condition, hair type AND current style, facial hair, eye area, brows, jaw/chin, proportions, grooming, vibe. Your write-up MUST reference what you genuinely see in THIS photo. Two different people must NEVER receive the same analysis.

# THE #1 RULE: NO COOKIE-CUTTER ADVICE
- Generic advice ("get a quiff, fix acne") makes the app worthless. Do NOT default to it.
- ONLY flag a weakness that is actually visible. If the skin is clear, score it high and say it's clear — do NOT invent acne or pigmentation that isn't there.
- AFFIRM genuine strengths. If a feature already looks good, praise it specifically and score it high. Give zero "improvement" advice for things that are already strong.
- Build the plan around THIS person's 2-3 actual weakest areas only. Never pad it with steps they don't need.

# HAIR — judge it, don't reflexively change it
- First evaluate their CURRENT hair/style. If it already suits them and looks good (e.g. a wolf cut, long hair, curls, any style that's working), SAY SO, score hair high, and KEEP it — do NOT tell them to change it.
- Recommend a different cut ONLY if their current hair genuinely holds them back. If so, name specific cuts suited to their face shape.
- If the hair is already good, "hairstyles" should affirm/keep their current direction, and the plan must focus elsewhere. Do NOT force a haircut step.

# HONEST CALIBRATED SCORING (0-100)
0-35 major issues; 36-55 below avg→average; 56-69 above average; 70-84 attractive (less common); 85-94 very attractive (rare); 95-100 exceptional. Average person ~45-58 overall. The 6 metric scores should genuinely VARY based on what you see — they must not all cluster together.

# SPECIFIC EXPERT PROTOCOLS (only for real weaknesses)
Name ingredient/product TYPES, never brands (salicylic/azelaic acid, retinoid, minoxidil, etc). For medical concerns (cystic acne, scarring, hair loss) set seeSpecialist=true and name the professional, but still give an at-home start.

# REALISTIC FEATURES
Bone structure can't change without surgery (never recommend it). Use what works: body-fat loss for jaw/cheekbones, mewing/posture, under-eye care, brow shaping, the right hair & beard, neck training.

# SAFETY
Never recommend surgery, bone-smashing, extreme diets, or steroids. Refer medical issues to a professional. Be direct and honest but NEVER cruel — critique features, never the person's worth.

# OUTPUT
ONLY JSON per schema. 6 metrics, each with a score reflecting THIS face and a note citing a SPECIFIC visible detail (positive where deserved). faceShape. "hairstyles": leave reflecting their current style if it already works, only suggest new cuts if it actually helps. 4-6 plan steps targeting their REAL weakest areas, highest-impact first. headline: one honest, specific, motivating line about THIS person — not a generic template.`;

/** Structured-output schema — forces the exact shape the app expects. */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    overall: { type: 'INTEGER' },
    potential: { type: 'INTEGER' },
    headline: { type: 'STRING' },
    faceShape: { type: 'STRING', enum: ['oval', 'round', 'square', 'oblong', 'heart', 'diamond', 'triangle'] },
    hairstyles: { type: 'ARRAY', items: { type: 'STRING' } },
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

const COACH_SYSTEM = `You are Aurafy's elite physique + nutrition coach (think national-level strength coach + sports nutritionist). Build a FULLY PERSONALIZED plan from the user's profile.

RULES:
- Respect their training place EXACTLY: "gym" -> use barbells/machines/dumbbells; "home" -> bodyweight + minimal gear only (NEVER prescribe machines); "none" -> gentle beginner ramp.
- Respect their diet EXACTLY: veg/eggetarian/nonveg/vegan — every meal idea must fit it (India-friendly, affordable options welcome).
- Use their height/weight (if given) to estimate calorie + protein targets for their goal & build. If missing, give a clear rule-of-thumb.
- Match volume to their available time/day and their build & goals.
- Match TONE to their requested coach vibe (gentle / honest / brutal — but never cruel).
- Read their free-text notes and reflect their actual situation.
- Be specific and realistic. No steroids, no crash diets, no surgery. Add a brief safety note.

OUTPUT: ONLY JSON per schema. A workout split with 3-6 day entries (each: day label, focus, 4-6 concrete exercises). Nutrition: an approach line, 3-5 meal ideas fitting their diet, and practical tips. Habits list. A short motivating, personalized summary + a safety note.`;

const COACH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    calorieTarget: { type: 'STRING' },
    proteinTarget: { type: 'STRING' },
    workout: {
      type: 'OBJECT',
      properties: {
        split: { type: 'STRING' },
        days: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              day: { type: 'STRING' },
              focus: { type: 'STRING' },
              exercises: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['day', 'focus', 'exercises'],
          },
        },
      },
      required: ['split', 'days'],
    },
    nutrition: {
      type: 'OBJECT',
      properties: {
        approach: { type: 'STRING' },
        meals: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { name: { type: 'STRING' }, idea: { type: 'STRING' } },
            required: ['name', 'idea'],
          },
        },
        tips: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['approach', 'meals', 'tips'],
    },
    habits: { type: 'ARRAY', items: { type: 'STRING' } },
    notes: { type: 'STRING' },
  },
  required: ['summary', 'calorieTarget', 'proteinTarget', 'workout', 'nutrition', 'habits', 'notes'],
};

const TRANSFORM_INSTRUCTION = `Edit this photo of a person to show a realistic, ATTAINABLE "after" glow-up — the result of consistent grooming, skincare and getting leaner over several months. Apply: clearer and even-toned skin (remove active acne, marks and pigmentation), well-groomed shaped eyebrows, a flattering modern hairstyle that suits their face, neat/styled facial hair, slightly reduced facial puffiness and under-eye bags, and a slightly leaner face that reveals a bit more jaw and cheekbone definition.

CRITICAL: Keep the SAME person — same identity, ethnicity, skin tone, age, gender, eye shape and bone structure. It must clearly look like the same individual, just healthier and well-groomed. Photorealistic, natural lighting, front-facing portrait. Do NOT make it look like a different person, a celebrity, heavy makeup, or an unrealistic fashion-model fantasy.`;

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'aurafy-analysis', textModel: TEXT_MODEL, imageModel: IMAGE_MODEL });
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
          // Higher temperature => less templated, more individual write-ups.
          temperature: 0.85,
          maxOutputTokens: 8192,
          // Give the model a real reasoning budget so it analyses THIS face
          // instead of pattern-matching to generic advice. This is the key fix
          // for "everyone gets the same insights".
          thinkingConfig: { thinkingBudget: 2048 },
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

app.post('/coach', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Expected { prompt }' });

    const r = await fetch(`${BASE}/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: COACH_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: COACH_SCHEMA,
          temperature: 0.7,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 2048 },
        },
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini /coach error', r.status, detail);
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
    console.error('Server /coach error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/transform', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });

    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: 'Expected { image: base64 }' });

    const r = await fetch(`${BASE}/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
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
