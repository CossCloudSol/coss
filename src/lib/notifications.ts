import { AdminRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendEmail, buildInstantEmail } from '@/lib/email';

export type NotificationType =
  | 'new_lead'
  | 'whatsapp_lead'
  | 'corporate_proposal'
  | 'status_change'
  | 'batch_reminder'
  | 'content_published'
  | 'test';

export type TargetRole =
  | 'admissions_sales'
  | 'support_helpdesk'
  | null;

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  targetRole?: TargetRole;
}

// Default role visibility per event type.
const DEFAULT_ROLE_MAP: Record<NotificationType, TargetRole> = {
  new_lead: 'admissions_sales',
  whatsapp_lead: 'admissions_sales',
  corporate_proposal: 'admissions_sales',
  status_change: 'support_helpdesk',
  batch_reminder: 'support_helpdesk',
  // null → visible to all admin roles (SUPER_ADMIN always sees all; others see targetRole=null too)
  content_published: null,
  test: null,
};

// Urgent = instant email. Digest = batched into daily summary.
const URGENT_TYPES = new Set<NotificationType>([
  'new_lead',
  'whatsapp_lead',
  'corporate_proposal',
]);

export async function createNotification(input: CreateNotificationInput) {
  const targetRole =
    input.targetRole !== undefined
      ? input.targetRole
      : DEFAULT_ROLE_MAP[input.type];

  const notification = await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      targetRole,
    },
  });

  if (URGENT_TYPES.has(input.type)) {
    void sendUrgentEmails(
      { title: input.title, body: input.body, link: input.link ?? null, type: input.type },
      targetRole,
    ).catch((err) => console.error('[notifications] urgent email error:', err));
  }

  return notification;
}

async function sendUrgentEmails(
  notification: { title: string; body: string; link: string | null; type: string },
  targetRole: TargetRole,
) {
  const users = await getAdminUsersForRole(targetRole);
  if (users.length === 0) return;

  const html = buildInstantEmail({
    title: notification.title,
    body: notification.body,
    link: notification.link,
  });

  await Promise.allSettled(
    users.map(async (user) => {
      const enabled = await isEmailEnabled(user.id, notification.type);
      if (!enabled) return;
      try {
        await sendEmail({ to: user.email, subject: notification.title, html });
      } catch (err) {
        console.error(`[notifications] email send failed for ${user.email}:`, err);
      }
    }),
  );
}

// Returns all active AdminUsers who can see a notification with the given targetRole.
// targetRole=null → all users; otherwise the specific role + SUPER_ADMIN.
export async function getAdminUsersForRole(targetRole: TargetRole) {
  if (targetRole === null) {
    return prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, email: true },
    });
  }
  const prismaRole = targetRole.toUpperCase() as AdminRole;
  return prisma.adminUser.findMany({
    where: {
      isActive: true,
      OR: [{ role: prismaRole }, { role: AdminRole.SUPER_ADMIN }],
    },
    select: { id: true, email: true },
  });
}

// Returns true if email notifications are enabled for this user+eventType.
// Defaults to true when no preference row exists.
export async function isEmailEnabled(userId: string, eventType: string): Promise<boolean> {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_eventType: { userId, eventType } },
    select: { email: true },
  });
  return pref === null ? true : pref.email;
}

/**
 * Convert a session role value to the targetRole string stored in the DB.
 * SUPER_ADMIN and env-var admins (no role) get null → they see all notifications.
 */
export function sessionRoleToFilter(
  sessionRole: string | undefined | null,
): string | null {
  if (!sessionRole || sessionRole === 'SUPER_ADMIN') return null;
  // 'ADMISSIONS_SALES' → 'admissions_sales', 'SUPPORT_HELPDESK' → 'support_helpdesk'
  return sessionRole.toLowerCase();
}

export async function getNotificationsForUser(params: {
  userRole: string | null;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { userRole, limit = 30, unreadOnly = false } = params;

  const where: Record<string, unknown> = {};
  if (userRole !== null) {
    where.OR = [{ targetRole: userRole }, { targetRole: null }];
  }
  if (unreadOnly) {
    where.isRead = false;
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUnreadCount(userRole: string | null): Promise<number> {
  const where: Record<string, unknown> = { isRead: false };
  if (userRole !== null) {
    where.OR = [{ targetRole: userRole }, { targetRole: null }];
  }
  return prisma.notification.count({ where });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userRole: string | null) {
  const where: Record<string, unknown> = { isRead: false };
  if (userRole !== null) {
    where.OR = [{ targetRole: userRole }, { targetRole: null }];
  }
  return prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });
}
