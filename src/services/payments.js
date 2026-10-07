/**
 * payments.js — Paystack Inline checkout for the Pro plan
 *
 * Pro plan: GH₵50/month (amount in pesewas: 5000). The checkout runs in
 * Paystack test mode until real keys are set; the webhook
 * (api/paystack-webhook.js) activates the plan after a successful charge.
 */

export const PRO_PRICE_GHS = 50;
export const PRO_AMOUNT_PESAWA = 5000;

export function paymentsConfigured() {
  return Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
}

/**
 * Open the Paystack Inline checkout.
 * @param {object} opts
 * @param {string} opts.email - payer's email (the signed-in user's email)
 * @param {string} [opts.name] - payer's display name
 * @param {() => void} [opts.onSuccess] - called when the payment dialog succeeds
 * @param {() => void} [opts.onClose] - called when the user closes the dialog
 */
export function openProCheckout({ email, name, onSuccess, onClose }) {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!key) {
    window.alert('Payments are coming soon — check back in a few days.');
    return;
  }

  const scriptId = 'paystack-inline';
  const loadScript = () => new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', resolve);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Paystack. Check your connection.'));
    document.body.appendChild(script);
  });

  loadScript().then(() => {
    const handler = window.PaystackPop.setup({
      key,
      email,
      amount: PRO_AMOUNT_PESAWA,
      currency: 'GHS',
      ref: `lsa-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      metadata: { custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: 'pro-monthly' }] },
      callback: () => onSuccess?.(),
      onClose: () => onClose?.(),
    });
    handler.openIframe();
  }).catch(err => {
    window.alert(err.message);
  });
}
