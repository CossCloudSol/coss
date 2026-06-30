import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

const TEST_NOTIFICATIONS = [
  {
    type: 'new_lead' as const,
    title: 'New lead — Test User',
    body: 'Cloud Computing inquiry · Online',
    link: '/admin/leads',
  },
  {
    type: 'whatsapp_lead' as const,
    title: 'WhatsApp lead — Test Patil',
    body: 'Cyber Security · Widget submission',
    link: '/admin/whatsapp',
  },
  {
    type: 'corporate_proposal' as const,
    title: 'New corporate proposal',
    body: 'Test Company requested training',
    link: '/admin/corporate',
  },
];

export async function POST(req: NextRequest) {
  const probe = NextResponse.next();
  const session = await getSession(req, probe);
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const picked =
    TEST_NOTIFICATIONS[Math.floor(Math.random() * TEST_NOTIFICATIONS.length)];
  const notification = await createNotification(picked);

  return NextResponse.json({ success: true, notification });
}
