// Run with: npm test. Page metadata rules (item 13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PAGE_SLUG_PATHS, pickOgImage } from '../../src/lib/page-seo-rules.ts';

const DEF = 'https://www.cosscloudsol.com/og-image.jpg';
const BANNER = 'https://www.cosscloudsol.com/course-banner/aws.png';

test('OG image: own admin image > page image > site default; a stored default is not an override', () => {
  assert.equal(pickOgImage('https://cdn/x.jpg', BANNER, null, DEF), 'https://cdn/x.jpg');
  assert.equal(pickOgImage(DEF, BANNER, null, DEF), BANNER, 'the seeded default must not hide the banner');
  assert.equal(pickOgImage('https://cdn/site-default.jpg', BANNER, 'https://cdn/site-default.jpg', DEF), BANNER);
  assert.equal(pickOgImage(null, BANNER, null, DEF), BANNER);
  assert.equal(pickOgImage(DEF, undefined, null, DEF), DEF);
  assert.equal(pickOgImage(null, undefined, 'https://cdn/s.jpg', DEF), 'https://cdn/s.jpg');
});

test('canonical fallback paths for slugs that differ from their URL', () => {
  assert.equal(PAGE_SLUG_PATHS.about, 'about-us');
  assert.equal(PAGE_SLUG_PATHS.contact, 'contact-us');
  for (const [slug, p] of Object.entries(PAGE_SLUG_PATHS)) assert.ok(fs.existsSync(`src/app/${p}/page.tsx`), `${slug} → /${p}`);
});

test('one viewport and one Search Console tag per page', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
  assert.doesNotMatch(layout, /<meta name="viewport"/, 'Next.js already emits the viewport tag');
  assert.equal((layout.match(/google-site-verification/g) || []).length, 1);
  assert.doesNotMatch(fs.readFileSync('src/lib/get-page-seo.ts', 'utf8'), /'google-site-verification':/);
});

test('/blog?tag= is noindex; the category breadcrumb links to the category', () => {
  const mw = fs.readFileSync('src/middleware.ts', 'utf8');
  assert.match(mw, /'\/blog'[,\]]/, '/blog is in the middleware matcher');
  assert.match(mw, /searchParams\.has\('tag'\)\) res\.headers\.set\('X-Robots-Tag', 'noindex, follow'\)/);
  assert.doesNotMatch(fs.readFileSync('src/components/CourseCategoryPage.tsx', 'utf8'), /label: data\.name, href: '#'/);
});

test('Poppins is loaded (next/font) and every Poppins stack uses it; font-display is defined', () => {
  assert.match(fs.readFileSync('src/app/layout.tsx', 'utf8'), /const poppins = Poppins\(\{[\s\S]*?variable: '--font-poppins'/);
  assert.match(fs.readFileSync('tailwind.config.ts', 'utf8'), /display: \['var\(--font-poppins\)'/);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  const stray = walk('src').filter((f) => /\.(tsx?|css)$/.test(f) && f !== 'src/app/layout.tsx').filter((f) => /(['"])Poppins(, sans-serif)?\1(?!\s*\))/.test(fs.readFileSync(f, 'utf8')) && !/var\(--font-poppins\)/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(stray, []);
});
