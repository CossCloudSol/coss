import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handles multi-segment pageSlug paths such as:
//   blog/my-post  →  /api/admin/seo/pages/blog/my-post
//   courses/cloud-computing/aws-course-slug  →  /api/admin/seo/pages/courses/...
// Single-segment slugs continue to be handled by [slug]/route.ts.

interface RouteContext {
  params: { slug: string[] };
}

function joinSlug(parts: string[]): string {
  return parts.join('/');
}

const PATCHABLE_KEYS = new Set([
  'pageTitle',
  'metaTitle',
  'metaDescription',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'canonicalUrl',
  'noIndex',
  'noFollow',
  'schemaMarkup',
  'focusKeyword',
  'keywords',
]);

export async function GET(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pageSlug = joinSlug(params.slug);
  const row = await prisma.pageSeo.findUnique({ where: { pageSlug } });
  if (!row) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
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
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
  }

  const data: Prisma.PageSeoUpdateInput = {};
  const incoming = body as Record<string, unknown>;

  for (const key of Object.keys(incoming)) {
    if (!PATCHABLE_KEYS.has(key)) continue;
    const value = incoming[key];
    if (key === 'noIndex' || key === 'noFollow') {
      if (typeof value === 'boolean') {
        (data as Record<string, unknown>)[key] = value;
      }
    } else if (typeof value === 'string') {
      (data as Record<string, unknown>)[key] = value;
    } else if (value === null) {
      (data as Record<string, unknown>)[key] = null;
    }
  }

  const pageSlug = joinSlug(params.slug);
  try {
    const updated = await prisma.pageSeo.update({ where: { pageSlug }, data });
    return NextResponse.json({
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pageSlug = joinSlug(params.slug);
  try {
    await prisma.pageSeo.delete({ where: { pageSlug } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    throw err;
  }
}
