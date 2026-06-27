/**
 * Aurafy analysis backend.
 *
 * A tiny Express server that sits between the app and Google Gemini. The app
 * sends selfies (base64) + a prompt; this server attaches our secret API key,
 * calls Gemini's vision model, and returns clean analysis JSON.
 *
 * Why a server at all? So the Gemini API key NEVER ships inside the mobile app
 * (where anyone could extract it and drain your quota). The key lives here, in
 * an environment variable, on the host only.
 *
 * Run locally:   npm install && npm start
 * Env required:  GEMINI_API_KEY  (get a free key at https://aistudio.google.com/apikey)
 */

const express = require('express');
const cors = require('cors');

const app = express();
// Selfies arrive base64-encoded, so allow a generous body size.
app.use(express.json({ limit: '12mb' }));
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Kept in sync with src/features/analysis/prompt.ts in the app repo.
const SYSTEM_PROMPT = `You are Aurafy, a supportive AI grooming and style coach.
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

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'aurafy-analysis', model: MODEL });
});

app.post('/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const { prompt, images } = req.body || {};
    if (!prompt || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Expected { prompt, images: [base64, ...] }' });
    }

    // Build Gemini "parts": the text prompt followed by each inline image.
    const parts = [{ text: prompt }];
    for (const b64 of images) {
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } });
    }

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, detail);
      return res.status(502).json({
        error: 'Upstream model error',
        status: geminiRes.status,
        // Surfaced to help debugging. Contains no secrets (just Gemini's message).
        detail: detail.slice(0, 800),
      });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Empty model response' });

    // Gemini returns JSON as a string (responseMimeType=json); parse + forward.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Model returned non-JSON', raw: text.slice(0, 500) });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aurafy analysis server listening on :${PORT} (model: ${MODEL})`);
});
