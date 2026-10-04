import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createRateLimiter, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string } };

// One counted view per visitor and post per 30 minutes, and at most 60 counted
// views per visitor per 10 minutes. Extra calls get 200 and are not counted.
const perPost = createRateLimiter({ max: 1, windowMs: 30 * 60 * 1000 });
const perVisitor = createRateLimiter({ max: 60, windowMs: 10 * 60 * 1000 });

export async function POST(req: NextRequest, { params }: Ctx): Promise<Response> {
  const ip = clientIp(req.headers);
  if (!perVisitor.allow(ip) || !perPost.allow(`${ip}|${params.slug}`)) {
    return NextResponse.json({ ok: true, counted: false });
  }
  try {
    await prisma.blogPost.updateMany({
      where: { slug: params.slug, status: 'published' },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ ok: true, counted: true });
  } catch (err) {
    console.error('[POST /api/blog/[slug]/view]', err);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }
}
