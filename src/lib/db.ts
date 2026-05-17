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

// ─── Extended client type ─────────────────────────────────────────────────────

/** PrismaClient extended with models added after the last `prisma generate`. */
type AppPrismaClient = PrismaClient & {
  announcementBar: AnnBarDelegate;
  adminUser: AdminUserDelegate;
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
