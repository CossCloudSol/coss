import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') ?? '').trim();
  const status = (searchParams.get('status') ?? '').trim();
  const category = (searchParams.get('category') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '25')));

  const where: Prisma.BlogPostWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          author: true,
          status: true,
          featured: true,
          views: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[GET /api/admin/blog]', err);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
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

  const { title, slug, excerpt, content, category } = body as Record<string, string>;
  if (!title || !slug || !excerpt || !content || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const status = (body.status as string) || 'draft';

  try {
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
        thumbnail: (body.thumbnail as string) || null,
        author: (body.author as string) || 'Coss Cloud Solutions Team',
        authorRole: (body.authorRole as string) || 'Editorial Team',
        readTime: (body.readTime as string) || null,
        status,
        featured: Boolean(body.featured),
        seoTitle: (body.seoTitle as string) || null,
        seoDesc: (body.seoDesc as string) || null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('[POST /api/admin/blog]', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
