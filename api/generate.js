/**
 * api/generate.js — Vercel / Netlify serverless function
 *
 * Vercel:  automatically served at /api/generate
 * Netlify: requires netlify.toml redirect (see below) — place this file at
 *          netlify/functions/generate.js instead and update the export format.
 *
 * The OPENROUTER_API_KEY environment variable must be set in the platform
 * dashboard (Vercel → Project Settings → Environment Variables).
 * Auth + quota enforcement (FIREBASE_SERVICE_ACCOUNT) is always active here.
 */

import { gateAiRequest } from './_aiGate.mjs';

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

  // Parse body — Vercel provides req.body already parsed when Content-Type is application/json.
  // Forward everything the client sent (plugins, web_search_options, stream,
  // temperature, …) so web search and streaming work without function changes.
  const { model, messages, ...rest } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  // Auth + monthly quota gate — always enforced in production.
  const gate = await gateAiRequest(req.headers.authorization);
  if (gate.status !== 200) {
    res.status(gate.status).json(gate.body);
    return;
  }

  const stream = rest.stream === true;

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
        ...rest,
      }),
    });

    if (!orRes.ok) {
      const errData = await orRes.json().catch(() => ({}));
      console.error('[api/generate] OpenRouter error:', orRes.status, JSON.stringify(errData).slice(0, 300));
      res.status(orRes.status).json(errData);
      return;
    }

    if (stream && orRes.body) {
      // Pipe the SSE stream through to the client.
      res.status(200);
      res.setHeader('Content-Type', orRes.headers.get('content-type') || 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      for await (const chunk of orRes.body) {
        res.write(chunk);
      }
      res.end();
      return;
    }

    const data = await orRes.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('[api/generate] Fetch error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to reach OpenRouter', detail: err.message });
    } else {
      res.end();
    }
  }
}
