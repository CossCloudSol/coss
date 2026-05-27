import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
    });
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(batch);
  } catch (err) {
    console.error('[GET /api/admin/batches/[id]]', err);
    return NextResponse.json({ error: 'Failed to load batch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const batch = await prisma.batch.update({
      where: { id: params.id },
      data: {
        courseId:       body.courseId       as string,
        batchName:      body.batchName      as string,
        mode:           body.mode           as string,
        centre:         (body.centre as string)    || null,
        startDate:      new Date(body.startDate as string),
        endDate:        body.endDate ? new Date(body.endDate as string) : null,
        schedule:       body.schedule       as string,
        totalSeats:     body.totalSeats     ? Number(body.totalSeats)     : null,
        seatsAvailable: body.seatsAvailable ? Number(body.seatsAvailable) : null,
        trainer:        (body.trainer as string)   || null,
        price:          body.price          ? Number(body.price)          : null,
        status:         (body.status as string)    || 'upcoming',
        featured:       Boolean(body.featured),
        notes:          (body.notes as string)     || null,
      },
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
    });
    return NextResponse.json(batch);
  } catch (err) {
    console.error('[PUT /api/admin/batches/[id]]', err);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.batch.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/batches/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
