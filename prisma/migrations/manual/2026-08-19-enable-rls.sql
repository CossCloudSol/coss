-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Recorded here after the fact for migration history, per project convention.
--
-- Enables Row Level Security on the 19 tables below that did not yet have it.
-- Deliberately creates ZERO policies. With RLS enabled and no policies, every
-- row is denied by default to the `anon` and `authenticated` Supabase roles —
-- this app never queries through those roles (there is no supabase-js client
-- anywhere in the codebase; see the read-only audit confirming that). Prisma
-- connects as the Postgres owner role, which bypasses RLS entirely by
-- Postgres's own rule (table owners and superusers are exempt from RLS
-- unless FORCE ROW LEVEL SECURITY is also set — not set here), so the admin
-- app's read/write behavior is unaffected.
--
-- Verified by production behavior on tables that already had RLS enabled
-- before this change (same zero-policy, owner-bypass shape) — no regression
-- observed, so this migration extends an already-proven pattern rather than
-- introducing a new one.

-- EnableRowLevelSecurity
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnnouncementBar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BranchSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CorporateLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageSeo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeoSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DisableRowLevelSecurity
ALTER TABLE "AdminUser" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AnnouncementBar" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BranchSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CallClick" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CorporateLead" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseCategory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadActivity" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreference" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PageSeo" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SeoSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppClick" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;
