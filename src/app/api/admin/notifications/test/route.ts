import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
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
  const guard = await requireAdmin(req);
  if (guard instanceof Response) return guard;

  const picked =
    TEST_NOTIFICATIONS[Math.floor(Math.random() * TEST_NOTIFICATIONS.length)];
  const notification = await createNotification(picked);

  return NextResponse.json({ success: true, notification });
}
