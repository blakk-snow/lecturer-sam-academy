/**
 * whatsapp.js — support-number normalisation
 *
 * wa.me wants digits only: country code, then the subscriber number, with no
 * "+", no spaces and — critically — no trunk zero. Ghanaian numbers are
 * written several ways in practice, and a naive "strip non-digits" turns
 * `+233 (0) 241 234 567` into `2330241234567`, which is a dead link.
 *
 * This app is Ghana-only, so the Ghana forms are handled explicitly:
 *   233241234567        → 233241234567   (already correct)
 *   +233 24 123 4567    → 233241234567
 *   +233 (0) 241234567  → 233241234567   (trunk zero after the country code)
 *   00233241234567      → 233241234567   (international dialling prefix)
 *   0241234567          → 233241234567   (local mobile format)
 */

const GHANA_COUNTRY_CODE = '233';
const GHANA_LOCAL_MOBILE_LENGTH = 10; // 0 + 9 digits, e.g. 0241234567

/**
 * @param {string} [raw] - the number as configured in VITE_SUPPORT_WHATSAPP
 * @returns {string} wa.me-safe digits, or '' when unusable
 */
export function normalizeWhatsappNumber(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';

  // "00" is the international dialling prefix used in Ghana (00233…).
  if (digits.startsWith('00')) digits = digits.slice(2);

  // A trunk zero written after the country code: +233 (0) 241 234 567.
  if (digits.startsWith(`${GHANA_COUNTRY_CODE}0`)) {
    digits = GHANA_COUNTRY_CODE + digits.slice(GHANA_COUNTRY_CODE.length + 1);
  }

  // A local mobile number with no country code: 0241234567.
  if (digits.startsWith('0') && digits.length === GHANA_LOCAL_MOBILE_LENGTH) {
    digits = GHANA_COUNTRY_CODE + digits.slice(1);
  }

  return digits;
}

/**
 * Build the wa.me link, or null when there is no usable number — a link with
 * no recipient opens WhatsApp and asks the user to pick a contact, which is
 * not a support line.
 *
 * @param {string} [raw] - configured number
 * @param {string} [message] - prefilled message text
 * @returns {string|null}
 */
export function buildSupportLink(raw, message = '') {
  const number = normalizeWhatsappNumber(raw);
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}
