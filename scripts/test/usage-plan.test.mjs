// Run with: npm test. Usage plan (10 Oct 2026, after the Hobby limits paused the site):
// scanner probes get a cheap 404, /tag/* goes to /blog, long-lived pages are revalidated on demand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp/index.js';
import { isScannerPath } from '../../src/lib/scanner-paths.ts';
import { pageSeoSlugToPaths } from '../../src/lib/page-seo-rules.ts';

const SCANNERS = [
  '/wp-login.php', '/wp-admin/admin-ajax.php', '/wp-content/plugins/x/readme.txt', '/xmlrpc.php', '/.env', '/.env.local',
  '/.git/config', '/cgi-bin/test.cgi', '/phpmyadmin/index.php', '/WebInterface/login.html', '/telescope', '/telescope/requests',
  '/Telerik.Web.UI.WebResource.axd', '/index.php', '/blog/old.php', '/vendor/phpunit/x', '/actuator/health', '/login.aspx', '/a/b/c.jsp',
];
const REAL = [
  '/', '/courses', '/blog', '/blog/master-aws-devops-in-hyderabad', '/about-us', '/contact-us', '/admin/login', '/api/leads',
  '/aws-devops-training-institute-in-hyderabad', '/sitemap.xml', '/robots.txt', '/llms.txt', '/manifest.webmanifest', '/favicon.ico',
  '/locations/kukatpally', '/courses/cloud-computing/aws-cloud-training-in-hyderabad', '/graphp', '/vendors', '/telescopes-training',
];

test('isScannerPath: scanners yes, real pages no', () => {
  for (const p of SCANNERS) assert.equal(isScannerPath(p), true, p);
  for (const p of REAL) assert.equal(isScannerPath(p), false, p);
});

test('middleware matcher lists every scanner path, and no real page', () => {
  const src = fs.readFileSync('src/middleware.ts', 'utf8');
  const block = src.slice(src.indexOf('matcher: ['), src.indexOf('],', src.indexOf('matcher: [')));
  const patterns = [...block.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\\\/g, '\\'));
  assert.ok(patterns.length >= 25, `found ${patterns.length} matcher entries`);
  // Next wraps every matcher like this before compiling it (a bare `:ext` or `?` can break under the wrapper)
  const res = patterns.map((p) => pathToRegexp(`/:nextData(_next/data/[^/]{1,})?${p}(.json)?`));
  const matches = (path) => res.some((re) => re.test(path));
  for (const p of SCANNERS) assert.ok(matches(p), `matcher misses ${p}`);
  for (const p of ['/', '/aws-devops-training-institute-in-hyderabad', '/sitemap.xml', '/graphp', '/blog/master-aws-devops-in-hyderabad']) assert.equal(matches(p), false, `matcher catches real ${p}`);
  assert.match(src, /if \(isScannerPath\(pathname\)\)[\s\S]{0,200}status: 404/);
});

test('/tag/* redirects to /blog in all three places the infra rules live', () => {
  for (const f of ['redirects.config.mjs', 'scripts/run-sync-redirects.mjs', 'src/lib/sync-redirects.ts']) {
    assert.match(fs.readFileSync(f, 'utf8'), /source: '\/tag\/:path\*',\s+destination: '\/blog'/, f);
  }
});

