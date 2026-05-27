import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { field: string; value: string | boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { field, value } = body;
  if (field !== 'status' && field !== 'featured') {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
  }

  try {
    const job = await prisma.job.update({
      where: { id: params.id },
      data: { [field]: value },
    });
    return NextResponse.json(job);
  } catch (err) {
    console.error('[PATCH /api/admin/jobs/[id]/toggle]', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
