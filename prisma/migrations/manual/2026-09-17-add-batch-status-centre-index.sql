-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Not applied by this session; for developer review before running.
--
-- Locality pages (src/app/locations/[locality]/page.tsx, getBranchBatches)
-- now query Batch scoped to a branch's centre instead of fetching every
-- upcoming/ongoing batch nationwide and filtering in JS. This composite
-- index matches that query's WHERE clause (status IN (...) AND centre ...).
--
-- Caveat: the app query uses Prisma's `mode: 'insensitive'` on `centre`
-- (compiles to ILIKE on Postgres) to tolerate the free-text field's casing
-- drift. A plain btree index like this one is used by the planner for the
-- `status` equality/IN check, but Postgres cannot use a plain btree to
-- satisfy an ILIKE comparison on `centre` itself — that would need a
-- functional index (e.g. on lower(centre)) or pg_trgm. Given Batch is a
-- small table for this site, the main win here is eliminating the nationwide
-- fetch (done in the query itself); this index is a reasonable low-risk
-- addition on top, not a claim that it makes the centre match index-only.

-- CreateIndex
CREATE INDEX "Batch_status_centre_idx" ON "Batch"("status", "centre");


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DropIndex
DROP INDEX IF EXISTS "Batch_status_centre_idx";
