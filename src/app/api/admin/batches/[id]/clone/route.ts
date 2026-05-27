import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const original = await prisma.batch.findUnique({ where: { id: params.id } });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cloned = await prisma.batch.create({
      data: {
        courseId:       original.courseId,
        batchName:      `${original.batchName} (Copy)`,
        mode:           original.mode,
        centre:         original.centre,
        startDate:      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default: 1 week from now
        endDate:        null,
        schedule:       original.schedule,
        totalSeats:     original.totalSeats,
        seatsAvailable: original.totalSeats, // reset to full
        trainer:        original.trainer,
        price:          original.price,
        status:         'upcoming',
        featured:       false,
        notes:          original.notes,
      },
      include: { course: { select: { title: true, category: true, categorySlug: true } } },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/batches/[id]/clone]', err);
    return NextResponse.json({ error: 'Failed to clone batch' }, { status: 500 });
  }
}
