-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Matches Prisma's own generated SQL shape for this schema (TEXT ids, no
-- DB-level default for cuid()/@updatedAt — both are set client-side by
-- Prisma), so `prisma generate` introspects cleanly afterward.
--
-- MediaAsset: sidecar metadata for Cloudinary assets (alt text, title, tags).
-- No foreign keys, no relations, no backfill. Starts empty.

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- ============================================================

-- DropTable
DROP TABLE IF EXISTS "MediaAsset";
