// Run with: npm test. One source for name, address and phone (item 8): src/lib/nap.ts,
// src/lib/opening-hours.ts, and no stray copies left in src/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { BRAND_NAME, PRIMARY_PHONE, PRIMARY_PHONE_LABEL, formatIndianPhone } from '../../src/lib/nap.ts';
import { groupPeriods, openingHoursSpecification, periodsFromSettings, to12h } from '../../src/lib/opening-hours.ts';

const grep = (pattern) => {
  try {
    return execFileSync('git', ['grep', '-n', '-E', pattern, '--', 'src'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return []; // git grep exits 1 when nothing matches
  }
};

test('the main number: one copy in src/lib/nap.ts, label and E.164 agree', () => {
  assert.equal(BRAND_NAME, 'Coss Cloud Solutions');
  assert.equal(formatIndianPhone(PRIMARY_PHONE), PRIMARY_PHONE_LABEL);
  assert.deepEqual(grep('88851[ -]?66007|8885166007').filter((l) => !l.startsWith('src/lib/nap.ts:')), []);
});

test('the retired second number appears nowhere in src/', () => {
  assert.deepEqual(grep('77807[ -]?27374|7780727374'), []);
});

test('brand spelling: no "COSS Cloud Solutions" outside the brand-matching regexes and comments', () => {
  const allowed = /^src\/(lib\/build-title\.ts|scripts\/force-update-seo\.ts|lib\/generate-thumbnail\.ts):/;
  assert.deepEqual(grep('COSS Cloud Solutions|COSS CLOUD SOLUTIONS').filter((l) => !allowed.test(l)), []);
});

test('formatIndianPhone', () => {
  assert.equal(formatIndianPhone('+917013123456'), '+91 70131 23456');
  assert.equal(formatIndianPhone('07013 123 456'.replace(/^0/, '')), '+91 70131 23456');
  assert.equal(formatIndianPhone(' 040-2345 6789 '), '040-2345 6789');
});

test('periodsFromSettings: ranges, lists, wrap-around, bad input', () => {
  assert.deepEqual(periodsFromSettings('Monday-Sunday', '07:00', '21:00').map((p) => p.day), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.deepEqual(periodsFromSettings('Mon–Sat', '09:00', '19:00').map((p) => p.day), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  assert.deepEqual(periodsFromSettings('Mon, Wed & Fri', '09:00', '13:00').map((p) => p.day), ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(periodsFromSettings('Sat-Mon', '10:00', '14:00').map((p) => p.day), ['Monday', 'Saturday', 'Sunday']);
  assert.deepEqual(periodsFromSettings('Weekdays', '09:00', '19:00'), []);
  assert.deepEqual(periodsFromSettings('Monday-Sunday', '9am', '19:00'), []);
});

test('groupPeriods: consecutive days with the same hours, closed days, split days', () => {
  assert.equal(to12h('07:00'), '7:00 AM');
  assert.equal(to12h('12:30'), '12:30 PM');
  assert.equal(to12h('00:00'), '12:00 AM');
  assert.equal(to12h('21:00'), '9:00 PM');
  assert.deepEqual(groupPeriods(periodsFromSettings('Monday-Sunday', '07:00', '21:00')), [{ days: 'Mon–Sun', time: '7:00 AM – 9:00 PM' }]);
  const mixed = [
    ...periodsFromSettings('Mon-Fri', '09:00', '19:00'),
    { day: 'Saturday', opens: '09:00', closes: '13:00' },
    { day: 'Saturday', opens: '14:00', closes: '18:00' },
  ];
  assert.deepEqual(groupPeriods(mixed), [
    { days: 'Mon–Fri', time: '9:00 AM – 7:00 PM' },
    { days: 'Sat', time: '9:00 AM – 1:00 PM, 2:00 PM – 6:00 PM' },
    { days: 'Sun', time: 'Closed' },
  ]);
  assert.deepEqual(groupPeriods([]), []);
});

test('openingHoursSpecification: one entry per distinct span', () => {
  const spec = openingHoursSpecification([
    ...periodsFromSettings('Mon-Fri', '09:00', '19:00'),
    { day: 'Saturday', opens: '10:00', closes: '14:00' },
  ]);
  assert.deepEqual(spec, [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '19:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '14:00' },
  ]);
});
