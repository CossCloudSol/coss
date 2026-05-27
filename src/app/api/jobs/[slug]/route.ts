import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }): Promise<Response> {
  try {
    const now = new Date();
    const job = await prisma.job.findFirst({
      where: {
        slug:   params.slug,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error('[GET /api/jobs/[slug]]', err);
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 });
  }
}
