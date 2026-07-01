import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { getVisibleEventTypesForRole } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveSession(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin || !session.userId) return null;
  return session;
}

// GET /api/admin/notification-preferences
// Returns visible event types (role-filtered) and current preference values,
// defaulting to true (ON) for any event type with no saved row.
export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId as string;
  const eventTypes = getVisibleEventTypesForRole(session.role);

  const rows = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const rowMap = new Map(rows.map((r) => [r.eventType, r]));

  const preferences: Record<string, { email: boolean; push: boolean }> = {};
  for (const type of eventTypes) {
    const row = rowMap.get(type);
    preferences[type] = {
      email: row ? row.email : true,
      push: row ? row.push : true,
    };
  }

  return NextResponse.json({ eventTypes, preferences });
}

const VALID_CHANNELS = new Set(['email', 'push']);

// PATCH /api/admin/notification-preferences
// Body: { eventType: string, channel: "email" | "push", value: boolean }
// Upserts the preference row for the current user. Other channels default to
// true (ON) when a row is created for the first time.
export async function PATCH(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).eventType !== 'string' ||
    typeof (body as Record<string, unknown>).channel !== 'string' ||
    typeof (body as Record<string, unknown>).value !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const { eventType, channel, value } = body as {
    eventType: string;
    channel: string;
    value: boolean;
  };

  if (!VALID_CHANNELS.has(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  const userId = session.userId as string;

  const visibleTypes = getVisibleEventTypesForRole(session.role);
  if (!visibleTypes.includes(eventType as never)) {
    return NextResponse.json({ error: 'Unknown or inaccessible event type' }, { status: 400 });
  }

  // When creating a new row, initialise all channels to ON then apply the
  // specific toggle — this preserves the "no row = ON" contract.
  const createData = {
    userId,
    eventType,
    inApp: true,
    email: true,
    push: true,
    [channel]: value,
  };

  await prisma.notificationPreference.upsert({
    where: { userId_eventType: { userId, eventType } },
    create: createData,
    update: { [channel]: value } as { email?: boolean; push?: boolean },
  });

  return NextResponse.json({ ok: true });
}
