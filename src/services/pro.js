/**
 * pro.js — client-side Pro service (WhatsApp manual payment flow)
 *
 * Upgrades happen over WhatsApp: the user taps a prefilled chat link to the
 * admin's number, pays via mobile money, receives a one-time access code, and
 * redeems it here. The usage-doc snapshot in useUsage() then flips the whole
 * app to Pro.
 */

import { auth } from '../firebase';

const WHATSAPP_NUMBER = String(import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

export function whatsappNumberConfigured() {
  return Boolean(WHATSAPP_NUMBER);
}

/** Prefilled WhatsApp chat link for the admin's number (or the share picker). */
export function proWhatsAppLink({ email } = {}) {
  const text = email
    ? `Hello! I want to upgrade to Lecturer Sam Academy Pro (GH₵50/month). My account email is ${email}. Please send me the payment details.`
    : 'Hello! I want to upgrade to Lecturer Sam Academy Pro (GH₵50/month). Please send me the payment details.';
  return WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** The print-ready Learner's Books are the Pro-gated downloads. */
export function isProBook(bookId) {
  return typeof bookId === 'string' && bookId.endsWith('-print-ready');
}

/**
 * Redeem a Pro access code for the signed-in user.
 * @returns {Promise<{ plan: 'pro', proExpiresAt: number }>}
 */
export async function redeemProCode(rawCode) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch('/api/redeem-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code: rawCode }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? 'Could not activate your Pro plan. Please try again.');
  }
  return body;
}
