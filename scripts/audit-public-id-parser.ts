#!/usr/bin/env node
/**
 * scripts/audit-public-id-parser.ts
 *
 * READ-ONLY audit of publicIdFromUrl() (src/lib/cloudinary.ts) against real
 * production data. Makes zero writes: no DB writes, no Cloudinary write/
 * delete calls — listAssets() only, which is a GET against the Admin API.
 *
 * Usage: node scripts/audit-public-id-parser.ts
 */

import { PrismaClient } from '@prisma/client';
import { publicIdFromUrl } from '../src/lib/cloudinary.js';
import { listAssets, type CloudinaryAsset } from '../src/lib/cloudinary-admin.js';

const prisma = new PrismaClient();

// ── Mirrors the parser's internal branching so we can report WHY a value ──
// ── returned null, without adding any reasoning/logging to the parser    ──
// ── itself (which must stay a pure, silent function per spec).           ──
type Category =
  | 'OK_WITH_VERSION'
  | 'OK_NO_VERSION'
  | 'NULL_NO_VERSION'
  | 'NULL_NOT_CLOUDINARY'
  | 'NULL_BAD_RESOURCE_TYPE'
  | 'NULL_BAD_DELIVERY_TYPE'
  | 'NULL_UNPARSEABLE';

const RESOURCE_TYPES = ['image', 'video', 'raw'];
const DELIVERY_TYPES = ['upload', 'private', 'authenticated'];
const TRANSFORM_COMPONENT_RE = /^[a-z]{1,3}_[^,]+$/;
const VERSION_RE = /^v\d+$/;

function categorize(input: string): Category {
  if (!input || !input.trim()) return 'NULL_UNPARSEABLE';
  const trimmed = input.trim();
  if (trimmed.startsWith('data:')) return 'NULL_UNPARSEABLE';
  if (!trimmed.startsWith('http')) return 'NULL_UNPARSEABLE';
  if (trimmed.includes('localhost')) return 'NULL_UNPARSEABLE';

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return 'NULL_UNPARSEABLE';
  }

  if (u.host !== 'res.cloudinary.com') return 'NULL_NOT_CLOUDINARY';

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 3) return 'NULL_UNPARSEABLE';

  const resourceType = parts[1];
  if (!RESOURCE_TYPES.includes(resourceType)) return 'NULL_BAD_RESOURCE_TYPE';

  const deliveryType = parts[2];
  if (!DELIVERY_TYPES.includes(deliveryType)) return 'NULL_BAD_DELIVERY_TYPE';

  const transformStart = 3;
  let cursor = transformStart;
  while (cursor < parts.length) {
    const segment = parts[cursor];
    const components = segment.split(',');
    const isTransformSegment = components.every(c => TRANSFORM_COMPONENT_RE.test(c));
    if (!isTransformSegment) break;
    cursor++;
  }
  const strippedCount = cursor - transformStart;

  let hadVersion = false;
  if (cursor < parts.length && VERSION_RE.test(parts[cursor])) {
    hadVersion = true;
    cursor++;
  }

  if (!hadVersion && strippedCount > 0) return 'NULL_NO_VERSION';

  const remainder = parts.slice(cursor);
  if (remainder.length === 0) return 'NULL_UNPARSEABLE';

  return hadVersion ? 'OK_WITH_VERSION' : 'OK_NO_VERSION';
}

function line(char = '─', len = 100) {
  console.log(char.repeat(len));
}

// ─────────────────────────────────────────────────────────────────────────
// The 12 columns under audit — printed up front so the list is reviewable.
// ─────────────────────────────────────────────────────────────────────────
const IMAGE_COLUMNS: ReadonlyArray<{ model: string; column: string }> = [
  { model: 'Course', column: 'thumbnail' },
  { model: 'BlogPost', column: 'thumbnail' },
  { model: 'Testimonial', column: 'photoUrl' },
  { model: 'HiringPartner', column: 'logoUrl' },
  { model: 'PageSeo', column: 'ogImage' },
  { model: 'SeoSettings', column: 'defaultOgImage' },
  { model: 'SiteSettings', column: 'ogImageUrl' },
  { model: 'SiteSettings', column: 'logoUrl' },
  { model: 'SiteSettings', column: 'logoLightUrl' },
  { model: 'SiteSettings', column: 'faviconUrl' },
  { model: 'SiteSettings', column: 'appleTouchUrl' },
  { model: 'SiteSettings', column: 'courseOgDefault' },
];

