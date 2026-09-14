import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePaths, getTrainerRevalidationPaths } from '@/lib/revalidate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const trainers = await prisma.trainer.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ trainers });
  } catch (err) {
    console.error('[GET /api/admin/trainers]', err);
    return NextResponse.json({ error: 'Failed to load trainers' }, { status: 500 });
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

  const { name, title } = body as Record<string, string>;
  if (!name || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const trainer = await prisma.trainer.create({
      data: {
        name,
        title,
        category:  (body.category as string)  || null,
        skills:    (body.skills as string)     || null,
        teaches:   (body.teaches as string)    || null,
        startYear: body.startYear ? Number(body.startYear) : null,
        bio:       (body.bio as string)        || null,
        photoUrl:  (body.photoUrl as string)   || null,
        isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : true,
      },
    });
    await revalidatePaths(getTrainerRevalidationPaths());
    return NextResponse.json(trainer, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/trainers]', err);
    return NextResponse.json({ error: 'Failed to create trainer' }, { status: 500 });
  }
}
