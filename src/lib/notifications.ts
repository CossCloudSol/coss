import { prisma } from '@/lib/db';

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
  | 'finance_it'
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
  content_published: 'finance_it',
  test: null,
};

export async function createNotification(input: CreateNotificationInput) {
  const targetRole =
    input.targetRole !== undefined
      ? input.targetRole
      : DEFAULT_ROLE_MAP[input.type];

  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      targetRole,
    },
  });
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
