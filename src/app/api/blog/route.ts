import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '12')));

  const where: Prisma.BlogPostWhereInput = { status: 'published' };
  if (category) where.category = { contains: category, mode: 'insensitive' };

  try {
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          tags: true,
          thumbnail: true,
          author: true,
          readTime: true,
          featured: true,
          views: true,
          publishedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        publishedAt: p.publishedAt?.toISOString() ?? null,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[GET /api/blog]', err);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
