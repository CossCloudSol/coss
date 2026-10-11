// Run with: npm test
// Lead names: what the sanitiser keeps, converts and rejects. "TEST Subodh – ignore" (en dash) must
// keep its dash, real-name punctuation . ' ’ - must survive, and runs of spaces collapse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});
const { normalizeName, isValidName } = await import('../../src/lib/lead-checks.ts');
const { nameField } = await import('../../src/lib/lead-validation.ts');
const { rules, validateLead } = await import('../../src/lib/lead-form-rules.ts');

const saved = (raw) => {
  const r = nameField.safeParse(raw);
  return r.success ? r.data : null;
};

test('real-name punctuation is kept exactly', () => {
  for (const n of ['Mary-Jane', "D'Souza", 'D’Souza', 'K. Ramesh', 'Anne-Marie O’Brien', 'రవి కుమార్', 'Ravi Kumar']) {
    assert.equal(saved(n), n, n);
  }
});

test('dash look-alikes become "-" and the dash is kept, not removed', () => {
  assert.equal(saved('TEST Subodh – ignore'), 'TEST Subodh - ignore');
  assert.equal(saved('TEST Subodh — ignore'), 'TEST Subodh - ignore');
  assert.equal(saved('Mary‑Jane'), 'Mary-Jane'); // U+2011 non-breaking hyphen
  assert.equal(saved('Mary–Jane'), 'Mary-Jane');
});

test('runs of spaces, tabs and non-breaking spaces collapse; the ends are trimmed', () => {
  assert.equal(saved('TEST Subodh  ignore'), 'TEST Subodh ignore');
  assert.equal(saved('  Ravi   Kumar  '), 'Ravi Kumar');
  assert.equal(saved('Ravi\u00A0\u00A0Kumar'), 'Ravi Kumar');
  assert.equal(saved('Ravi\tKumar'), 'Ravi Kumar');
});

test('curly single quotes: ‘ and ʼ become "\'", ’ is kept as typed', () => {
  assert.equal(saved('D‘Souza'), "D'Souza");
  assert.equal(saved('DʼSouza'), "D'Souza");
  assert.equal(saved('D’Souza'), 'D’Souza');
});

test('still rejected: digits, symbols, no letters, too short or too long', () => {
  for (const n of ['Ravi123', 'a@b.com', '...', '--', 'R', '', ' ', 'A'.repeat(61), 'Ravi_Kumar']) {
    assert.equal(saved(n), null, JSON.stringify(n));
  }
});

test('browser rules give the same verdict and the same saved value as the server', () => {
  for (const n of ['TEST Subodh – ignore', 'Mary-Jane', 'K. Ramesh', 'Ravi123', '...', 'Ravi   Kumar']) {
    assert.equal(rules.name()(n) === null, saved(n) !== null, n);
    assert.equal(isValidName(n), saved(n) !== null, n);
  }
  const { values } = validateLead({ name: [rules.name()] }, { name: 'TEST Subodh – ignore' });
  assert.equal(values.name, saved('TEST Subodh – ignore'));
  assert.equal(normalizeName('A  –  B'), 'A - B');
});
