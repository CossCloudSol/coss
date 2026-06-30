import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { markAllAsRead, sessionRoleToFilter } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = sessionRoleToFilter(session.role);
  await markAllAsRead(userRole);
  return NextResponse.json({ success: true });
}
