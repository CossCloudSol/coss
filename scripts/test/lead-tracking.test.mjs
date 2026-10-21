// Run with: npm test. Lead tracking fixes: admin days in IST, bot-check submissions
// quarantined as spam (and left out of every admin count), the honeypot rename, and the
// lead_submit_error kinds.
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
const ist = await import('../../src/lib/ist-date.ts');
const { botCheck, HONEYPOT_FIELD, LEGACY_HONEYPOT_FIELD, LEGACY_HONEYPOT_ACCEPTED_UNTIL, MIN_FILL_MS } = await import('../../src/lib/lead-validation.ts');

/** An IST wall-clock time as a Date. */
const at = (s) => new Date(`${s}+05:30`);

test('a lead at 00:30 IST lands on that IST day, not the UTC day before', () => {
  const d = at('2026-10-21T00:30:00'); // 2026-10-20 19:00 UTC
  assert.equal(d.toISOString().slice(0, 10), '2026-10-20');
  assert.equal(ist.istDateKey(d), '2026-10-21');
  assert.equal(ist.startOfDayIST(d).toISOString(), at('2026-10-21T00:00:00').toISOString());
  assert.ok(d >= ist.startOfTodayIST(at('2026-10-21T12:00:00')), 'counts in "today"');
});

test('a lead at 23:50 IST stays on that IST day and is not in the next day', () => {
  const d = at('2026-10-21T23:50:00'); // 18:20 UTC, same UTC date
  assert.equal(ist.istDateKey(d), '2026-10-21');
  const nextDay = ist.startOfTodayIST(at('2026-10-22T09:00:00'));
  assert.ok(d < nextDay, 'not counted in the next day');
  assert.ok(d >= ist.startOfTodayIST(at('2026-10-21T23:59:00')));
});

test('the month starts at 00:00 IST on the 1st', () => {
  const start = ist.startOfMonthIST(at('2026-11-15T10:00:00'));
  assert.equal(start.toISOString(), '2026-10-31T18:30:00.000Z');
  assert.equal(start.getTime(), at('2026-11-01T00:00:00').getTime());
  // 00:10 IST on the 1st is in the new month even though it is still the 31st in UTC.
  assert.equal(ist.startOfMonthIST(at('2026-11-01T00:10:00')).getTime(), start.getTime());
  assert.equal(ist.istMonthKey(at('2026-11-01T00:10:00')), '2026-11');
  assert.equal(ist.startOfMonthIST(at('2026-01-20T10:00:00'), 1).getTime(), at('2025-12-01T00:00:00').getTime());
});

test('7- and 30-day windows start at 00:00 IST, today inclusive', () => {
  const now = at('2026-10-21T08:00:00');
  assert.equal(ist.daysBeforeIST(now, 6).getTime(), at('2026-10-15T00:00:00').getTime());
  assert.equal(ist.daysBeforeIST(now, 29).getTime(), at('2026-09-22T00:00:00').getTime());
  assert.equal(ist.istWeekKey(at('2026-10-19T00:30:00')), '2026-W43'); // Monday 00:30 IST
  assert.equal(ist.istWeekKey(at('2026-10-18T23:30:00')), '2026-W42'); // Sunday
});

test('starting-soon uses the shared IST helper', () => {
  const s = fs.readFileSync('src/lib/starting-soon.ts', 'utf8');
  assert.match(s, /import \{ startOfTodayIST \} from '@\/lib\/ist-date'/);
  assert.doesNotMatch(s, /function startOfTodayIST/);
});

test('admin date code no longer uses the server clock\'s local day', () => {
  const files = [
    'src/lib/admin-stats.ts',
    'src/app/api/admin/analytics/route.ts',
    'src/app/api/admin/call-clicks/route.ts',
    'src/app/api/admin/whatsapp-clicks/route.ts',
    'src/app/api/admin/whatsapp/route.ts',
    'src/app/admin/corporate/page.tsx',
    'src/app/admin/analytics/page.tsx',
  ];
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /\.getFullYear\(\)|\.getDate\(\)|\.setDate\(|\.getMonth\(\)/, f);
  }
});

const HUMAN = { name: 'Ravi', phone: '9876543210', fillMs: 5000 };
const BEFORE = LEGACY_HONEYPOT_ACCEPTED_UNTIL - 1;
const AFTER = LEGACY_HONEYPOT_ACCEPTED_UNTIL + 1;

