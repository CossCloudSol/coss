-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Matches Prisma's own generated SQL shape for this schema (TEXT ids, no
-- DB-level default for cuid()/@updatedAt — both are set client-side by
-- Prisma), so `prisma generate` introspects cleanly afterward.
--
-- Trainer: faculty roster for the admin panel and public /faculty section.
-- skills and teaches are comma-separated TEXT, split at render — no array
-- column, matching the Prisma model. No foreign keys, no relations, no
-- backfill. Starts empty.

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "skills" TEXT,
    "teaches" TEXT,
    "startYear" INTEGER,
    "bio" TEXT,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trainer_isVisible_sortOrder_idx" ON "Trainer"("isVisible", "sortOrder");


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DropTable
DROP TABLE IF EXISTS "Trainer";
