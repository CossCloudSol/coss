import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { markAsRead } from '@/lib/notifications';

export const runtime = 'nodejs';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await markAsRead(params.id);
  return NextResponse.json({ success: true });
}
