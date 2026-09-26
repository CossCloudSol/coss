-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Adds an optional free-text "requirements" column to CorporateLead for the
-- corporate form's "Additional requirements" box, which was previously
-- dropped. Nullable, no default, no backfill: existing rows keep NULL.
-- No index: the column is never filtered on.

-- AlterTable
ALTER TABLE "CorporateLead" ADD COLUMN IF NOT EXISTS "requirements" TEXT;


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- Deletes any requirements text saved since the column was added.
-- ============================================================

-- DropColumn
ALTER TABLE "CorporateLead" DROP COLUMN IF EXISTS "requirements";