test('smoke script keeps the sitemap size check and the --quick mode', () => {
  const s = fs.readFileSync('scripts/smoke.mjs', 'utf8');
  assert.match(s, /const MIN_SITEMAP_URLS = 200;/);
  assert.match(s, /sitemapPaths\.length < MIN_SITEMAP_URLS/);
  assert.match(s, /args\.indexOf\('--quick'\)/);
  assert.match(s, /^const routes = JSON\.parse\(readFileSync\(join\(__dirname, 'routes\.json'\)/m, 'default mode still walks routes.json (/verify-prod)');
});

test('touchLabel: first → last touch for the admin leads table and CSV', async () => {
  const { touchLabel } = await import('../../src/lib/touch-label.ts');
  assert.equal(touchLabel(null, null), 'direct');
  assert.equal(touchLabel('google', null), 'google'); // lead from before the attribution release
  assert.equal(touchLabel('google', ''), 'google');
  assert.equal(touchLabel(null, 'test'), 'direct → test');
  assert.equal(touchLabel('google', 'Google'), 'google'); // same source once
  assert.equal(touchLabel('chatgpt.com', 'facebook'), 'chatgpt.com → facebook');
  const table = fs.readFileSync('src/components/admin/LeadsTable.tsx', 'utf8');
  assert.equal((table.match(/touchLabel\(lead\.utmSource, lead\.lastUtmSource\)/g) || []).length, 2, 'table row + mobile card');
  assert.match(table, /'First → Last Touch'/);
  assert.match(fs.readFileSync('src/app/api/admin/leads/route.ts', 'utf8'), /lastUtmSource: lead\.lastUtmSource/);
});

test('pageSeoSlugToPaths: PageSeo slug → public path', () => {
  assert.deepEqual(pageSeoSlugToPaths('home'), ['/']);
  assert.deepEqual(pageSeoSlugToPaths(''), ['/']);
  assert.deepEqual(pageSeoSlugToPaths('about'), ['/about-us']);
  assert.deepEqual(pageSeoSlugToPaths('contact'), ['/contact-us']);
  assert.deepEqual(pageSeoSlugToPaths('/privacy-policy/'), ['/privacy-policy']);
  assert.deepEqual(pageSeoSlugToPaths('blog/master-aws-devops-in-hyderabad'), ['/blog/master-aws-devops-in-hyderabad']);
  assert.deepEqual(pageSeoSlugToPaths('courses/cloud-computing/aws'), ['/courses/cloud-computing/aws']);
  assert.deepEqual(pageSeoSlugToPaths('blog/[slug]'), []);
});

test('7-day pages: every admin save that feeds them revalidates on demand', () => {
  const week = [
    'src/app/blog/[slug]/page.tsx', 'src/app/blog/page.tsx', 'src/app/blog/filter/[category]/[page]/page.tsx',
    'src/app/locations/page.tsx', 'src/app/locations/[locality]/page.tsx', 'src/app/locations/[locality]/[topic]/page.tsx',
    'src/app/about-us/page.tsx', 'src/app/certification/page.tsx', 'src/app/contact-us/page.tsx', 'src/app/corporate-training/page.tsx',
    'src/app/enroll-now-with-coss/page.tsx', 'src/app/faculty/page.tsx', 'src/app/free-demo-class/page.tsx', 'src/app/placements/page.tsx',
    'src/app/privacy-policy/page.tsx', 'src/app/refund-cancellation-policy/page.tsx', 'src/app/student-reviews/page.tsx',
    'src/app/terms-conditions/page.tsx', 'src/app/why-us/page.tsx',
  ];
  for (const f of week) assert.match(fs.readFileSync(f, 'utf8'), /^export const revalidate = 604800;/m, f);
  // the saves that used to rely on the 24 h timer
  const mustRevalidate = {
    'seo/pages/route.ts': 'getPageSeoRevalidationPaths', 'seo/pages/[slug]/route.ts': 'getPageSeoRevalidationPaths', 'seo/pages/[...slug]/route.ts': 'getPageSeoRevalidationPaths',
    'schema/pages/[slug]/route.ts': 'getPageSeoRevalidationPaths', 'sitemap/pages/[slug]/route.ts': 'SITEMAP_PATH',
    'testimonials/route.ts': 'getTestimonialRevalidationPaths', 'testimonials/[id]/route.ts': 'getTestimonialRevalidationPaths', 'testimonials/bulk-import/route.ts': 'getTestimonialRevalidationPaths',
    'hiring-partners/route.ts': 'getHiringPartnerRevalidationPaths', 'hiring-partners/[id]/route.ts': 'getHiringPartnerRevalidationPaths', 'hiring-partners/reorder/route.ts': 'getHiringPartnerRevalidationPaths',
    'trainers/reorder/route.ts': 'getTrainerRevalidationPaths',
  };
  for (const [f, fn] of Object.entries(mustRevalidate)) {
    const s = fs.readFileSync(`src/app/api/admin/${f}`, 'utf8');
    assert.match(s, new RegExp(`revalidatePaths\\([^)]*${fn}`), f);
  }
});
