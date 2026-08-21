import webPush from 'web-push';
import { AdminRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sendEmail, buildInstantEmail } from '@/lib/email';

// Configured once — idempotent, safe to call on each import in a serverless env.
if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export type NotificationType =
  | 'new_lead'
  | 'whatsapp_lead'
  | 'corporate_proposal'
  | 'status_change'
  | 'batch_reminder'
  | 'content_published'
  | 'test';

// Event types exposed in the notification preferences UI (excludes 'test').
const PREF_EXCLUDED: ReadonlySet<NotificationType> = new Set(['test']);

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

// Event types where an identical notification created moments earlier is
// almost certainly a duplicate (e.g. a redundant status-change PATCH) rather
// than a legitimate rapid repeat — safe to collapse into a single row.
const DEDUPE_TYPES = new Set<NotificationType>(['status_change']);
const DEDUPE_WINDOW_MS = 15_000;

export async function createNotification(input: CreateNotificationInput) {
  const targetRole =
    input.targetRole !== undefined
      ? input.targetRole
      : DEFAULT_ROLE_MAP[input.type];

  if (DEDUPE_TYPES.has(input.type)) {
    const duplicate = await prisma.notification.findFirst({
      where: {
        type: input.type,
        title: input.title,
        body: input.body,
        targetRole,
        createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      },
    });
    if (duplicate) {
      console.log(
        `[notifications] deduped repeat notification: ${input.type}/"${input.title}" targetRole=${targetRole ?? 'all'}`,
      );
      return duplicate;
    }
  }

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
    try {
      await sendUrgentEmails(
        { title: input.title, body: input.body, link: input.link ?? null, type: input.type },
        targetRole,
      );
    } catch (err) {
      console.error('[notifications] urgent email error:', err);
    }
    try {
      await sendUrgentPush(
        { title: input.title, body: input.body, link: input.link ?? null, type: input.type },
        targetRole,
      );
    } catch (err) {
      console.error('[notifications] urgent push error:', err);
    }
  }

  return notification;
}

async function sendUrgentEmails(
  notification: { title: string; body: string; link: string | null; type: string },
  targetRole: TargetRole,
) {
  const users = await getAdminUsersForRole(targetRole);
  if (users.length === 0) {
    console.log(`[notifications] no recipients matched for ${notification.type}/${targetRole ?? 'all'}, skipping email send`);
    return;
  }

  const html = buildInstantEmail({
    title: notification.title,
    body: notification.body,
    link: notification.link,
  });

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const enabled = await isEmailEnabled(user.id, notification.type);
      if (!enabled) return;
      try {
        const { error } = await sendEmail({ to: user.email, subject: notification.title, html });
        if (error) {
          console.error(
            `[notifications] email send failed: type=${notification.type} to=${user.email} error=${JSON.stringify(error)}`,
          );
        }
      } catch (err) {
        console.error(
          `[notifications] email send threw: type=${notification.type} to=${user.email} error=${err}`,
        );
      }
    }),
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(
        `[notifications] email task rejected: type=${notification.type} reason=${result.reason}`,
      );
    }
  }
}

async function sendUrgentPush(
  notification: { title: string; body: string; link: string | null; type: string },
  targetRole: TargetRole,
) {
  const users = await getAdminUsersForRole(targetRole);
  if (users.length === 0) {
    console.log(`[notifications] no recipients matched for ${targetRole ?? 'all'}, skipping push send`);
    return;
  }

  // Filter to users who have push enabled for this event type.
  const enabledUserIds = (
    await Promise.all(
      users.map(async (u) => ((await isPushEnabled(u.id, notification.type)) ? u.id : null)),
    )
  ).filter((id): id is string => id !== null);

  if (enabledUserIds.length === 0) {
    console.log(`[notifications] push suppressed by preferences for all ${users.length} matched user(s) [${targetRole ?? 'all'}/${notification.type}]`);
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { adminUserId: { in: enabledUserIds } },
  });
  if (subscriptions.length === 0) {
    console.log(`[notifications] no push subscriptions found for ${enabledUserIds.length} matched user(s) [${targetRole ?? 'all'}], skipping push send`);
    return;
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.link ?? '/admin',
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription expired or invalid — clean it up so it stops failing.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[notifications] push send failed for endpoint ${sub.endpoint.slice(0, 40)}…:`, err);
        }
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

// Returns true if push notifications are enabled for this user+eventType.
// Defaults to true when no preference row exists.
export async function isPushEnabled(userId: string, eventType: string): Promise<boolean> {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_eventType: { userId, eventType } },
    select: { push: true },
  });
  return pref === null ? true : pref.push;
}

// Returns the event types visible in the notification preferences UI for a given
// session role. SUPER_ADMIN / null role sees all types; role-specific users see
// only the types they can receive. 'test' is always excluded from the UI.
export function getVisibleEventTypesForRole(
  sessionRole: string | undefined | null,
): NotificationType[] {
  const userTargetRole = sessionRoleToFilter(sessionRole);
  return (Object.entries(DEFAULT_ROLE_MAP) as [NotificationType, TargetRole][])
    .filter(
      ([type, role]) =>
        !PREF_EXCLUDED.has(type) &&
        (userTargetRole === null || role === null || role === userTargetRole),
    )
    .map(([type]) => type);
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

// Deletes all notifications visible to the given role scope (same visibility
// rules as getNotificationsForUser). Note: notifications are broadcast by
// role, not owned per-admin, so this deletes for every admin sharing the
// role — matching the existing markAllAsRead semantics.
export async function deleteAllForRole(userRole: string | null) {
  const where: Record<string, unknown> = {};
  if (userRole !== null) {
    where.OR = [{ targetRole: userRole }, { targetRole: null }];
  }
  return prisma.notification.deleteMany({ where });
}
