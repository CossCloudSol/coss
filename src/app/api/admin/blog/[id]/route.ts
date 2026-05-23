import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error('[GET /api/admin/blog/[id]]', err);
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = (body.status as string) || 'draft';

  const current = await prisma.blogPost.findUnique({ where: { id: params.id }, select: { publishedAt: true, status: true } });
  const wasPublished = current?.status === 'published';
  const nowPublished = status === 'published';

  try {
    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title: body.title as string,
        slug: body.slug as string,
        excerpt: body.excerpt as string,
        content: body.content as string,
        category: body.category as string,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
        thumbnail: (body.thumbnail as string) || null,
        author: (body.author as string) || 'COSS Team',
        authorRole: (body.authorRole as string) || 'Editorial Team',
        readTime: (body.readTime as string) || null,
        status,
        featured: Boolean(body.featured),
        seoTitle: (body.seoTitle as string) || null,
        seoDesc: (body.seoDesc as string) || null,
        publishedAt: nowPublished && !wasPublished ? new Date() : current?.publishedAt,
      },
    });
    return NextResponse.json(post);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PUT /api/admin/blog/[id]]', err);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[DELETE /api/admin/blog/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
