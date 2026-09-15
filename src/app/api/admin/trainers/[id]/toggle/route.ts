import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePaths, getTrainerRevalidationPaths } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: { isVisible?: boolean } = {};
  if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const trainer = await prisma.trainer.update({ where: { id: params.id }, data });
    await revalidatePaths(getTrainerRevalidationPaths());
    return NextResponse.json(trainer);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/trainers/[id]/toggle]', err);
    return NextResponse.json({ error: 'Failed to update trainer' }, { status: 500 });
  }
}
