/**
 * api/redeem-token.js — Vercel function for Pro access-code redemption
 *
 * POST { code } with the signed-in user's Firebase ID token in the
 * Authorization header. Verifies the code server-side (see _redeem.mjs) and
 * activates the Pro plan on the caller's usage doc.
 */

import { redeemProToken } from './_redeem.mjs';

export const config = { runtime: 'nodejs' };

const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.SITE_URL || 'https://lecturer-sam-academy.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  let code;
  try {
    const body = await request.json();
    code = body?.code;
  } catch {
    return Response.json({ error: { code: 'bad-request', message: 'Invalid JSON body.' } }, { status: 400, headers: corsHeaders });
  }

  const result = await redeemProToken(request.headers.get('authorization'), code);
  return Response.json(result.body, { status: result.status, headers: corsHeaders });
}
