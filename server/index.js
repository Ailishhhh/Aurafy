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

const CHAT_SYSTEM = `You are Aurafy's personal AI looksmaxxing & self-improvement coach, chatting 1-on-1 with the user. You blend a dermatologist, strength coach, stylist and grooming expert.

STYLE:
- Warm, sharp, and practical — like a knowledgeable friend who actually knows their stuff.
- Keep replies CONCISE: a few short sentences or a tight bullet list. No essays.
- Be specific and actionable. Reference the user's profile/context when relevant.
- Match the user's coach vibe if given (gentle / honest / brutal — never cruel).

SCOPE & SAFETY:
- Stay on topic: looks, skin, hair, physique, grooming, style, confidence, nutrition, habits. Politely steer off-topic questions back.
- No medical diagnosis. For medical/serious skin or health issues, recommend seeing a professional.
- Never recommend surgery, steroids, crash diets, or anything unsafe.`;

const TRANSFORM_INSTRUCTION = `Edit this photo of a person to show a realistic, ATTAINABLE "after" glow-up — the result of consistent grooming, skincare and getting leaner over several months. Apply: clearer and even-toned skin (remove active acne, marks and pigmentation), well-groomed shaped eyebrows, a flattering modern hairstyle that suits their face, neat/styled facial hair, slightly reduced facial puffiness and under-eye bags, and a slightly leaner face that reveals a bit more jaw and cheekbone definition.

CRITICAL: Keep the SAME person — same identity, ethnicity, skin tone, age, gender, eye shape and bone structure. It must clearly look like the same individual, just healthier and well-groomed. Photorealistic, natural lighting, front-facing portrait. Do NOT make it look like a different person, a celebrity, heavy makeup, or an unrealistic fashion-model fantasy.`;

const LAST_UPDATED = 'June 2026';
const CONTACT_EMAIL = 'support@aurafy.app'; // TODO: replace with your real support email

function page(title, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aurafy — ${title}</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#07060B;color:#E9E6F5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6}
  .wrap{max-width:760px;margin:0 auto;padding:48px 22px 80px}
  h1{font-size:30px;background:linear-gradient(90deg,#9D7BFF,#E15CFF,#FFC65C);-webkit-background-clip:text;background-clip:text;color:transparent;margin:0 0 4px}
  .upd{color:#8E88A6;font-size:13px;margin-bottom:28px}
  h2{font-size:19px;margin:30px 0 8px;color:#fff}
  p,li{color:#C7C2DB;font-size:15px}
  a{color:#9D7BFF}
  hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:34px 0}
  .foot{color:#6f6a86;font-size:13px;margin-top:40px}
</style></head><body><div class="wrap">${bodyHtml}
<hr><p class="foot">Aurafy · Last updated ${LAST_UPDATED} · Contact: ${CONTACT_EMAIL}</p>
</div></body></html>`;
}

app.get('/privacy', (_req, res) => {
  res.type('html').send(page('Privacy Policy', `
<h1>Privacy Policy</h1><div class="upd">Last updated ${LAST_UPDATED}</div>
<p>Aurafy ("we", "us") provides an AI self-improvement and looksmaxxing app. This policy explains what we collect and how we use it.</p>
<h2>Information we collect</h2>
<ul>
<li><b>Photos you submit</b> (selfies) — used solely to generate your analysis. They are sent to our AI processing provider to produce results and are not used to identify you or sold.</li>
<li><b>Account information</b> — your email address (for sign-in), managed via our authentication provider.</li>
<li><b>Profile &amp; usage data</b> — the goals, age range, and preferences you provide, your scan history, streaks, and in-app activity, so we can personalize your plan.</li>
</ul>
<h2>How we use it</h2>
<p>To generate your analysis and personalized plans, save your progress, operate subscriptions, and improve the app. We do not sell your personal data.</p>
<h2>Third-party services</h2>
<ul>
<li><b>Google Gemini API</b> — processes your photos/text to generate analysis and coaching.</li>
<li><b>Supabase</b> — stores your account and profile data securely.</li>
<li><b>RevenueCat &amp; Google Play Billing</b> — process subscriptions (we never see your card details).</li>
</ul>
<h2>Data retention &amp; your rights</h2>
<p>You can delete all your data anytime from <b>Profile → Clear all data</b>, which removes your account and content. You may also contact us to request deletion.</p>
<h2>Security</h2>
<p>Data is transmitted over encrypted connections and protected by access controls. No method is 100% secure, but we take reasonable measures to protect your information.</p>
<h2>Age</h2>
<p>Aurafy is intended for users aged 13 and older. If you are under the age of majority in your country, please use Aurafy with a parent or guardian's involvement. We do not knowingly collect data from children under 13.</p>
<h2>Changes</h2>
<p>We may update this policy; material changes will be reflected here with a new date.</p>
<h2>Contact</h2>
<p>Questions? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`));
});

app.get('/terms', (_req, res) => {
  res.type('html').send(page('Terms of Service', `
<h1>Terms of Service</h1><div class="upd">Last updated ${LAST_UPDATED}</div>
<p>By using Aurafy you agree to these terms.</p>
<h2>What Aurafy is</h2>
<p>Aurafy provides AI-generated appearance analysis, self-improvement plans, and coaching for general informational and motivational purposes.</p>
<h2>Not professional advice</h2>
<p>Aurafy is <b>not</b> medical, dermatological, nutritional, financial, or psychological advice. Always consult a qualified professional before acting on health, diet, or exercise guidance. Scores and projections are estimates for motivation, not facts about your worth.</p>
<h2>Subscriptions</h2>
<p>Premium features are offered via auto-renewing subscriptions billed through your app store. You can manage or cancel anytime in your store account; terms and pricing are shown at purchase.</p>
<h2>Acceptable use</h2>
<p>Only upload photos of yourself that you have the right to use. Do not misuse the service or upload others' images without consent.</p>
<h2>Disclaimers &amp; liability</h2>
<p>The service is provided "as is" without warranties. To the maximum extent permitted by law, Aurafy is not liable for any indirect or consequential damages arising from use of the app.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`));
});

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

app.post('/chat', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    const { messages, context } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Expected { messages: [...] }' });
    }
    const sys = context ? `${CHAT_SYSTEM}\n\nContext about this user: ${context}` : CHAT_SYSTEM;
    const contents = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const r = await fetch(`${BASE}/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error('Gemini /chat error', r.status, detail);
      return res.status(502).json({ error: 'Upstream model error', status: r.status, detail: detail.slice(0, 600) });
    }
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!reply) return res.status(502).json({ error: 'Empty model response' });
    return res.json({ reply });
  } catch (err) {
    console.error('Server /chat error', err);
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
