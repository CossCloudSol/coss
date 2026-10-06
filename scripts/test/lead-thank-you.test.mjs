// Run with: npm test   (Node's built-in runner; Node 24 imports .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { thankYouPath, parseThankYouForm, THANK_YOU_PATH } from '../../src/lib/lead-thank-you.ts';

const FORM_TYPES = ['hero', 'hero_demo', 'full', 'demo', 'whatsapp_widget', 'contact', 'brochure_request', 'course_search', 'corporate'];

test('every form type round-trips through ?form=', () => {
  for (const t of FORM_TYPES) {
    const path = thankYouPath(t);
    assert.equal(path, `/thank-you?form=${t}`);
    assert.equal(parseThankYouForm(new URL(path, 'https://x.test').searchParams.get('form') ?? undefined), t);
  }
});

test('unexpected values never reach the URL or the page', () => {
  for (const bad of ['', 'Demo', 'a b', '<script>', 'x'.repeat(33), '../admin']) {
    assert.equal(thankYouPath(bad), THANK_YOU_PATH, bad);
    assert.equal(parseThankYouForm(bad), undefined, bad);
  }
  assert.equal(parseThankYouForm(undefined), undefined);
  assert.equal(parseThankYouForm(['demo', 'x']), 'demo');
});

test('the FormType union and this list match', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../../src/lib/submitLead.ts', import.meta.url), 'utf8');
  const union = src.match(/export type FormType = ([^;]+);/)[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual([...union].sort(), [...FORM_TYPES].sort());
});