console.log('12-COLUMN AUDIT LIST:');
for (const { model, column } of IMAGE_COLUMNS) console.log(`  ${model}.${column}`);
console.log();

// ─────────────────────────────────────────────────────────────────────────
// TEST 1 — ground truth round-trip against every live Cloudinary asset
// ─────────────────────────────────────────────────────────────────────────
async function fetchAllAssets(resourceType: 'image' | 'video' | 'raw'): Promise<CloudinaryAsset[]> {
  const all: CloudinaryAsset[] = [];
  let cursor: string | undefined;
  do {
    const res = await listAssets({ max_results: 500, next_cursor: cursor, resource_type: resourceType });
    all.push(...res.resources);
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return all;
}

async function runTest1(): Promise<CloudinaryAsset[]> {
  line('=');
  console.log('TEST 1 — ground truth round-trip: publicIdFromUrl(secure_url) === public_id');
  line('=');

  const byType: Record<string, CloudinaryAsset[]> = {};
  for (const rt of ['image', 'video', 'raw'] as const) {
    byType[rt] = await fetchAllAssets(rt);
    console.log(`  fetched ${byType[rt].length} '${rt}' asset(s) from Cloudinary`);
  }

  const all = [...byType.image, ...byType.video, ...byType.raw];
  console.log(`\nTotal assets: ${all.length}`);

  let exact = 0;
  let mismatch = 0;
  let nulls = 0;
  const problems: Array<{ asset: CloudinaryAsset; got: string | null }> = [];

  for (const asset of all) {
    const got = publicIdFromUrl(asset.secure_url);
    if (got === asset.public_id) {
      exact++;
    } else if (got === null) {
      nulls++;
      problems.push({ asset, got });
    } else {
      mismatch++;
      problems.push({ asset, got });
    }
  }

  console.log(`Exact matches: ${exact}`);
  console.log(`Mismatches:    ${mismatch}`);
  console.log(`Nulls:         ${nulls}`);

  if (problems.length > 0) {
    console.log('\n--- Full detail for every mismatch/null ---');
    for (const { asset, got } of problems) {
      console.log(`  resource_type=${asset.resource_type}`);
      console.log(`  secure_url:    ${asset.secure_url}`);
      console.log(`  expected (public_id): ${asset.public_id}`);
      console.log(`  parser returned:      ${got === null ? 'null' : got}`);
      console.log('  ---');
    }
  } else {
    console.log('\nNo mismatches or nulls — every live asset round-tripped exactly.');
  }
  console.log();

  return all;
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 2 — real DB values across all 12 columns
// ─────────────────────────────────────────────────────────────────────────
type Row = { model: string; column: string; id: string; value: string; result: string | null; category: Category };

async function runTest2(): Promise<Row[]> {
  line('=');
  console.log('TEST 2 — real DB values across the 12 image-reference columns');
  line('=');

  const rows: Row[] = [];

  function collect(model: string, column: string, id: string, value: string | null | undefined) {
    if (!value || value.trim() === '') return;
    rows.push({ model, column, id, value, result: publicIdFromUrl(value), category: categorize(value) });
  }

  const courses = await prisma.course.findMany({ select: { id: true, thumbnail: true } });
  for (const r of courses) collect('Course', 'thumbnail', r.id, r.thumbnail);

  const posts = await prisma.blogPost.findMany({ select: { id: true, thumbnail: true } });
  for (const r of posts) collect('BlogPost', 'thumbnail', r.id, r.thumbnail);

  const testimonials = await prisma.testimonial.findMany({ select: { id: true, photoUrl: true } });
  for (const r of testimonials) collect('Testimonial', 'photoUrl', r.id, r.photoUrl);

  const partners = await prisma.hiringPartner.findMany({ select: { id: true, logoUrl: true } });
  for (const r of partners) collect('HiringPartner', 'logoUrl', r.id, r.logoUrl);

  const pageSeos = await prisma.pageSeo.findMany({ select: { id: true, ogImage: true } });
  for (const r of pageSeos) collect('PageSeo', 'ogImage', r.id, r.ogImage);

  const seoSettings = await prisma.seoSettings.findMany({ select: { id: true, defaultOgImage: true } });
  for (const r of seoSettings) collect('SeoSettings', 'defaultOgImage', r.id, r.defaultOgImage);

  const siteSettings = await prisma.siteSettings.findMany({
    select: { id: true, ogImageUrl: true, logoUrl: true, logoLightUrl: true, faviconUrl: true, appleTouchUrl: true, courseOgDefault: true },
  });
  for (const r of siteSettings) {
    collect('SiteSettings', 'ogImageUrl', r.id, r.ogImageUrl);
    collect('SiteSettings', 'logoUrl', r.id, r.logoUrl);
    collect('SiteSettings', 'logoLightUrl', r.id, r.logoLightUrl);
    collect('SiteSettings', 'faviconUrl', r.id, r.faviconUrl);
    collect('SiteSettings', 'appleTouchUrl', r.id, r.appleTouchUrl);
    collect('SiteSettings', 'courseOgDefault', r.id, r.courseOgDefault);
  }

  console.log(`\nTotal non-null/non-empty values found: ${rows.length}\n`);

  // Per-column summary
  console.log('--- Per-column category summary ---');
  const summary = new Map<string, Map<Category, number>>();
  for (const r of rows) {
    const key = `${r.model}.${r.column}`;
    if (!summary.has(key)) summary.set(key, new Map());
    const m = summary.get(key)!;
    m.set(r.category, (m.get(r.category) ?? 0) + 1);
  }
  const allCategories: Category[] = [
    'OK_WITH_VERSION', 'OK_NO_VERSION', 'NULL_NO_VERSION', 'NULL_NOT_CLOUDINARY',
    'NULL_BAD_RESOURCE_TYPE', 'NULL_BAD_DELIVERY_TYPE', 'NULL_UNPARSEABLE',
  ];
  const header = ['column', ...allCategories, 'total'];
  console.log(header.join(' | '));
  for (const { model, column } of IMAGE_COLUMNS) {
    const key = `${model}.${column}`;
    const m = summary.get(key) ?? new Map();
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const cells = allCategories.map(c => String(m.get(c) ?? 0));
    console.log([key, ...cells, total].join(' | '));
  }
  console.log();

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// VALIDATION B — the 16 OK_NO_VERSION rows against Cloudinary ground truth
// VALIDATION C — every non-null-parsing row (23 total) against ground truth
// ─────────────────────────────────────────────────────────────────────────
function runExistenceValidation(title: string, rows: Row[], publicIdSet: Set<string>) {
  line('=');
  console.log(title);
  line('=');

  let yes = 0;
  let no = 0;
  console.log('row id | raw value | parsed public ID | EXISTS_IN_CLOUDINARY');
  line('-');
  for (const r of rows) {
    const exists = r.result !== null && publicIdSet.has(r.result);
    if (exists) yes++; else no++;
    console.log(`  ${r.model}.${r.column} id=${r.id}`);
    console.log(`    raw value: ${r.value}`);
    console.log(`    parsed:    ${r.result}`);
    console.log(`    exists:    ${exists ? 'yes' : 'no'}`);
  }
  console.log(`\nEXISTS: ${yes}   MISSING: ${no}`);
  console.log();
}

// ─────────────────────────────────────────────────────────────────────────
// VALIDATION D — does the OG image actually exist
// ─────────────────────────────────────────────────────────────────────────
async function runOgImageValidation() {
  line('=');
  console.log('VALIDATION D — https://www.cosscloudsol.com/og-image.jpg');
  line('=');

  try {
    const res = await fetch('https://www.cosscloudsol.com/og-image.jpg', { method: 'GET' });
    console.log(`status: ${res.status}`);
    console.log(`content-type: ${res.headers.get('content-type')}`);
  } catch (e) {
    console.log(`request failed: ${e}`);
  }

  const fs = await import('node:fs');
  const path = await import('node:path');
  const repoPath = path.resolve(import.meta.dirname, '..', 'public', 'og-image.jpg');
  console.log(`public/og-image.jpg exists in repo: ${fs.existsSync(repoPath) ? 'yes' : 'no'} (${repoPath})`);
  console.log();
}

// ─────────────────────────────────────────────────────────────────────────
// TEST 3 — synthetic edge cases
// ─────────────────────────────────────────────────────────────────────────
async function runTest3() {
  line('=');
  console.log('TEST 3 — synthetic edge cases (amended parser)');
  line('=');

  let gbpUrl = '(no testimonial rows with photoUrl found)';
  const t = await prisma.testimonial.findFirst({ where: { photoUrl: { not: null } }, select: { photoUrl: true } });
  if (t?.photoUrl) gbpUrl = t.photoUrl;

  const cases: Array<{ label: string; input: string }> = [
    { label: 'single transform',                 input: 'https://res.cloudinary.com/democloud/image/upload/w_300/v1712345678/folder/img.jpg' },
    { label: 'chained transforms',                input: 'https://res.cloudinary.com/democloud/image/upload/w_300,h_200,c_fill/f_auto/q_auto/v1712345678/folder/img.jpg' },
    { label: 'no transform, with version',        input: 'https://res.cloudinary.com/democloud/image/upload/v1712345678/folder/img.jpg' },
    { label: 'no version at all',                 input: 'https://res.cloudinary.com/democloud/image/upload/folder/img.jpg' },
    { label: 'nested folders',                    input: 'https://res.cloudinary.com/democloud/image/upload/v1/cosscloudsol/site-images/a/b/img.png' },
    { label: "folder named 'upload'",             input: 'https://res.cloudinary.com/democloud/image/upload/v1/upload/img.jpg' },
    { label: "cloud named 'upload'",               input: 'https://res.cloudinary.com/upload/image/upload/v1/img.jpg' },
    { label: 'dot in public id',                  input: 'https://res.cloudinary.com/democloud/image/upload/v1/folder/my.file.name.jpg' },
    { label: 'no extension',                      input: 'https://res.cloudinary.com/democloud/image/upload/v1/folder/img' },
    { label: 'video resource',                    input: 'https://res.cloudinary.com/democloud/video/upload/v1/folder/clip.mp4' },
    { label: 'raw resource',                      input: 'https://res.cloudinary.com/democloud/raw/upload/v1/folder/doc.pdf' },
    { label: 'fetch delivery',                    input: 'https://res.cloudinary.com/democloud/image/fetch/v1/https://example.com/a.jpg' },
    { label: 'our own domain',                    input: 'https://www.cosscloudsol.com/og-image.jpg' },
    { label: 'relative',                          input: '/logo.png' },
    { label: 'localhost',                         input: 'http://localhost:3000/uploads/test.png' },
    { label: 'data URI',                          input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' },
    { label: 'empty string',                      input: '' },
    { label: 'Google GBP photo URL (real, from Testimonial table)', input: gbpUrl },
    { label: 'transform, no version',             input: 'https://res.cloudinary.com/democloud/image/upload/w_300/img.jpg' },
    { label: 'chained, no version',                input: 'https://res.cloudinary.com/democloud/image/upload/w_300,h_200/f_auto/img.jpg' },
  ];

  console.log('label | input | output | category');
  line('-');
  for (const c of cases) {
    const result = publicIdFromUrl(c.input);
    const category = categorize(c.input);
    console.log(`${c.label}`);
    console.log(`  input:    ${c.input === '' ? '(empty string)' : c.input}`);
    console.log(`  output:   ${result === null ? 'null' : result}`);
    console.log(`  category: ${category}`);
  }
  console.log();
}

async function main() {
  const assets = await runTest1();
  const rows = await runTest2();

  const publicIdSet = new Set(assets.map(a => a.public_id));

  const okNoVersionRows = rows.filter(r => r.category === 'OK_NO_VERSION');
  runExistenceValidation(
    `VALIDATION B — the ${okNoVersionRows.length} OK_NO_VERSION rows (HiringPartner logos) vs Cloudinary ground truth`,
    okNoVersionRows,
    publicIdSet,
  );

  const allNonNullRows = rows.filter(r => r.result !== null);
  runExistenceValidation(
    `VALIDATION C — all ${allNonNullRows.length} non-null-parsing DB rows vs Cloudinary ground truth`,
    allNonNullRows,
    publicIdSet,
  );

  await runOgImageValidation();
  await runTest3();
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
