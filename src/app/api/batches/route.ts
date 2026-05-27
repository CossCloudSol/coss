import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const mode     = (searchParams.get('mode')     ?? '').trim();
  const centre   = (searchParams.get('centre')   ?? '').trim();
  const courseId = (searchParams.get('courseId') ?? '').trim();
  const featured = searchParams.get('featured');
  const status   = (searchParams.get('status')   ?? '').trim();

  const where: Prisma.BatchWhereInput = {};

  if (status) {
    where.status = status;
  } else {
    where.status = { in: ['upcoming', 'ongoing'] };
  }

  if (mode)     where.mode     = mode;
  if (centre)   where.centre   = centre;
  if (courseId) where.courseId = courseId;
  if (featured === 'true') where.featured = true;

  try {
    const batches = await prisma.batch.findMany({
      where,
      include: {
        course: { select: { title: true, category: true, categorySlug: true } },
      },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json({ batches });
  } catch (err) {
    console.error('[GET /api/batches]', err);
    return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
  }
}
