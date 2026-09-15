import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePaths, getTrainerRevalidationPaths } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const trainer = await prisma.trainer.findUnique({ where: { id: params.id } });
    if (!trainer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(trainer);
  } catch (err) {
    console.error('[GET /api/admin/trainers/[id]]', err);
    return NextResponse.json({ error: 'Failed to load trainer' }, { status: 500 });
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

  const data: {
    name?: string; title?: string;
    category?: string | null; skills?: string | null; teaches?: string | null;
    startYear?: number | null; bio?: string | null; photoUrl?: string | null;
    isVisible?: boolean;
  } = {};

  // A field absent from the body is left untouched; a field present (even
  // empty) is written, since the edit form sends '' to mean "clear this".
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.title === 'string') data.title = body.title;
  if ('category' in body) data.category = (body.category as string) || null;
  if ('skills' in body) data.skills = (body.skills as string) || null;
  if ('teaches' in body) data.teaches = (body.teaches as string) || null;
  if ('startYear' in body) data.startYear = body.startYear ? Number(body.startYear) : null;
  if ('bio' in body) data.bio = (body.bio as string) || null;
  if ('photoUrl' in body) data.photoUrl = (body.photoUrl as string) || null;
  if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;

  try {
    const trainer = await prisma.trainer.update({
      where: { id: params.id },
      data,
    });
    await revalidatePaths(getTrainerRevalidationPaths());
    return NextResponse.json(trainer);
  } catch (err) {
    console.error('[PUT /api/admin/trainers/[id]]', err);
    return NextResponse.json({ error: 'Failed to update trainer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.trainer.delete({ where: { id: params.id } });
    await revalidatePaths(getTrainerRevalidationPaths());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/trainers/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete trainer' }, { status: 500 });
  }
}
