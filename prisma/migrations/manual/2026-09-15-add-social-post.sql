-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Matches Prisma's own generated SQL shape for this schema (TEXT ids, no
-- DB-level default for cuid()/@updatedAt — both are set client-side by
-- Prisma), so `prisma generate` introspects cleanly afterward.
--
-- SocialPost: scheduled social post pushed to Buffer. channels and
-- bufferPostIds are comma-separated TEXT, split at render — no array
-- column, matching the Prisma model. imageUrl/linkUrl are mutually
-- exclusive per Buffer's schema; imageAltText is required by Buffer
-- whenever imageUrl is set. No foreign keys, no relations, no backfill.
-- Starts empty.

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAltText" TEXT,
    "linkUrl" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "bufferPostIds" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPost_status_scheduledFor_idx" ON "SocialPost"("status", "scheduledFor");


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DropTable
DROP TABLE IF EXISTS "SocialPost";
