import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

// Prisma uses Node built-ins — cannot run on Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Response shape                                                            */
/* -------------------------------------------------------------------------- */

export interface LeadActivityResponseItem {
  id: string;
  action: string;
  note: string;
  createdAt: string; // ISO
}

export interface LeadDetailResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  course: string | null;
  branch: string;
  formType: string;
  status: string;
  message: string | null;
  createdAt: string; // ISO
  activities: LeadActivityResponseItem[];
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const ALLOWED_STATUS = new Set(['new', 'contacted', 'enrolled', 'lost']);
const MAX_NOTE_LENGTH = 2000;

interface RouteContext {
  params: { id: string };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Convert a Prisma Lead row (+ included activities) into the API shape. We
 * accept a loose shape here because the `message` field may or may not exist
 * on the Lead model depending on migration state — we read it defensively.
 */
function serializeLead(
  lead: Record<string, unknown> & {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    course: string | null;
    branch: string;
    formType: string;
    status: string;
    createdAt: Date;
    activities?: Array<{
      id: string;
      action: string;
      note: string;
      createdAt: Date;
    }>;
  },
): LeadDetailResponse {
  const message = typeof lead.message === 'string' ? lead.message : null;
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    course: lead.course,
    branch: lead.branch,
    formType: lead.formType,
    status: lead.status,
    message,
    createdAt: lead.createdAt.toISOString(),
    activities: (lead.activities ?? []).map((activity) => ({
      id: activity.id,
      action: activity.action,
      note: activity.note,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  GET /api/admin/leads/[id]                                                 */
/* -------------------------------------------------------------------------- */

export async function GET(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json(serializeLead(lead));
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/admin/leads/[id]                                               */
/*                                                                            */
/*  Body: { status?: string, note?: string }                                  */
/*                                                                            */
/*  • status present → update lead.status + create LeadActivity(status_changed) */
/*  • note   present → create LeadActivity(note)                              */
/*  Both may appear in the same request (recorded as two activity rows).      */
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

  const patch = body as { status?: unknown; note?: unknown };

  const nextStatus =
    typeof patch.status === 'string' ? patch.status.toLowerCase() : null;
  if (nextStatus !== null && !ALLOWED_STATUS.has(nextStatus)) {
    return NextResponse.json(
      { error: 'Invalid `status` — must be new, contacted, enrolled or lost' },
      { status: 400 },
    );
  }

  const noteRaw = typeof patch.note === 'string' ? patch.note.trim() : '';
  if (noteRaw.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      { error: `Note must be ${MAX_NOTE_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  if (nextStatus === null && noteRaw === '') {
    return NextResponse.json(
      { error: 'Nothing to update — provide `status` and/or `note`' },
      { status: 400 },
    );
  }

  // Skip status-change side effects (activity row + notification) when the
  // requested status matches what's already stored — avoids duplicate
  // "status changed" notifications from redundant PATCHes.
  let statusUnchanged = false;
  if (nextStatus !== null) {
    const current = await prisma.lead.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    statusUnchanged = current.status.toLowerCase() === nextStatus;
    if (statusUnchanged) {
      console.log(
        `[PATCH /api/admin/leads/[id]] No-op: status already "${nextStatus}"`,
        { leadId: params.id, role: session.role ?? 'SUPER_ADMIN' },
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (nextStatus !== null && !statusUnchanged) {
        await tx.lead.update({
          where: { id: params.id },
          data: { status: nextStatus },
        });
        await tx.leadActivity.create({
          data: {
            leadId: params.id,
            action: 'status_changed',
            note: `Status changed to ${nextStatus}`,
          },
        });
      }

      if (noteRaw !== '') {
        await tx.leadActivity.create({
          data: {
            leadId: params.id,
            action: 'note',
            note: noteRaw,
          },
        });
      }
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    throw err;
  }

  // Reload after the transaction so the response always reflects the final
  // state (including the new activity rows).
  const updated = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      activities: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!updated) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (nextStatus !== null && !statusUnchanged) {
    try {
      await createNotification({
        type: 'status_change',
        title: 'Lead status changed',
        body: `${updated.name} moved to ${nextStatus}`,
        link: '/admin/leads',
      });
    } catch (notifErr) {
      console.error('[PATCH /api/admin/leads/[id]] Notification creation failed (non-fatal):', notifErr);
    }
  }

  return NextResponse.json(serializeLead(updated));
}

/* -------------------------------------------------------------------------- */
/*  DELETE /api/admin/leads/[id]                                              */
/*  Cascade on LeadActivity.leadId takes care of child rows.                  */
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
    await prisma.lead.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    throw err;
  }
}
