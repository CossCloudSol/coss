-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Adds an optional brochure/syllabus PDF URL to Course, following the existing
-- thumbnail nullable-string-column convention. No default, no backfill —
-- every existing course starts with brochureUrl = NULL and the public
-- "Download Brochure" button stays hidden until an admin uploads one.

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "brochureUrl" TEXT;


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DropColumn
ALTER TABLE "Course" DROP COLUMN IF EXISTS "brochureUrl";
