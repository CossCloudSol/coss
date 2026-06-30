import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  getNotificationsForUser,
  getUnreadCount,
  sessionRoleToFilter,
} from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = sessionRoleToFilter(session.role);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser({ userRole, unreadOnly }),
    getUnreadCount(userRole),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
