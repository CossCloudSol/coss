-- APPLIED to production 25 Sep 2026; record only.
--
-- Adds the CONTENT_SEO_MANAGER admin role (prisma/schema.prisma enum AdminRole; code in
-- 265dbcf, 2026-09-26: src/lib/permissions.ts, src/app/admin/settings/page.tsx). It was
-- applied by hand in the Supabase SQL Editor on 25 Sep, before the deploy, and tested on
-- production (26 Sep security notes). This file was added on 2026-10-04 so that every
-- schema change has a record in this folder; the dev DB got it via
-- dev-catchup-2026-10-04.sql. Re-running is harmless (IF NOT EXISTS).

ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'CONTENT_SEO_MANAGER';

-- Verify (read-only): expected {SUPER_ADMIN,ADMISSIONS_SALES,SUPPORT_HELPDESK,CONTENT_SEO_MANAGER}
SELECT enum_range(NULL::"AdminRole");
