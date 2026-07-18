#!/usr/bin/env node
/**
 * scripts/apply-fix6-data.mjs
 *
 * Applies the fix6 SEO data cleanup:
 *   (a) NULLs PageSeo.metaTitle/ogTitle values that still contain a "…"
 *       truncation artifact (same rows scripts/find-stale-og-titles.mjs
 *       identifies) so buildPageMetadataWithFallback() falls through to a
 *       clean, computed title instead of the stale one.
 *   (b) Applies the 23 title rewrites proposed in fix6-proposals.csv
 *       (rows with type=title; the type=description rows are illustrative
 *       of the blog description-template bug fixed in code and are not
 *       stored data, so they are not applied here).
 *
 * Defaults to --dry-run (prints planned changes, writes nothing).
 * Pass --write to actually apply changes.
 *
 * Usage:
 *   node scripts/apply-fix6-data.mjs           # dry run
 *   node scripts/apply-fix6-data.mjs --write   # apply
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = !process.argv.includes('--write');

// Minimal RFC4180 CSV parser — fix6-proposals.csv has quoted fields with
// embedded commas and "" escaped quotes, which a naive split(',') can't handle.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// PageSeo.pageSlug doesn't always mirror the URL path 1:1 — a couple of
// static pages use a shorter slug than their route (see src/app/*/page.tsx
// buildPageMetadata() calls).
const SPECIAL_SLUGS = {
  'about-us': 'about',
  'contact-us': 'contact',
};

function urlToPageSlug(url) {
  const trimmed = url.replace(/^\/+|\/+$/g, '');
  return SPECIAL_SLUGS[trimmed] ?? trimmed;
}

async function nullStaleTruncatedTitles() {
  const staleRows = await prisma.pageSeo.findMany({
    where: { OR: [{ metaTitle: { contains: '…' } }, { ogTitle: { contains: '…' } }] },
    select: { pageSlug: true, metaTitle: true, ogTitle: true },
  });

  console.log(`(a) ${staleRows.length} PageSeo row(s) with a "…" truncation artifact:`);
  for (const row of staleRows) {
    const clearMetaTitle = row.metaTitle?.includes('…') ?? false;
    const clearOgTitle = row.ogTitle?.includes('…') ?? false;
    console.log(`  ${row.pageSlug}: metaTitle=${clearMetaTitle ? 'NULL' : 'keep'}, ogTitle=${clearOgTitle ? 'NULL' : 'keep'}`);

    if (!DRY_RUN) {
      await prisma.pageSeo.update({
        where: { pageSlug: row.pageSlug },
        data: {
          ...(clearMetaTitle ? { metaTitle: null } : {}),
          ...(clearOgTitle ? { ogTitle: null } : {}),
        },
      });
    }
  }
}

async function applyTitleRewrites() {
  const csvPath = path.join(__dirname, '..', 'fix6-proposals.csv');
  const csvText = readFileSync(csvPath, 'utf8');
  const [header, ...rows] = parseCsv(csvText).filter((r) => r.length && r.some((c) => c !== ''));
  const col = header.reduce((acc, name, i) => ({ ...acc, [name]: i }), {});

  const titleRows = rows.filter((r) => r[col.type] === 'title');
  console.log(`\n(b) ${titleRows.length} title rewrite(s) from fix6-proposals.csv:`);

  for (const r of titleRows) {
    const url = r[col.url];
    const proposed = r[col.proposed_rewrite];
    const pageSlug = urlToPageSlug(url);
    console.log(`  ${url} (pageSlug: ${pageSlug}) -> "${proposed}"`);

    if (!DRY_RUN) {
      try {
        await prisma.pageSeo.update({
          where: { pageSlug },
          data: { metaTitle: proposed },
        });
      } catch (err) {
        if (err.code === 'P2025') {
          console.warn(`    SKIPPED — no PageSeo row exists for pageSlug "${pageSlug}"`);
        } else {
          throw err;
        }
      }
    }
  }
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no writes will be made.\n' : 'WRITE MODE — changes will be applied.\n');

  await nullStaleTruncatedTitles();
  await applyTitleRewrites();

  console.log(DRY_RUN ? '\nDry run complete. Re-run with --write to apply.' : '\nDone.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
