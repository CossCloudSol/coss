import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

export async function POST(_req: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    await prisma.blogPost.updateMany({
      where: { slug: params.slug, status: 'published' },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/blog/[slug]/view]', err);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }
}
