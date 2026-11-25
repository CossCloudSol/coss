// Run with: npm test. Weekly tracking report: IST week windows, the numbers, the CSV and email, the cron, /brochure/[code].
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
const r = await import('../../src/lib/weekly-report.ts');
const cfg = await import('../../src/lib/report-config.ts');
const read = (f) => fs.readFileSync(f, 'utf8');
const at = (iso) => new Date(iso);

test('weeks: the last full Monday-Sunday in IST and the week before', () => {
  // Wednesday 25 Nov 2026, 10:00 IST
  const { current, previous } = r.reportWeeks(at('2026-11-25T04:30:00Z'));
  assert.equal(current.from, '2026-11-16');
  assert.equal(current.to, '2026-11-22');
  assert.equal(previous.from, '2026-11-09');
  assert.equal(previous.to, '2026-11-15');
  assert.equal(current.start.toISOString(), '2026-11-15T18:30:00.000Z'); // 00:00 IST Monday
  // Monday 09:00 IST (03:30 UTC), when the email goes: the week that just ended
  const mon = r.reportWeeks(at('2026-11-30T03:30:00Z'));
  assert.equal(mon.current.from, '2026-11-23');
  assert.equal(mon.current.to, '2026-11-29');
  // Sunday 23:30 IST is still inside the week that has not ended yet, so the report is the one before
  const sun = r.reportWeeks(at('2026-11-29T18:00:00Z'));
  assert.equal(sun.current.from, '2026-11-16');
});

const d = (iso) => at(iso);
const input = {
  leads: [
    { createdAt: d('2026-11-17T05:00:00Z'), utmSource: 'google', utmMedium: 'cpc' },
    { createdAt: d('2026-11-18T05:00:00Z'), referrer: 'https://chatgpt.com/' },
    { createdAt: d('2026-11-19T05:00:00Z'), referrer: 'https://cosscloudsol.com/about' },
    { createdAt: d('2026-11-10T05:00:00Z'), referrer: 'https://www.google.com/' },
    { createdAt: d('2026-11-30T05:00:00Z') },
  ],
  corporate: [{ createdAt: d('2026-11-20T05:00:00Z') }, { createdAt: d('2026-11-11T05:00:00Z') }],
  whatsapp: [
    { createdAt: d('2026-11-17T05:00:00Z'), referrer: 'https://www.google.com/', courseSlug: 'aws-devops' },
    { createdAt: d('2026-11-17T06:00:00Z'), referrer: 'https://claude.ai/', courseSlug: 'aws-devops' },
    { createdAt: d('2026-11-21T06:00:00Z'), utmMedium: 'cpc', courseSlug: 'data-science' },
    { createdAt: d('2026-11-12T06:00:00Z') },
  ],
  calls: [{ createdAt: d('2026-11-18T07:00:00Z'), courseSlug: 'data-science' }, { createdAt: d('2026-11-12T07:00:00Z') }],
  cta: [
    { createdAt: d('2026-11-17T08:00:00Z'), kind: 'demo', courseSlug: 'aws-devops' },
    { createdAt: d('2026-11-18T08:00:00Z'), kind: 'demo' },
    { createdAt: d('2026-11-19T08:00:00Z'), kind: 'syllabus' },
    { createdAt: d('2026-11-19T09:00:00Z'), kind: 'brochure_download' },
    { createdAt: d('2026-11-13T09:00:00Z'), kind: 'demo' },
  ],
};

test('numbers: this week against the week before, by channel, with AI-assistant counts', () => {
  const rep = r.buildWeeklyReport(input, at('2026-11-25T04:30:00Z'));
  assert.equal(rep.now.leads, 3);
  assert.equal(rep.before.leads, 1);
  assert.equal(rep.now.corporate, 1);
  assert.equal(rep.now.whatsapp, 3);
  assert.deepEqual(rep.now.whatsappByChannel, { G: 1, A: 1, P: 1, S: 0, R: 0, D: 0 });
  assert.equal(rep.before.whatsappByChannel.D, 1);
  assert.equal(rep.now.calls, 1);
  assert.equal(rep.now.demoClicks, 2);
  assert.equal(rep.now.syllabusClicks, 2);
  assert.equal(rep.before.demoClicks, 1);
  assert.equal(rep.now.aiLeads, 1);
  assert.equal(rep.now.aiWhatsapp, 1);
  // our own site as referrer counts as direct, not as another site
  assert.equal(rep.now.leads - rep.now.aiLeads, 2);
  assert.deepEqual(rep.now.topCourses, [{ courseSlug: 'aws-devops', clicks: 3 }, { courseSlug: 'data-science', clicks: 2 }]);
});

