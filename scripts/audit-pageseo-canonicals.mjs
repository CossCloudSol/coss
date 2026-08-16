/**
 * scripts/audit-pageseo-canonicals.mjs
 *
 * READ-ONLY audit of PageSeo.canonicalUrl. SELECT/findMany only — no create,
 * update, upsert, or delete anywhere in this file. Single Prisma client
 * (the existing app singleton from src/lib/db.ts), single connection,
 * explicit $disconnect() in a finally block.
 *
 * Run with: npx tsx scripts/audit-pageseo-canonicals.mjs
 * Not wired into package.json scripts — run manually only.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env before the Prisma singleton is imported/constructed ───────────
try {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch { /* already set via environment */ }

import { prisma } from '../src/lib/db.ts';
import { getCourseUrl } from '../src/lib/course-url.ts';
import { COURSES } from '../src/data/courses-data.ts';
import { CATEGORY_PAGES } from '../src/lib/all-pages-registry.ts';
import { SLUG_MAP } from '../src/lib/get-landing-page-data.ts';
import nextConfig from '../next.config.mjs';

const SITE_URL = 'https://www.cosscloudsol.com';
const SITE_HOST = 'www.cosscloudsol.com';

function safeParseUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

async function main() {
  const warnings = [];

  // ── B2: query PageSeo ────────────────────────────────────────────────────
  const rows = await prisma.pageSeo.findMany({
    select: { pageSlug: true, pageTitle: true, canonicalUrl: true },
    orderBy: { pageSlug: 'asc' },
  });

  const totalRows = rows.length;
  const nonNullRows = rows.filter(
    (r) => typeof r.canonicalUrl === 'string' && r.canonicalUrl.trim() !== '',
  );

  // ── Supporting reads (all SELECT-only) ──────────────────────────────────
  const dbCourses = await prisma.course.findMany({
    select: { slug: true, urlType: true, categorySlug: true },
  });
  const redirectTableRows = await prisma.redirect.findMany({
    select: { source: true, destination: true, statusCode: true, isActive: true },
  });

  // next.config.mjs redirects() — static infra redirects, read via the real config
  let staticRedirects = [];
  try {
    staticRedirects = await nextConfig.redirects();
  } catch (e) {
    warnings.push(`Could not evaluate next.config.mjs redirects(): ${e.message}`);
  }
  const staticRedirectSources = new Map(staticRedirects.map((r) => [r.source, r]));
  const activeDbRedirectSources = new Map(
    redirectTableRows.filter((r) => r.isActive).map((r) => [r.source, r]),
  );

  // ── Build DB-course pageSlug -> expected getCourseUrl() map ─────────────
  // Every DB Course is looked up under generateMetadata's PageSeo key, which
  // is always `courses/${getCourseUrl(course).slice('/courses/'.length)}` —
  // i.e. the getCourseUrl() path with the leading slash stripped.
  const courseByPageSlug = new Map();
  for (const c of dbCourses) {
    const expectedPath = getCourseUrl(c); // e.g. /courses/slug or /courses/cat/slug
    const pageSlug = expectedPath.replace(/^\//, '');
    courseByPageSlug.set(pageSlug, { ...c, expectedPath });
  }

  // ── Flat-legacy slug universe (COURSES static array + SLUG_MAP keys) ────
  const flatCourseDataSlugs = new Set(COURSES.map((c) => c.slug));
  const flatSlugMapKeys = new Set(Object.keys(SLUG_MAP));
  const flatLegacySlugs = new Set([...flatCourseDataSlugs, ...flatSlugMapKeys]);

  const categoryPageSlugs = new Set(CATEGORY_PAGES.map((p) => p.slug));

  // ── B3/B4: classify every non-null canonical ─────────────────────────────
  const classified = [];
  const counts = {
    TRAILING_SLASH: 0,
    FORM_MISMATCH: 0,
    FOREIGN_DOMAIN: 0,
    FLAT_LEGACY_EXPECTED: 0,
    CLEAN: 0,
    UNPARSEABLE: 0,
  };

  for (const row of nonNullRows) {
    const raw = row.canonicalUrl.trim();
    const url = safeParseUrl(raw);

    if (!url) {
      counts.UNPARSEABLE++;
      classified.push({
        pageSlug: row.pageSlug,
        stored: raw,
        expected: null,
        classes: ['UNPARSEABLE'],
        redirectCollision: null,
      });
      continue;
    }

    const isForeign =
      url.hostname !== SITE_HOST ||
      url.protocol !== 'https:' ||
      /nextskill\.cloud|\.vercel\.app|coss-six|localhost/i.test(raw);

    const hasTrailingSlash = url.pathname !== '/' && url.pathname.endsWith('/');

    const courseInfo = courseByPageSlug.get(row.pageSlug);
    let formMismatch = false;
    let expected = null;
    if (courseInfo) {
      expected = `${SITE_URL}${courseInfo.expectedPath}`;
      const normalizedRaw = raw.replace(/\/$/, '');
      const normalizedExpected = expected.replace(/\/$/, '');
      if (normalizedRaw !== normalizedExpected) formMismatch = true;
    }

    const isFlatLegacy = flatLegacySlugs.has(row.pageSlug);
    const isCategoryRow = categoryPageSlugs.has(row.pageSlug);

    const classes = [];
    if (isForeign) classes.push('FOREIGN_DOMAIN');
    if (formMismatch) classes.push('FORM_MISMATCH');
    if (hasTrailingSlash) classes.push('TRAILING_SLASH');

    if (classes.length === 0) {
      if (isFlatLegacy) {
        classes.push('FLAT_LEGACY_EXPECTED');
      } else {
        classes.push('CLEAN');
      }
    }

    for (const c of classes) counts[c] = (counts[c] ?? 0) + 1;

    // ── B5: redirect collision check on (a)/(b)/(c) rows ────────────────
    let redirectCollision = null;
    const hasDefect = classes.some((c) =>
      ['TRAILING_SLASH', 'FORM_MISMATCH', 'FOREIGN_DOMAIN', 'UNPARSEABLE'].includes(c),
    );
    if (hasDefect) {
      const pathOnly = url.pathname;
      if (staticRedirectSources.has(pathOnly)) {
        const r = staticRedirectSources.get(pathOnly);
        redirectCollision = `next.config.mjs static redirect -> ${r.destination} (permanent=${r.permanent})`;
      } else if (activeDbRedirectSources.has(pathOnly)) {
        const r = activeDbRedirectSources.get(pathOnly);
        redirectCollision = `Redirect table -> ${r.destination} (status=${r.statusCode})`;
      }
    }

    classified.push({
      pageSlug: row.pageSlug,
      pageTitle: row.pageTitle,
      stored: raw,
      expected,
      classes,
      isCategoryRow,
      redirectCollision,
    });
  }

  const defectRows = classified.filter((r) =>
    r.classes.some((c) =>
      ['TRAILING_SLASH', 'FORM_MISMATCH', 'FOREIGN_DOMAIN', 'UNPARSEABLE'].includes(c),
    ),
  );

  // ── Write report ──────────────────────────────────────────────────────────
  const lines = [];
  lines.push('# PageSeo.canonicalUrl audit');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## B2 — Row counts');
  lines.push(`Total PageSeo rows: ${totalRows}`);
  lines.push(`Non-null canonicalUrl: ${nonNullRows.length}`);
  lines.push(`Null/empty canonicalUrl: ${totalRows - nonNullRows.length}`);
  lines.push('');
  lines.push('## B3 — Classification counts (a row may hold multiple defect classes)');
  for (const [k, v] of Object.entries(counts)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push(`Flat-legacy slug universe size (COURSES ∪ SLUG_MAP keys): ${flatLegacySlugs.size}`);
  lines.push('');

  lines.push('## B4 — Defect table (TRAILING_SLASH / FORM_MISMATCH / FOREIGN_DOMAIN / UNPARSEABLE only)');
  lines.push('');
  lines.push('| pageSlug | stored canonical | expected | defect class(es) | redirect collision |');
  lines.push('|---|---|---|---|---|');
  for (const r of defectRows) {
    lines.push(
      `| ${r.pageSlug} | ${r.stored} | ${r.expected ?? '(n/a)'} | ${r.classes.join(', ')} | ${r.redirectCollision ?? '-'} |`,
    );
  }
  lines.push('');
  lines.push(`Total defect rows: ${defectRows.length}`);
  lines.push('');

  if (warnings.length) {
    lines.push('## Warnings encountered during audit');
    for (const w of warnings) lines.push(`- ${w}`);
    lines.push('');
  }

  const outPath = resolve(process.cwd(), 'scripts', '.output', 'audit-pageseo-canonicals-report.md');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');

  console.log(`Report written to ${outPath}`);
  console.log(`Total rows: ${totalRows}, non-null canonicals: ${nonNullRows.length}, defect rows: ${defectRows.length}`);
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error('[audit-pageseo-canonicals] FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
