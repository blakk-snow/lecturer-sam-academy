/**
 * scripts/pro-token.mjs — admin CLI for Pro access codes (WhatsApp flow)
 *
 * Payment happens manually over WhatsApp (mobile money). After a payment is
 * confirmed, the admin runs this script to create a one-time access code and
 * pastes it into the chat. The user redeems it in the app (Profile or /pro).
 *
 * Requires FIREBASE_SERVICE_ACCOUNT (JSON) in .env or the environment — the
 * same variable the AI gate uses.
 *
 *   node scripts/pro-token.mjs new 3            create 3 codes (30 days each)
 *   node scripts/pro-token.mjs new 1 --days 7   create a 7-day code
 *   node scripts/pro-token.mjs list             show all codes and their state
 *   node scripts/pro-token.mjs revoke LSA-…     delete an unused code
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env loader (same as server.js) ────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
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

// ── Code generation ────────────────────────────────────────────────────────────
// No 0/O, 1/I/L — codes are read off a WhatsApp message and typed by hand.

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  const group = () => Array.from({ length: 4 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
  return `LSA-${group()}-${group()}`;
}

// ── Firebase Admin ─────────────────────────────────────────────────────────────

async function getAdminApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.error('FIREBASE_SERVICE_ACCOUNT is not set (put it in .env).');
    process.exit(1);
  }
  let admin;
  try {
    admin = await import('firebase-admin');
  } catch {
    console.error('firebase-admin is not installed.');
    process.exit(1);
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
    process.exit(1);
  }
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin;
}

const [, , command, ...args] = process.argv;

function usage() {
  console.log('Usage:');
  console.log('  node scripts/pro-token.mjs new <count> [--days N]   create one-time Pro codes');
  console.log('  node scripts/pro-token.mjs list                     list codes and their state');
  console.log('  node scripts/pro-token.mjs revoke <code>            delete an unused code');
  process.exit(1);
}

if (!command) usage();

const admin = await getAdminApp();
const tokens = admin.firestore().collection('proTokens');

if (command === 'new') {
  const count = parseInt(args[0], 10);
  if (!Number.isInteger(count) || count < 1) usage();
  const daysIdx = args.indexOf('--days');
  const durationDays = daysIdx >= 0 ? parseInt(args[daysIdx + 1], 10) : 30;
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    console.error('--days must be a positive whole number of days.');
    process.exit(1);
  }

  console.log(`Creating ${count} Pro code(s), ${durationDays} day(s) each:\n`);
  for (let i = 0; i < count; i += 1) {
    let code;
    let done = false;
    while (!done) {
      code = generateCode();
      try {
        await tokens.doc(code).create({ durationDays, createdAt: Date.now(), usedBy: null, usedAt: null });
        done = true;
      } catch {
        // Collision (astronomically unlikely) — try another code.
      }
    }
    console.log(`  ${code}`);
  }
  console.log('\nPaste each code into WhatsApp after payment is confirmed.');
} else if (command === 'list') {
  const snapshot = await tokens.orderBy('createdAt').get();
  if (snapshot.empty) {
    console.log('No codes yet — create some with: node scripts/pro-token.mjs new 1');
    process.exit(0);
  }
  snapshot.forEach(doc => {
    const data = doc.data();
    const state = data.usedBy ? `used by ${data.usedBy} on ${new Date(data.usedAt).toLocaleString()}` : 'unused';
    console.log(`${doc.id}  ${data.durationDays}d  ${state}`);
  });
} else if (command === 'revoke') {
  const code = (args[0] ?? '').trim().toUpperCase();
  if (!code) usage();
  const doc = await tokens.doc(code).get();
  if (!doc.exists) {
    console.error(`No code ${code} found.`);
    process.exit(1);
  }
  if (doc.data().usedBy) {
    console.error(`${code} was already redeemed — cannot revoke.`);
    process.exit(1);
  }
  await tokens.doc(code).delete();
  console.log(`Revoked ${code}.`);
} else {
  usage();
}
