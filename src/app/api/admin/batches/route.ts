import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status   = (searchParams.get('status')   ?? '').trim();
  const mode     = (searchParams.get('mode')     ?? '').trim();
  const centre   = (searchParams.get('centre')   ?? '').trim();
  const courseId = (searchParams.get('courseId') ?? '').trim();

  const where: Prisma.BatchWhereInput = {};
  if (status)   where.status   = status;
  if (mode)     where.mode     = mode;
  if (centre)   where.centre   = centre;
  if (courseId) where.courseId = courseId;

  try {
    const batches = await prisma.batch.findMany({
      where,
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json({ batches });
  } catch (err) {
    console.error('[GET /api/admin/batches]', err);
    return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { courseId, mode, schedule, startDate } = body as Record<string, string>;
  if (!courseId || !mode || !schedule || !startDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Auto-generate batchName if empty
  let batchName = (body.batchName as string) || '';
  if (!batchName) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    const d = new Date(startDate);
    const monthYear = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    batchName = `${course?.title ?? 'Course'} ${monthYear} Batch`;
  }

  // Auto-set status based on startDate
  const start = new Date(startDate);
  const now = new Date();
  let status = (body.status as string) || 'upcoming';
  if (!body.status) {
    if (start > now) status = 'upcoming';
    else if (start.toDateString() === now.toDateString()) status = 'ongoing';
    else status = 'completed';
  }

  try {
    const batch = await prisma.batch.create({
      data: {
        courseId,
        batchName,
        mode,
        centre:         (body.centre as string)    || null,
        startDate:      new Date(startDate),
        endDate:        body.endDate ? new Date(body.endDate as string) : null,
        schedule,
        totalSeats:     body.totalSeats     ? Number(body.totalSeats)     : null,
        seatsAvailable: body.seatsAvailable ? Number(body.seatsAvailable) : null,
        trainer:        (body.trainer as string)   || null,
        price:          body.price          ? Number(body.price)          : null,
        status,
        featured:       Boolean(body.featured),
        notes:          (body.notes as string)     || null,
      },
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/batches]', err);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
