import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { seedSeoPages, seedCoursePages, seedCategoryPages, seedBlogPosts, SEED_PAGE_SLUGS } from '@/lib/seo-seed';
import { COURSES } from '@/data/courses-data';
import { CATEGORY_PAGES } from '@/lib/all-pages-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface PageSeoListItem {
  id: string;
  pageSlug: string;
  pageTitle: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  schemaMarkup: string | null;
  focusKeyword: string | null;
  keywords: string | null;
  updatedAt: string;
  createdAt: string;
}

function serialize(row: {
  id: string;
  pageSlug: string;
  pageTitle: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  schemaMarkup: string | null;
  focusKeyword: string | null;
  keywords: string | null;
  updatedAt: Date;
  createdAt: Date;
}): PageSeoListItem {
  return {
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build the full expected slug list across all groups.
  const courseSlugs = COURSES.map((c) => c.slug);
  const categorySlugs = CATEGORY_PAGES.map((c) => c.slug);
  const allExpected = [...SEED_PAGE_SLUGS, ...courseSlugs, ...categorySlugs];

  const existing = await prisma.pageSeo.findMany({
    where: { pageSlug: { in: allExpected } },
    select: { pageSlug: true, metaTitle: true },
  });
  const existingSet = new Set(existing.map((r) => r.pageSlug));

  // Re-seed when: a slug is missing OR an existing row has no metaTitle
  const staticGap =
    SEED_PAGE_SLUGS.some((s) => !existingSet.has(s)) ||
    existing
      .filter((r) => SEED_PAGE_SLUGS.includes(r.pageSlug))
      .some((r) => !r.metaTitle || r.metaTitle.trim() === '');
  const courseGap = courseSlugs.some((s) => !existingSet.has(s));
  const categoryGap = categorySlugs.some((s) => !existingSet.has(s));

  // Blog posts: seed if any course/category/static was just added (first-run proxy)
  const totalCount = await prisma.pageSeo.count();
  const blogGap = totalCount < allExpected.length + 50; // at least some blog rows expected

  if (staticGap) await seedSeoPages();
  if (courseGap) await seedCoursePages();
  if (categoryGap) await seedCategoryPages();
  if (blogGap) await seedBlogPosts();

  const rows = await prisma.pageSeo.findMany({
    orderBy: { pageTitle: 'asc' },
  });

  return NextResponse.json({ pages: rows.map(serialize) });
}

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data = body as Partial<PageSeoListItem> & {
    pageSlug?: unknown;
    pageTitle?: unknown;
  };
  if (typeof data.pageSlug !== 'string' || data.pageSlug.trim() === '') {
    return NextResponse.json(
      { error: '`pageSlug` is required' },
      { status: 400 },
    );
  }
  if (typeof data.pageTitle !== 'string' || data.pageTitle.trim() === '') {
    return NextResponse.json(
      { error: '`pageTitle` is required' },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.pageSeo.create({
      data: {
        pageSlug: data.pageSlug.trim(),
        pageTitle: data.pageTitle.trim(),
        metaTitle: typeof data.metaTitle === 'string' ? data.metaTitle : null,
        metaDescription:
          typeof data.metaDescription === 'string' ? data.metaDescription : null,
        ogTitle: typeof data.ogTitle === 'string' ? data.ogTitle : null,
        ogDescription:
          typeof data.ogDescription === 'string' ? data.ogDescription : null,
        ogImage: typeof data.ogImage === 'string' ? data.ogImage : null,
        canonicalUrl:
          typeof data.canonicalUrl === 'string' ? data.canonicalUrl : null,
        noIndex: data.noIndex === true,
        noFollow: data.noFollow === true,
        schemaMarkup:
          typeof data.schemaMarkup === 'string' ? data.schemaMarkup : null,
        focusKeyword:
          typeof data.focusKeyword === 'string' ? data.focusKeyword : null,
        keywords: typeof data.keywords === 'string' ? data.keywords : null,
      },
    });
    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/seo/pages] failed:', err);
    return NextResponse.json(
      { error: 'Could not create page (slug may already exist)' },
      { status: 400 },
    );
  }
}
