import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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

  const pages = await prisma.pageSeo.findMany({
    orderBy: { pageSlug: 'asc' },
    select: {
      id: true,
      pageSlug: true,
      pageTitle: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      canonicalUrl: true,
      noIndex: true,
      noFollow: true,
      focusKeyword: true,
      keywords: true,
      schemaMarkup: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ pages });
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
