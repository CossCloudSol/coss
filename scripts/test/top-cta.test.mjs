// Run with: npm test. Organic-to-lead quick wins (25 Oct): the top-of-page CTA row on the top 10
// organic landing pages, the branch pages' search titles, and the PageSeo title SQL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => fs.readFileSync(f, 'utf8');
const BANNED = /(placement|placed|guarant|[0-9]+ ?%|lakh|lpa|\bbest\b|\btop\b|#1|number one)/i;

test('TopCta: server-rendered, tagged demo + WhatsApp + course link', () => {
  const s = read('src/components/TopCta.tsx');
  assert.doesNotMatch(s, /^['"]use client['"]/m, 'no client JS of its own');
  assert.match(s, /export const TOP_CTA_LOCATION = 'page_top_cta'/);
  assert.match(s, /data-cta="book_demo"\s+data-loc=\{TOP_CTA_LOCATION\}/);
  assert.match(s, />\s*Book a free demo\s*</);
  assert.match(s, /<WhatsAppLink[\s\S]*?ctaId="page_top_whatsapp"[\s\S]*?location=\{TOP_CTA_LOCATION\}/);
  assert.match(s, /data-cta="top_course_link"\s+data-loc=\{TOP_CTA_LOCATION\}/);
});

test('the top 10 organic landing pages (GA4, 28 days to 24 Oct) render TopCta under the H1', () => {
  const placements = {
    '/': 'src/components/home/v4/Hero.tsx',
    '/locations/dilsukhnagar': 'src/app/locations/[locality]/page.tsx',
    '/courses': 'src/app/courses/page.tsx',
    '/student-reviews': 'src/app/student-reviews/page.tsx',
    '/about-us': 'src/app/about-us/page.tsx',
    '/courses/<category>/<course> (AI Foundation, Kubernetes & Docker)': 'src/app/courses/[slug]/[courseSlug]/page.tsx',
    '/batches': 'src/app/batches/page.tsx',
    '/courses/cloud-computing': 'src/components/CourseCategoryPage.tsx',
    '/courses/human-resource': 'src/app/courses/[slug]/page.tsx',
  };
  for (const [page, file] of Object.entries(placements)) {
    assert.match(read(file), /<TopCta\b/, `${page}: ${file} has no <TopCta>`);
  }
  // /courses passes the row into the client explorer as a server-rendered slot, shown after the H1
  const explorer = read('src/components/courses/CoursesExplorer.tsx');
  assert.match(explorer, /IT Courses in Hyderabad<\/h1>\s*\{topCta\}/);
  assert.doesNotMatch(explorer, /import TopCta/, 'TopCta stays out of the client bundle');
  // banner slots render right after the H1
  const shared = read('src/components/shared.tsx');
  assert.match(shared, /<h1 className="page-banner-title">\{title\}<\/h1>\s*\{afterTitle\}/);
  assert.match(shared, /<\/h1>\s*\{afterTitle\}\s*<p className="hero-banner-sub">/);
  // the homepage demo goes to the hero form; course pages carry the course
  assert.match(read('src/components/home/v4/Hero.tsx'), /<TopCta[^>]*demoHref="#enroll-form"/);
  assert.match(read('src/app/courses/[slug]/[courseSlug]/page.tsx'), /demoHref=\{`\/free-demo-class\?course=\$\{course\.slug\}`\}/);
});

test('branch pages: search title <= 60 before the brand suffix, description <= 155, allowed claims only', () => {
  const s = read('src/lib/locations-data.ts');
  for (const name of ['Dilsukhnagar', 'Ameerpet']) {
    const block = s.slice(s.indexOf(`slug: '${name.toLowerCase()}'`));
    const title = block.match(/metaTitle: '([^']+)'/)[1];
    const descr = block.match(/metaDescription:\s*'([^']+)'/)[1];
    assert.ok(title.length <= 60, `${name} title ${title.length}`);
    assert.ok(descr.length <= 155, `${name} description ${descr.length}`);
    assert.match(title, new RegExp(name));
    assert.match(title, /Free Demo/);
    assert.doesNotMatch(`${title} ${descr}`, BANNED);
    assert.doesNotMatch(title, /Coss/i, 'the brand suffix is added by buildTitle');
  }
});

/** The (slug, title, description) triples in a SQL file's VALUES / IN list. */
function triples(sql) {
  return [...sql.matchAll(/\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g)].map((m) => m.slice(1, 4));
}

test('PageSeo title SQL: 5 rows, guarded, limits, claims, rollback matches', () => {
  const change = read('prisma/migrations/manual/2026-10-25-pageseo-organic-titles.sql');
  const rollback = read('prisma/migrations/manual/2026-10-25-pageseo-organic-titles-rollback.sql');
  const set = triples(change.slice(change.indexOf('UPDATE "PageSeo"'), change.indexOf('GET DIAGNOSTICS')));
  const check = triples(change.slice(change.indexOf('JOIN coss_backup')));
  assert.equal(set.length, 5);
  assert.deepEqual(check, set, 'the post-update check lists exactly the values set');
  assert.deepEqual(triples(rollback), set, 'the rollback guard expects exactly the values set');
  assert.deepEqual(set.map((t) => t[0]).sort(), [
    'about', 'blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad', 'contact', 'courses', 'student-reviews',
  ]);
  for (const [slug, title, descr] of set) {
    assert.ok(title.length <= 60, `${slug} title ${title.length}`);
    assert.ok(descr.length <= 155, `${slug} description ${descr.length}`);
    assert.doesNotMatch(`${title} ${descr}`, BANNED, slug);
    assert.doesNotMatch(title, /Coss/i, `${slug}: the brand suffix is added by buildTitle`);
  }
  // single run, backup first, one transaction, branch-page override guard
  assert.match(change, /BEGIN;[\s\S]*CREATE TABLE coss_backup\.pageseo_organic_titles_20261025[\s\S]*UPDATE "PageSeo"[\s\S]*COMMIT;/);
  assert.match(change, /'locations\/ameerpet', 'locations\/dilsukhnagar'[\s\S]*RAISE EXCEPTION '% branch-page PageSeo row/);
  assert.match(change, /IF cnt <> 5 THEN RAISE EXCEPTION 'expected 5 rows updated/);
  assert.doesNotMatch(rollback, /CREATE TABLE/);
});