test('honeypot renamed to hp_extra; the old name counts only until the cut-off', () => {
  assert.equal(HONEYPOT_FIELD, 'hp_extra');
  assert.equal(LEGACY_HONEYPOT_FIELD, 'website');
  assert.equal(LEGACY_HONEYPOT_ACCEPTED_UNTIL, Date.parse('2026-10-29T00:00:00+05:30'));
  assert.deepEqual(botCheck({ ...HUMAN, hp_extra: 'x' }, MIN_FILL_MS, AFTER), { verdict: 'bot', reason: 'honeypot' });
  assert.deepEqual(botCheck({ ...HUMAN, website: 'x' }, MIN_FILL_MS, BEFORE), { verdict: 'bot', reason: 'honeypot' });
  assert.deepEqual(botCheck({ ...HUMAN, website: 'x' }, MIN_FILL_MS, AFTER), { verdict: 'human' });
  assert.deepEqual(botCheck({ ...HUMAN, hp_extra: '  ', website: '' }, MIN_FILL_MS, BEFORE), { verdict: 'human' });
  assert.deepEqual(botCheck({ ...HUMAN, fillMs: 100 }, MIN_FILL_MS, AFTER), { verdict: 'bot', reason: 'too_fast' });
  assert.equal(MIN_FILL_MS, 3000);
  const label = fs.readFileSync('src/components/HoneypotField.tsx', 'utf8');
  assert.match(label, /Leave this field empty/);
});

test('bot verdicts that pass validation are saved as spam with the real id; no notification', () => {
  for (const f of ['src/app/api/leads/route.ts', 'src/app/api/contact/route.ts', 'src/app/api/corporate-leads/route.ts']) {
    const s = fs.readFileSync(f, 'utf8');
    assert.match(s, /status: bot\.verdict === 'bot' \? SPAM_STATUS : 'new'/, `${f}: spam status`);
    assert.doesNotMatch(s, /Dropped bot submission/, `${f}: still drops valid bot bodies`);
    // The spam branch returns before the notification block.
    const spamReturn = s.indexOf("return NextResponse.json({ success: true, id: created.id }, { status: 201 });");
    assert.ok(spamReturn > 0 && spamReturn < s.indexOf('createNotification({'), `${f}: notification before spam return`);
    // Every 201 carries an id.
    for (const m of s.matchAll(/NextResponse\.json\(([^;]*?)\{ status: 201 \}/gs)) assert.match(m[1], /id:/, `${f}: 201 without id`);
  }
  const leads = fs.readFileSync('src/app/api/leads/route.ts', 'utf8');
  assert.match(leads, /action: 'spam_quarantined', note: `Held as spam \(\$\{bot\.reason\}\)/);
});

test('spam is left out of every admin lead count, chart and default list', () => {
  const files = [
    'src/lib/admin-stats.ts',
    'src/app/api/admin/analytics/route.ts',
    'src/app/api/admin/call-clicks/route.ts',
    'src/app/api/admin/whatsapp-clicks/route.ts',
    'src/app/api/admin/whatsapp/route.ts',
  ];
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/prisma\.(lead|corporateLead)\.(count|groupBy|findMany)\(([^;]*?)\)(,|;)\n/gs)) {
      const call = m[3];
      // Exempt: counts already pinned to a staff status, and look-ups by id.
      if (/status: 'enrolled'|id: \{ in:/.test(call)) continue;
      assert.match(call, /NOT_SPAM/, `${f}: ${m[0].slice(0, 90)}`);
    }
  }
  const list = fs.readFileSync('src/app/api/admin/leads/route.ts', 'utf8');
  assert.match(list, /where\.status = \{ not: SPAM_STATUS \}/);
  const corp = fs.readFileSync('src/app/api/admin/corporate/route.ts', 'utf8');
  assert.match(corp, /status: spamOnly \? SPAM_STATUS : \{ not: SPAM_STATUS \}/);
});

test('lead_submit_error kinds', async () => {
  const src = fs.readFileSync('src/lib/submitLead.ts', 'utf8');
  // submitLead.ts imports browser-only modules; check the mapping function on its own.
  const fn = src.match(/export function leadErrorKind[\s\S]*?\n}\n/)[0].replace(/export |: number|: LeadErrorKind/g, '');
  const leadErrorKind = new Function(`${fn}; return leadErrorKind;`)();
  assert.equal(leadErrorKind(429), 'rate_limit');
  assert.equal(leadErrorKind(422), 'validation');
  assert.equal(leadErrorKind(400), 'validation');
  assert.equal(leadErrorKind(500), 'server');
  assert.equal(leadErrorKind(502), 'server');
  assert.match(src, /'lead_submit_error'/);
  for (const f of ['src/components/ContactForm.tsx', 'src/components/CorporateForm.tsx']) {
    const s = fs.readFileSync(f, 'utf8');
    assert.match(s, /trackLeadSubmitError\(\{ formType: '(contact|corporate)', errorKind: 'network'/, `${f}: network error`);
    assert.doesNotMatch(s, /leadId: ''/, `${f}: still sends an empty lead id`);
  }
});
