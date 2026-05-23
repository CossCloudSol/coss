import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: params.slug, status: 'published' },
    });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error('[GET /api/blog/[slug]]', err);
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
}
