/**
 * force-update-seo.ts
 *
 * Run with:  npx tsx src/scripts/force-update-seo.ts
 *
 * Does TWO things:
 *  1. Hard-UPDATE specific page rows (home, about/about-us, blog) with exact
 *     Hyderabad / cosscloudsol.com brand values — regardless of staticGap.
 *  2. Global text-replacement pass: scans every PageSeo row and replaces stale
 *     brand strings (NextSkill, Bengaluru, old URLs, etc.) wherever they appear.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env before Prisma client initialises ────────────────────────────────
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
} catch { /* env already provided by shell */ }

import { prisma } from '@/lib/db';

// ── Exact replacement data for key pages ─────────────────────────────────────

const HOME_UPDATE = {
  metaTitle:       'Best IT Training Institute in Hyderabad',
  metaDescription: 'Coss Cloud Solutions: Top IT training in Hyderabad. Cloud, DevOps & 30+ courses. 5,000+ placed. 100% placement support. Centres in Dilsukhnagar & Ameerpet.',
  ogTitle:         'Best IT Training Institute in Hyderabad | Coss Cloud Solutions',
  ogDescription:   'Join 5,000+ students who launched IT careers at Coss Cloud Solutions. Cloud, DevOps, Data Science & 30+ courses with 100% placement assistance in Hyderabad.',
  canonicalUrl:    'https://www.cosscloudsol.com',
  keywords:        'IT training institute in Hyderabad, best software training Hyderabad, cloud computing course Hyderabad, DevOps training Hyderabad, data science training Hyderabad',
};

const ABOUT_UPDATE = {
  metaTitle:       'About Coss Cloud Solutions — IT Training Institute Hyderabad',
  metaDescription: 'Learn about Coss Cloud Solutions — a leading IT training institute in Hyderabad since 2010. 5,000+ students placed. Expert trainers at Dilsukhnagar & Ameerpet.',
  ogTitle:         'About Coss Cloud Solutions — IT Training Institute Hyderabad',
  ogDescription:   'Coss Cloud Solutions: 15+ years of IT training excellence in Hyderabad. Expert trainers, hands-on labs, 100% placement support.',
  canonicalUrl:    'https://www.cosscloudsol.com/about-us',
  keywords:        'Coss Cloud Solutions Hyderabad, IT training institute Hyderabad, about us, best software training Hyderabad, Dilsukhnagar training centre, Ameerpet training centre',
};

const BLOG_UPDATE = {
  metaTitle:       'IT Training Blog & Career Tips',
  metaDescription: 'Read the latest IT articles, career tips, tech tutorials & training guides from Coss Cloud Solutions experts in Hyderabad.',
  ogTitle:         'IT Training Blog & Career Tips | Coss Cloud Solutions',
  ogDescription:   'Expert IT career tips, training guides and tech tutorials from Coss Cloud Solutions Hyderabad.',
  canonicalUrl:    'https://www.cosscloudsol.com/blog',
};

// ── Global text replacements (old → new) ─────────────────────────────────────

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/https?:\/\/(www\.)?nextskill\.cloud/gi, 'https://www.cosscloudsol.com'],
  [/NextSkill/gi,             'Coss Cloud Solutions'],
  [/nextskill\.cloud/gi,      'cosscloudsol.com'],
  [/Bengaluru/gi,             'Hyderabad'],
  [/Bangalore/gi,             'Hyderabad'],
  [/Indiranagar/gi,           'Dilsukhnagar'],
  [/Whitefield/gi,            'Ameerpet'],
  [/Electronic\s+City/gi,     'HITEC City'],
  [/http:\/\/localhost:3000/g, 'https://www.cosscloudsol.com'],
];

