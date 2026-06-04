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
  console.log('Force-seeding all SEO pages with production values...');
  await seedSeoPages();
  console.log('✓ Static pages upserted');
  await seedCoursePages();
  console.log('✓ Course pages upserted');
  await seedCategoryPages();
  console.log('✓ Category pages upserted');
  await seedBlogPosts();
  console.log('✓ Blog posts upserted');
  console.log('\nAll done — DB now has correct Hyderabad / cosscloudsol.com values.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