test('CSV and email: same numbers, counts only, link to the admin page', () => {
  const rep = r.buildWeeklyReport(input, at('2026-11-25T04:30:00Z'));
  const csv = r.weeklyCsv(rep);
  assert.match(csv, /^"?Metric"?,"?This week \(2026-11-16 to 2026-11-22\)"?,"?Previous week \(2026-11-09 to 2026-11-15\)"?,"?Change/);
  assert.match(csv, /"?Leads \(spam excluded\)"?,"?3"?,"?1"?,"?2"?"??$/m);
  assert.match(csv, /"?aws-devops"?,"?3"?,"?0"?/);
  assert.match(csv, /"?Direct \(D\)"?,"?0"?,"?1"?,"?-1"?"??$/m);
  const html = r.weeklyEmailHtml(rep);
  assert.match(html, /https:\/\/www\.cosscloudsol\.com\/admin\/tracking\/weekly/);
  assert.match(html, /Week of 2026-11-16 to 2026-11-22/);
  assert.match(html, />Leads \(spam excluded\)</);
  assert.doesNotMatch(html + csv, /phone|email address|@gmail/i);
  assert.equal(r.changeText(5, 5), 'no change');
  assert.equal(r.changeText(0, 0), 'no change');
  assert.equal(r.changeText(1, 0), '+1');
  assert.equal(r.changeText(3, 4), '-1 (-25%)');
});

test('cron: Monday 09:00 IST, CRON_SECRET, recipient from the config file, vercel.json in step', () => {
  assert.equal(cfg.WEEKLY_REPORT_CRON, '30 3 * * 1');
  const vercel = JSON.parse(read('vercel.json'));
  assert.ok(vercel.crons.some((c) => c.path === '/api/cron/weekly-report' && c.schedule === cfg.WEEKLY_REPORT_CRON));
  const route = read('src/app/api/cron/weekly-report/route.ts');
  assert.match(route, /isAuthorizedCron\(req\.headers\.get\('authorization'\)\)/);
  assert.match(route, /WEEKLY_REPORT_RECIPIENTS/);
  assert.doesNotMatch(route, /@gmail\.com/);
  assert.deepEqual([...cfg.WEEKLY_REPORT_RECIPIENTS], ['cossdsnrcoss@gmail.com']);
});

test('/brochure/[code]: code map from wa-ref, 302, 404, noindex, not in the sitemap', () => {
  const route = read('src/app/brochure/[code]/route.ts');
  assert.match(route, /refCourseByCode\(/);
  assert.match(route, /status: 302/);
  assert.match(route, /status: 404/);
  assert.match(route, /X-Robots-Tag': 'noindex/);
  assert.match(route, /brochureUrl/);
  assert.doesNotMatch(read('src/app/sitemap.ts'), /brochure\//);
});

test('weekly page: read-only, printable, behind analytics:view', () => {
  const access = read('src/lib/admin-access.ts');
  assert.match(access, /\['\/admin\/tracking',\s+'analytics:view'\]/);
  const page = read('src/app/admin/tracking/weekly/page.tsx');
  assert.match(page, /@media print/);
  assert.doesNotMatch(page + read('src/lib/weekly-report-data.ts'), /\.(create|update|delete|upsert)(Many)?\(/);
});

test('WhatsApp channels: the ref code a click carries wins, older clicks are classified from UTM and referrer', () => {
  const none = { leads: [], corporate: [], calls: [], cta: [] };
  const rows = [
    // paid by gclid only: the browser wrote the P, the row has no utm and no referrer
    { createdAt: d('2026-11-17T05:00:00Z'), refCode: 'W-DS-P' },
    // the code says AI assistant even though the row's referrer is Google: the code is what the chat opened with
    { createdAt: d('2026-11-17T06:00:00Z'), refCode: 'W-GEN-A', referrer: 'https://www.google.com/' },
    // a stored code that is not a real one is ignored: back to the referrer
    { createdAt: d('2026-11-18T05:00:00Z'), refCode: 'not a code', referrer: 'https://www.google.com/' },
    // a click from before codes were stored: UTM and referrer as before
    { createdAt: d('2026-11-19T05:00:00Z'), utmMedium: 'cpc' },
    { createdAt: d('2026-11-19T06:00:00Z'), refCode: null },
    // the week before
    { createdAt: d('2026-11-10T05:00:00Z'), refCode: 'W-AWSDEVOPS-S' },
  ];
  const rep = r.buildWeeklyReport({ ...none, whatsapp: rows }, at('2026-11-25T04:30:00Z'));
  assert.deepEqual(rep.now.whatsappByChannel, { G: 1, A: 1, P: 2, S: 0, R: 0, D: 1 });
  assert.equal(rep.now.whatsapp, 5);
  assert.equal(rep.now.aiWhatsapp, 1);
  assert.deepEqual(rep.before.whatsappByChannel, { G: 0, A: 0, P: 0, S: 1, R: 0, D: 0 });
  // the report says where the channel comes from, and the loader reads the column
  assert.match(r.AI_NOTE, /ref code/);
  assert.match(read('src/lib/weekly-report-data.ts'), /whatsAppClick\.findMany\([^)]*refCode: true/);
});
