/**
 * api/generate.js — Vercel / Netlify serverless function
 *
 * Vercel:  automatically served at /api/generate
 * Netlify: requires netlify.toml redirect (see below) — place this file at
 *          netlify/functions/generate.js instead and update the export format.
 *
 * The OPENROUTER_API_KEY environment variable must be set in the platform
 * dashboard (Vercel → Project Settings → Environment Variables).
 */

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // CORS preflight
  const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.SITE_URL || 'https://lecturer-sam-academy.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server.' });
    return;
  }

  // Parse body — Vercel provides req.body already parsed when Content-Type is application/json
  const { model, messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://lecturer-sam-academy.vercel.app',
        'X-Title': process.env.SITE_NAME || 'Lecturer Sam Academy',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages,
      }),
    });

    const data = await orRes.json();

    if (!orRes.ok) {
      console.error('[api/generate] OpenRouter error:', orRes.status, JSON.stringify(data).slice(0, 300));
    }

    res.status(orRes.status).json(data);
  } catch (err) {
    console.error('[api/generate] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to reach OpenRouter', detail: err.message });
  }
}
