// Run with: npm test. Browser lead-form validation without zod (item 14): same verdicts and
// messages as the server's zod schemas, and no zod / react-hook-form in the forms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});
const { rules, validateLead } = await import('../../src/lib/lead-form-rules.ts');
const { nameField, phoneField } = await import('../../src/lib/lead-validation.ts');
const { NAME_ERROR, PHONE_ERROR } = await import('../../src/lib/lead-checks.ts');

const NAMES = ['Ravi', 'K. Ramesh', "O'Brien", 'Anne-Marie', 'రవి కుమార్', ' Ravi ', 'R', '...', 'Ravi123', 'A'.repeat(61), '', 'Ravi’s'];
const PHONES = ['9876543210', '+91 98765 43210', '+91-98765-43210', '09876543210', ' 9876543210 ', '5876543210', '98765', '', 'abc', '+1 9876543210'];

test('name and phone: same verdict as the server zod fields', () => {
  for (const n of NAMES) assert.equal(rules.name()(n.trim()) === null, nameField.safeParse(n).success, JSON.stringify(n));
  for (const p of PHONES) assert.equal(rules.phone()(p) === null, phoneField.safeParse(p).success, JSON.stringify(p));
  assert.equal(rules.name()('1'), NAME_ERROR);
  assert.equal(rules.phone()('123'), PHONE_ERROR);
});

test('validateLead: first failing rule per field, trims name/phone, missing fields are empty', () => {
  const schema = {
    name: [rules.name()],
    phone: [rules.phone()],
    branch: [rules.oneOf(['dilsukhnagar', 'ameerpet', 'online'], 'Please select a branch')],
    course: [],
  };
  const ok = validateLead(schema, { name: '  Ravi Kumar ', phone: ' 9876543210', branch: 'ameerpet', extra: 'x' });
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.values, { name: 'Ravi Kumar', phone: '9876543210', branch: 'ameerpet', course: '' });
  const bad = validateLead(schema, { name: '', phone: '12' });
  assert.deepEqual(bad.errors, { name: NAME_ERROR, phone: PHONE_ERROR, branch: 'Please select a branch' });
});

test('corporate rules: email, lengths', () => {
  assert.equal(rules.email('bad')('a@b.co'), null);
  assert.equal(rules.email('bad')('a@b'), 'bad');
  assert.equal(rules.email('bad')('a b@c.io'), 'bad');
  assert.equal(rules.minLength(2, 'short')('A'), 'short');
  assert.equal(rules.maxLength(3, 'long')('abcd'), 'long');
});

test('no lead form ships zod or react-hook-form', () => {
  const forms = ['DemoSidebarForm', 'EnrollFullForm', 'HeroEnrollForm', 'CorporateForm', 'LandingEnrollForm', 'WhatsAppWidget', 'BrochureButton', 'ContactForm', 'home/HomeHeroForm', 'search/NoResultsLead', 'HoneypotField'];
  for (const f of forms) {
    const s = fs.readFileSync(`src/components/${f}.tsx`, 'utf8');
    assert.doesNotMatch(s, /from 'zod'|react-hook-form|@hookform|lead-validation'/, f);
  }
  for (const lib of ['src/lib/lead-checks.ts', 'src/lib/lead-form-rules.ts', 'src/lib/use-lead-form.ts', 'src/lib/submitLead.ts', 'src/lib/whatsapp.ts']) {
    assert.doesNotMatch(fs.readFileSync(lib, 'utf8'), /from 'zod'|lead-validation'/, lib);
  }
});
