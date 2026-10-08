/**
 * test-support-link.mjs — regression tests for the WhatsApp support link
 *
 * Run: npm test     (or: npm run test:support)
 *
 * The bug worth guarding: a naive "strip non-digits" turns the way people
 * actually write a Ghanaian number — `+233 (0) 241 234 567` — into
 * `2330241234567`, and wa.me silently fails to open a chat. The support line
 * is the only human contact route in the app, so it must not be quietly dead.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWhatsappNumber, buildSupportLink } from '../src/utils/whatsapp.js';

const EXPECTED = '233241234567';

test('an already-correct number is left alone', () => {
  assert.equal(normalizeWhatsappNumber('233241234567'), EXPECTED);
});

test('punctuation and a leading + are stripped', () => {
  assert.equal(normalizeWhatsappNumber('+233 24 123 4567'), EXPECTED);
  assert.equal(normalizeWhatsappNumber('+233-24-123-4567'), EXPECTED);
});

test('a trunk zero after the country code is removed', () => {
  assert.equal(normalizeWhatsappNumber('+233 (0) 241 234 567'), EXPECTED);
  assert.equal(normalizeWhatsappNumber('2330241234567'), EXPECTED);
});

test('the 00 international dialling prefix is removed', () => {
  assert.equal(normalizeWhatsappNumber('00233241234567'), EXPECTED);
});

test('a local mobile number gains the country code', () => {
  assert.equal(normalizeWhatsappNumber('0241234567'), EXPECTED);
});

test('an unconfigured or unusable value normalises to empty', () => {
  assert.equal(normalizeWhatsappNumber(undefined), '');
  assert.equal(normalizeWhatsappNumber(''), '');
  assert.equal(normalizeWhatsappNumber('not a number'), '');
});

test('no usable number means no support link at all', () => {
  assert.equal(buildSupportLink(undefined, 'Hello'), null);
  assert.equal(buildSupportLink('', 'Hello'), null);
});

test('the link carries the number and an encoded prefilled message', () => {
  const link = buildSupportLink('+233 (0) 241 234 567', 'Hello Lecturer Sam Academy support — ');
  assert.equal(
    link,
    `https://wa.me/${EXPECTED}?text=${encodeURIComponent('Hello Lecturer Sam Academy support — ')}`,
  );
  assert.ok(link.includes('/233241234567?'), 'the trunk zero must not reach wa.me');
});

test('a link without a message omits the text parameter', () => {
  assert.equal(buildSupportLink('0241234567'), `https://wa.me/${EXPECTED}`);
});