function applyReplacements(value: string | null): string | null {
  if (!value) return value;
  let result = value;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function needsReplacement(value: string | null): boolean {
  if (!value) return false;
  return TEXT_REPLACEMENTS.some(([pattern]) => pattern.test(value));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 0: Update SeoSettings (singleton) ──────────────────────────────────

  console.log('\n── Step 0: Updating SeoSettings ──');

  const seoSettings = await prisma.seoSettings.findFirst();
  if (seoSettings) {
    const settingsPatch: Record<string, string> = { siteTitle: 'Coss Cloud Solutions' };
    if (seoSettings.twitterHandle?.toLowerCase().includes('nextskill')) {
      settingsPatch.twitterHandle = '@cosscloudsol';
    }
    await prisma.seoSettings.update({ where: { id: seoSettings.id }, data: settingsPatch });
    console.log('  SeoSettings updated: siteTitle = "Coss Cloud Solutions"');
  } else {
    console.log('  No SeoSettings row found — skipping');
  }

  // ── Step 1: Force-update key pages ──────────────────────────────────────────

  console.log('\n── Step 1: Force-updating home / about / blog rows ──');

  // Home (slug: 'home')
  const homeResult = await prisma.pageSeo.updateMany({
    where: { pageSlug: 'home' },
    data: HOME_UPDATE,
  });
  console.log(`  home:       ${homeResult.count} row(s) updated`);

  // About — try both 'about' and 'about-us' slugs
  const aboutResult = await prisma.pageSeo.updateMany({
    where: { pageSlug: { in: ['about', 'about-us'] } },
    data: ABOUT_UPDATE,
  });
  console.log(`  about/about-us: ${aboutResult.count} row(s) updated`);

  // Blog (slug: 'blog')
  const blogResult = await prisma.pageSeo.updateMany({
    where: { pageSlug: 'blog' },
    data: BLOG_UPDATE,
  });
  console.log(`  blog:       ${blogResult.count} row(s) updated`);

  // ── Step 2: Global text-replacement pass ────────────────────────────────────

  console.log('\n── Step 2: Scanning all rows for stale brand strings ──');

  const allRows = await prisma.pageSeo.findMany();
  let fixedCount = 0;

  for (const row of allRows) {
    const fields: Array<keyof typeof row> = [
      'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription',
      'canonicalUrl', 'keywords', 'focusKeyword', 'schemaMarkup',
    ] as const;

    // Check if any field in this row needs replacement
    const dirty = fields.some((f) => needsReplacement(row[f] as string | null));
    const metaTitleHasSuffix = !!row.metaTitle?.match(/ \| (NextSkill|Coss Cloud Solutions|COSS Cloud Solutions)$/i);
    if (!dirty && !metaTitleHasSuffix) continue;

    // Build the update payload only with fields that changed
    const patch: Record<string, string | null> = {};
    for (const f of fields) {
      const original = row[f] as string | null;
      const replaced = applyReplacements(original);
      if (replaced !== original) patch[f] = replaced;
    }

    // Strip brand suffix from metaTitle — code appends " | siteTitle" at render time
    const currentMetaTitle = (patch['metaTitle'] as string | undefined) ?? row.metaTitle;
    if (currentMetaTitle) {
      const stripped = currentMetaTitle
        .replace(/ \| Coss Cloud Solutions$/i, '')
        .replace(/ \| NextSkill$/i, '')
        .replace(/ \| COSS Cloud Solutions$/i, '')
        .trim();
      if (stripped !== currentMetaTitle) patch['metaTitle'] = stripped;
    }

    if (Object.keys(patch).length === 0) continue;

    await prisma.pageSeo.update({
      where: { id: row.id },
      data: patch,
    });
    fixedCount++;
    console.log(`  Fixed: ${row.pageSlug}`);
  }

  console.log(`  Total rows fixed in replacement pass: ${fixedCount}`);

  // ── Step 3: Verification — read back key rows ───────────────────────────────

  console.log('\n── Step 3: Verification (reading back key rows) ──');

  const settingsCheck = await prisma.seoSettings.findFirst({ select: { siteTitle: true } });
  console.log(`  SeoSettings.siteTitle: ${settingsCheck?.siteTitle ?? '(not set)'}`);

  const verify = await prisma.pageSeo.findMany({
    where: { pageSlug: { in: ['home', 'about', 'about-us', 'blog'] } },
    select: { pageSlug: true, metaTitle: true, canonicalUrl: true },
  });

  for (const r of verify) {
    console.log(`  [${r.pageSlug}]`);
    console.log(`    metaTitle:    ${r.metaTitle}`);
    console.log(`    canonicalUrl: ${r.canonicalUrl}`);
  }

  // Sanity checks
  if (settingsCheck?.siteTitle !== 'Coss Cloud Solutions') {
    console.error('\n  ✗ ERROR: SeoSettings.siteTitle is not "Coss Cloud Solutions"!');
    process.exit(1);
  }
  const hasNextSkill = verify.some(
    (r) => r.metaTitle?.toLowerCase().includes('nextskill'),
  );
  if (hasNextSkill) {
    console.error('\n  ✗ ERROR: "NextSkill" still present in key rows!');
    process.exit(1);
  }
  const hasBrandSuffix = verify.some(
    (r) => r.metaTitle?.match(/ \| (Coss Cloud Solutions|COSS Cloud Solutions)$/i),
  );
  if (hasBrandSuffix) {
    console.error('\n  ✗ ERROR: metaTitle still contains brand suffix in key rows!');
    process.exit(1);
  }

  console.log('\n  ✓ All key rows look correct — no stale brand strings found.');
  console.log('\nDone. Next step: push an empty commit or redeploy from Vercel to bust the Next.js cache.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
