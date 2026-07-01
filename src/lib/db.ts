import { PrismaClient } from '@prisma/client';

// ── Manual type stubs for models not yet in the generated Prisma client ──────
// These exist because `prisma generate` may not have been run since the models
// were added to schema.prisma. Run `npx prisma generate` to regenerate the
// client — after that, PrismaClient will include all these natively and these
// stubs become redundant (but harmless).

// ─── AnnouncementBar ─────────────────────────────────────────────────────────

/** Matches the AnnouncementBar model fields in prisma/schema.prisma */
export type AnnouncementBarRecord = {
  id: string;
  enabled: boolean;
  text: string;
  ctaLabel: string;
  ctaUrl: string;
  bgColor: string;
  textColor: string;
  updatedAt: Date;
};

type AnnBarCreateInput = Omit<AnnouncementBarRecord, 'id' | 'updatedAt'>;
type AnnBarUpdateInput = Partial<AnnBarCreateInput>;

type AnnBarDelegate = {
  findFirst(args?: {
    where?: Partial<AnnouncementBarRecord>;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<AnnouncementBarRecord | null>;
  create(args: { data: AnnBarCreateInput }): Promise<AnnouncementBarRecord>;
  update(args: {
    where: { id: string };
    data: AnnBarUpdateInput;
  }): Promise<AnnouncementBarRecord>;
  upsert(args: {
    where: { id: string };
    create: AnnBarCreateInput;
    update: AnnBarUpdateInput;
  }): Promise<AnnouncementBarRecord>;
  delete(args: { where: { id: string } }): Promise<AnnouncementBarRecord>;
  findMany(args?: object): Promise<AnnouncementBarRecord[]>;
  count(args?: object): Promise<number>;
};

// ─── AdminUser ────────────────────────────────────────────────────────────────

type AdminRoleValue = 'SUPER_ADMIN' | 'ADMISSIONS_SALES' | 'SUPPORT_HELPDESK';

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRoleValue;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AdminUserDelegate = {
  // findUnique is strictly typed so callers get the full field set back.
  findUnique(args: {
    where: { id?: string; email?: string };
    select?: Record<string, boolean>;
  }): Promise<AdminUserRecord | null>;
  // findMany / create / update accept loose Record types to avoid fighting
  // the callers that build their data/select objects dynamically.
  findMany(args?: {
    select?: Record<string, boolean>;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Record<string, unknown>[]>;
  create(args: {
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<Record<string, unknown>>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<AdminUserRecord>;
};

// ─── CourseCategory ───────────────────────────────────────────────────────────
// After `prisma generate`, these types are built into PrismaClient natively.
// The stubs below keep TypeScript happy when the generated client is stale.

export type CourseCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isLegacy: boolean;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── PushSubscription ─────────────────────────────────────────────────────────

export type PushSubscriptionRecord = {
  id: string;
  adminUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date;
};

type PushSubWhereInput = {
  adminUserId?: string | { in: string[] };
  endpoint?: string;
};

type PushSubDelegate = {
  findMany(args?: { where?: PushSubWhereInput }): Promise<PushSubscriptionRecord[]>;
  upsert(args: {
    where: { endpoint: string };
    create: Omit<PushSubscriptionRecord, 'id' | 'createdAt'>;
    update: Partial<Omit<PushSubscriptionRecord, 'id' | 'createdAt'>>;
  }): Promise<PushSubscriptionRecord>;
  delete(args: { where: { id: string } }): Promise<PushSubscriptionRecord>;
};

// ─── NotificationPreference ──────────────────────────────────────────────────

export type NotificationPreferenceRecord = {
  id: string;
  userId: string;
  eventType: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type NotifPrefDelegate = {
  findUnique(args: {
    where: { userId_eventType: { userId: string; eventType: string } };
    select?: Record<string, boolean>;
  }): Promise<NotificationPreferenceRecord | null>;
  findMany(args?: {
    where?: { userId?: string };
    select?: Record<string, boolean>;
  }): Promise<NotificationPreferenceRecord[]>;
  upsert(args: {
    where: { userId_eventType: { userId: string; eventType: string } };
    create: Omit<NotificationPreferenceRecord, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Pick<NotificationPreferenceRecord, 'inApp' | 'push' | 'email'>>;
  }): Promise<NotificationPreferenceRecord>;
};

// ─── Extended client type ─────────────────────────────────────────────────────

/** PrismaClient extended with models added after the last `prisma generate`. */
type AppPrismaClient = PrismaClient & {
  announcementBar: AnnBarDelegate;
  adminUser: AdminUserDelegate;
  pushSubscription: PushSubDelegate;
  notificationPreference: NotifPrefDelegate;
};

// ── Singleton ────────────────────────────────────────────────────────────────

/**
 * Prisma client singleton.
 *
 * In development Next.js hot-reloads modules, which without this guard would
 * spawn a new PrismaClient per reload and exhaust the DB connection pool. We
 * stash the instance on globalThis so HMR re-uses it.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

export const prisma: AppPrismaClient =
  (globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    })) as AppPrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
