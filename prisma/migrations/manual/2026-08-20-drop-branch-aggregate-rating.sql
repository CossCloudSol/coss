-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
--
-- BranchSettings.aggregateRating was a hardcoded 4.8 default with no real
-- data source (no review-ingestion pipeline), surfaced across TopInfoBar,
-- the homepage testimonials header, the footer, and the /locations pages as
-- an unsubstantiated rating claim. All app-code reads have been removed;
-- this drops the now-dead column. reviewCount is untouched — it stays,
-- still feeding the footer's "N Google reviews" text.

-- AlterTable
ALTER TABLE "BranchSettings" DROP COLUMN "aggregateRating";


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- AlterTable
ALTER TABLE "BranchSettings" ADD COLUMN "aggregateRating" DOUBLE PRECISION NOT NULL DEFAULT 4.8;
