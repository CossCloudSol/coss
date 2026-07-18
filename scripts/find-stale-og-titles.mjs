#!/usr/bin/env node
/**
 * scripts/find-stale-og-titles.mjs
 *
 * Read-only. Finds PageSeo rows whose metaTitle/ogTitle still carry a "…"
 * truncation artifact — a leftover from a pre-buildTitle-pipeline title
 * generator that cut long titles to a fixed character count instead of
 * letting buildTitle() dedupe/append the brand suffix. These rows are what
 * the seo-audit.mjs script now flags as WARNING:og_title_stale_truncated_data
 * (see the 2026-07 audit: 73 of 83 og_title_disagrees_with_title rows had
 * this shape, nearly all legacy /blog/* posts).
 *
 * Makes ZERO writes. Prints a table you can review before deciding whether
 * to null out the affected fields (which lets buildPageMetadataWithFallback
 * fall through to the clean computed title instead).
 *
 * Usage:
 *   node scripts/find-stale-og-titles.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.pageSeo.findMany({
    where: {
      OR: [
        { metaTitle: { contains: '…' } },
        { ogTitle: { contains: '…' } },
      ],
    },
    select: { pageSlug: true, metaTitle: true, ogTitle: true, updatedAt: true },
  });

  console.log(`Found ${rows.length} PageSeo row(s) with a "…" truncation artifact in metaTitle or ogTitle.\n`);
  for (const r of rows) {
    console.log(`--- ${r.pageSlug} (updated ${r.updatedAt.toISOString().slice(0, 10)}) ---`);
    console.log(`  metaTitle: ${r.metaTitle ?? '(null)'}`);
    console.log(`  ogTitle  : ${r.ogTitle ?? '(null)'}`);
  }

  console.log(
    '\nNo writes made. If these look like stale pre-buildTitle data (not an intentional admin\n' +
    'override), clearing metaTitle/ogTitle on these rows lets buildPageMetadataWithFallback()\n' +
    'recompute a clean title/og:title from the page\'s own content via buildTitle().',
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
