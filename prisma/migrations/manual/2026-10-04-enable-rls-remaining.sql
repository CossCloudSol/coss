-- 2026-10-04 Row Level Security on the public tables that don't have it yet.
-- Run in the Supabase SQL Editor (production). Not run by Claude.
--
-- Same shape as 2026-08-19-enable-rls.sql (19 tables): RLS on, ZERO policies.
-- With RLS on and no policy, the Supabase API roles (anon, authenticated) get no
-- rows. The app never uses them: there is no supabase-js client in the code, and
-- Prisma connects as role "postgres" (DATABASE_URL and DIRECT_URL, through the
-- Supabase pooler), which STEP 0 confirms bypasses RLS (BYPASSRLS, superuser, or
-- owner of every table without FORCE ROW LEVEL SECURITY).
--
-- EXPECTED: 10 tables, the models added since 2026-08-19:
--   ContentBlock, HiringPartner, HomepageSettings, MediaAsset, MediaScanResult,
--   Redirect, SiteSettings, SocialPost, Testimonial, Trainer
-- STEP 1 lists every public table still without RLS; anything beyond these 10 is
-- a table newer than this file: review it before STEP 3 (STEP 3 only touches the 10).
--
-- No row data changes, so the backup (STEP 2) records each table's RLS state, which
-- is what the rollback (STEP 5) restores.
-- Run order: 0 → 1 → 2 → 3 → 4. STEP 5 only if needed. Run each SELECT on its own.

-- ── STEP 0: CONFIRM the app role bypasses RLS (read-only). STOP if not. ──────
-- Expected: rolsuper = true OR rolbypassrls = true.
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'postgres';

-- Expected 0 rows: every one of the 10 tables is owned by postgres and none has FORCE RLS
-- (an owner bypasses RLS unless FORCE is set). If STEP 0's first query already shows
-- rolbypassrls or rolsuper = true, rows here don't block the change.
SELECT c.relname, pg_get_userbyid(c.relowner) AS owner, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname IN ('ContentBlock', 'HiringPartner', 'HomepageSettings', 'MediaAsset', 'MediaScanResult',
                    'Redirect', 'SiteSettings', 'SocialPost', 'Testimonial', 'Trainer')
  AND (pg_get_userbyid(c.relowner) <> 'postgres' OR c.relforcerowsecurity);

-- ── STEP 1: PREVIEW (read-only) ─────────────────────────────────────────────
-- Expected: the 10 tables above (more only if a newer table exists; see the header).
SELECT c.relname AS table_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
ORDER BY 1;

-- ── STEP 2: BACKUP the current RLS state of the 10 tables ──────────────────
CREATE SCHEMA IF NOT EXISTS coss_backup;
CREATE TABLE coss_backup.rls_state_20261004 AS
SELECT c.relname, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname IN ('ContentBlock', 'HiringPartner', 'HomepageSettings', 'MediaAsset', 'MediaScanResult',
                    'Redirect', 'SiteSettings', 'SocialPost', 'Testimonial', 'Trainer');

-- Expected: 10 rows (relrowsecurity false for each, unless one was already on).
SELECT * FROM coss_backup.rls_state_20261004 ORDER BY 1;

-- ── STEP 3: CHANGE (one transaction) ────────────────────────────────────────
BEGIN;

ALTER TABLE "ContentBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HiringPartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HomepageSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaScanResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redirect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trainer" ENABLE ROW LEVEL SECURITY;

-- (ALTER TABLE has no RETURNING; this is the same result.) Expected: 10 rows, all true.
SELECT c.relname, c.relrowsecurity
FROM pg_class c JOIN coss_backup.rls_state_20261004 b ON b.relname = c.relname
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
ORDER BY 1;

COMMIT;

-- ── STEP 4: VERIFY (read-only) ──────────────────────────────────────────────
-- Expected 0 rows: no public table without RLS (or only tables newer than this file).
SELECT c.relname AS still_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity;

-- Expected 0 rows: no policies were created on these tables.
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('ContentBlock', 'HiringPartner', 'HomepageSettings', 'MediaAsset', 'MediaScanResult',
                    'Redirect', 'SiteSettings', 'SocialPost', 'Testimonial', 'Trainer');

-- Expected: numbers, not an error: the app's role still reads the tables.
SELECT (SELECT count(*) FROM "Trainer") AS trainers, (SELECT count(*) FROM "SiteSettings") AS site_settings,
       (SELECT count(*) FROM "Testimonial") AS testimonials, (SELECT count(*) FROM "Redirect") AS redirects;

-- Then tell Claude "RLS ran": the site is smoke-tested (every sitemap URL, plus the admin
-- pages that read these tables).

-- ── STEP 5: ROLLBACK (only if needed) ───────────────────────────────────────
-- Turns RLS back off on the tables that had it off before STEP 3.
-- BEGIN;
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT relname FROM coss_backup.rls_state_20261004 WHERE NOT relrowsecurity LOOP
--     EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.relname);
--   END LOOP;
-- END $$;
-- SELECT c.relname, c.relrowsecurity FROM pg_class c
-- JOIN coss_backup.rls_state_20261004 b ON b.relname = c.relname ORDER BY 1;
-- COMMIT;
