import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// Prisma uses Node built-ins — cannot run on Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set([
  'new',
  'reviewing',
  'sent',
  'won',
  'lost',
]);

interface RouteContext {
  params: { id: string };
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/admin/corporate/[id]                                           */
/*  Body: { status: "new" | "reviewing" | "sent" | "won" | "lost" }           */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch = body as { status?: unknown };
  const nextStatus =
    typeof patch.status === 'string' ? patch.status.toLowerCase() : null;

  if (nextStatus === null || !ALLOWED_STATUS.has(nextStatus)) {
    return NextResponse.json(
      {
        error:
          'Invalid `status` — must be new, reviewing, sent, won or lost',
      },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.corporateLead.update({
      where: { id: params.id },
      data: { status: nextStatus },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        email: true,
        trainingDomain: true,
        employeeCount: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Corporate lead not found' },
        { status: 404 },
      );
    }
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/admin/corporate/[id]                                          */
/*  Hard delete — no related rows to cascade.                                 */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.corporateLead.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Corporate lead not found' },
        { status: 404 },
      );
    }
    throw err;
  }
}
