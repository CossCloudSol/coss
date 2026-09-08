import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env from project root (no dotenv dep needed)
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

import { seedSeoPages, seedCoursePages, seedCategoryPages, seedBlogPosts } from '@/lib/seo-seed';
import { prisma } from '@/lib/db';

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  if (!confirmed) {
    console.error(`
Refusing to run: this script force-upserts up to 139 PageSeo rows (static
pages, courses, categories, blog posts) and unconditionally overwrites 9
fields on every existing row — metaTitle, metaDescription, focusKeyword,
keywords, ogTitle, ogDescription, ogImage, canonicalUrl, schemaMarkup —
including any admin edits made in the IMS panel. There is no undo.

WARNING: the values in seo-seed.ts may lag the database. Rows edited in the
admin panel or by SQL will be reverted to the file's contents.

Re-run with --confirm to proceed.

This script targets whatever DATABASE_URL resolves to — assume production.

  npx dotenv-cli -e .env.development.local -- npx tsx src/scripts/seed-seo.ts --confirm
`);
    process.exit(1);
  }

  console.log('Force-seeding all SEO pages with production values...');
  await seedSeoPages();
  console.log('✓ Static pages upserted');
  await seedCoursePages();
  console.log('✓ Course pages upserted');
  await seedCategoryPages();
  console.log('✓ Category pages upserted');
  await seedBlogPosts();
  console.log('✓ Blog posts upserted');
  console.log('\nAll done — DB now matches the values hardcoded in seo-seed.ts.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
