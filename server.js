/**
 * server.js — Lightweight AI proxy server for Lecturer Sam Academy
 *
 * Uses only Node.js built-ins. No Express, no external dependencies.
 * Reads OPENROUTER_API_KEY from .env and proxies POST /api/generate
 * to OpenRouter, keeping the API key off the client.
 *
 * Start: node server.js
 * Default port: 3001
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const PORT = parseInt(process.env.SERVER_PORT || '3001', 10);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const SITE_NAME = process.env.SITE_NAME || 'Lecturer Sam Academy';

if (!OPENROUTER_API_KEY) {
  console.warn('[server] ⚠  OPENROUTER_API_KEY not set — AI requests will fail with 401.');
}

// ── CORS headers ──────────────────────────────────────────────────────────────

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Body reader ───────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ── OpenRouter proxy ──────────────────────────────────────────────────────────

function proxyToOpenRouter(body) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(body, 'utf8');

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  setCors(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, keySet: Boolean(OPENROUTER_API_KEY) }));
    return;
  }

  // Main generate endpoint
  if (req.method === 'POST' && req.url === '/api/generate') {
    try {
      const rawBody = await readBody(req);

      // Validate JSON
      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      // Build OpenRouter payload
      const model = parsed.model || 'openai/gpt-4o-mini';
      const messages = parsed.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'messages array required' }));
        return;
      }

      const orPayload = JSON.stringify({ model, messages });
      const { status, body } = await proxyToOpenRouter(orPayload);

      // Log non-2xx responses to help with debugging
      if (status < 200 || status >= 300) {
        console.error(`[server] OpenRouter returned ${status}:`, body.slice(0, 500));
      }

      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body);
    } catch (err) {
      console.error('[server] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', detail: err.message }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[server] ✓ AI proxy running on http://localhost:${PORT}`);
  console.log(`[server]   POST http://localhost:${PORT}/api/generate`);
  console.log(`[server]   API key: ${OPENROUTER_API_KEY ? '✓ set' : '✗ missing — add to .env'}`);
});
