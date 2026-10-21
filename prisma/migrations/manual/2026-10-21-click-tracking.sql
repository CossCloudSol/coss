-- 2026-10-21 Click tracking (PR B, feat/click-tracking): schema change, additive only.
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security for the new table, click "Run without RLS":
-- this file turns RLS on for "CtaClick" itself (STEP 2), the same way as every other table.
--
-- What it changes (nothing existing is read or rewritten):
--   NEW TABLE "CtaClick"  one anonymous row per tap on a demo / syllabus / brochure / enrol
--                         button: id, createdAt, kind, ctaId, location, path, pageType,
--                         destination, deviceType (text, required); courseSlug, referrer,
--                         utmSource, utmMedium, utmCampaign, gclid (text, empty allowed).
--                         Indexes on createdAt, kind, ctaId, courseSlug. RLS on, no policies
--                         (the app connects as postgres, which bypasses RLS). Starts empty.
--   "Lead"                sourceCta, sourceLocation, sourcePath        (text, empty)
--   "CorporateLead"       sourceCta, sourceLocation, sourcePath        (text, empty)
--   "CallClick"           ctaId, location                              (text, empty)
--   "WhatsAppClick"       ctaId, location                              (text, empty)
-- 1 table + 10 columns. Adding empty columns is instant (no table rewrite, no default).
-- No personal data: CtaClick has no name, phone, email or IP column.
--
-- The file has three parts. Running it in full runs all three; the editor shows STEP 3's row.
--   STEP 1  preview: read-only, shows the state before the change.
--   STEP 2  the change: one transaction with checks. It stops (nothing changed) if the table
--           or any of the 10 columns already exists, if the app role does not bypass RLS, if a
--           row count changes, or if anything does not end up exactly as listed above.
--           Running the file a second time fails at once and changes nothing.
--   STEP 3  verify: read-only, one row; every *_ok column should be true.
-- Undo: 2026-10-21-click-tracking-rollback.sql (drops exactly this table and these columns).
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (STEP 3 row, all true): tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: PASS (21 Oct 2026; optional notes applied: tables locked before counting,
-- lock_timeout 3s, STEP 3 wording, rollback refuses if any tracking data exists).
-- Tested on in-memory Postgres (forward, second run refused, rollback, forward again).

-- ── STEP 1: preview (read-only) ─────────────────────────────────────────────────────────
-- Expected: ctaclick_exists false, new_columns_existing 0, app_role_bypasses_rls true.
SELECT
  to_regclass('public."CtaClick"') IS NOT NULL AS ctaclick_exists,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND (
         (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
      OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')))) AS new_columns_existing,
  (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = 'postgres') AS app_role_bypasses_rls,
  (SELECT count(*) FROM "Lead") AS lead_rows,
  (SELECT count(*) FROM "CorporateLead") AS corporate_lead_rows,
  (SELECT count(*) FROM "CallClick") AS call_click_rows,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;

-- ── STEP 2: the change (one transaction) ────────────────────────────────────────────────
BEGIN;
-- if another session holds a lock on these tables, stop cleanly instead of making forms wait
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  lead_rows bigint;
  corp_rows bigint;
  call_rows bigint;
  wa_rows   bigint;
  cnt int;
BEGIN
  -- the app connects as postgres; RLS with no policies must not hide rows from it
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres' AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'role postgres does not bypass RLS; nothing changed';
  END IF;

  -- single run: nothing from this file exists yet
  IF to_regclass('public."CtaClick"') IS NOT NULL THEN
    RAISE EXCEPTION 'table "CtaClick" already exists; nothing changed (has this file run before?)';
  END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
    OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')));
  IF cnt <> 0 THEN
    RAISE EXCEPTION '% of the new columns already exist; nothing changed (has this file run before?)', cnt;
  END IF;

  -- hold the four tables still (reads continue, inserts wait) so the counts below can't drift
  LOCK TABLE "Lead", "CorporateLead", "CallClick", "WhatsAppClick" IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO lead_rows FROM "Lead";
  SELECT count(*) INTO corp_rows FROM "CorporateLead";
  SELECT count(*) INTO call_rows FROM "CallClick";
  SELECT count(*) INTO wa_rows   FROM "WhatsAppClick";

  -- Same shape as Prisma's generated SQL: TEXT id with no DB default (cuid() is set by Prisma).
  CREATE TABLE public."CtaClick" (
    "id"          TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind"        TEXT NOT NULL,
    "ctaId"       TEXT NOT NULL,
    "location"    TEXT NOT NULL,
    "path"        TEXT NOT NULL,
    "pageType"    TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "courseSlug"  TEXT,
    "deviceType"  TEXT NOT NULL,
    "referrer"    TEXT,
    "utmSource"   TEXT,
    "utmMedium"   TEXT,
    "utmCampaign" TEXT,
    "gclid"       TEXT,
    CONSTRAINT "CtaClick_pkey" PRIMARY KEY ("id")
  );
  CREATE INDEX "CtaClick_createdAt_idx"  ON "CtaClick"("createdAt");
  CREATE INDEX "CtaClick_kind_idx"       ON "CtaClick"("kind");
  CREATE INDEX "CtaClick_ctaId_idx"      ON "CtaClick"("ctaId");
  CREATE INDEX "CtaClick_courseSlug_idx" ON "CtaClick"("courseSlug");
  ALTER TABLE "CtaClick" ENABLE ROW LEVEL SECURITY;

  ALTER TABLE "Lead"
    ADD COLUMN "sourceCta"      TEXT,
    ADD COLUMN "sourceLocation" TEXT,
    ADD COLUMN "sourcePath"     TEXT;
  ALTER TABLE "CorporateLead"
    ADD COLUMN "sourceCta"      TEXT,
    ADD COLUMN "sourceLocation" TEXT,
    ADD COLUMN "sourcePath"     TEXT;
  ALTER TABLE "CallClick"
    ADD COLUMN "ctaId"    TEXT,
    ADD COLUMN "location" TEXT;
  ALTER TABLE "WhatsAppClick"
    ADD COLUMN "ctaId"    TEXT,
    ADD COLUMN "location" TEXT;

  -- checks: CtaClick has exactly the 15 columns, with the right type and NULL rule
  SELECT count(*) INTO cnt FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'CtaClick';
  IF cnt <> 15 THEN RAISE EXCEPTION 'CtaClick has % columns, expected 15', cnt; END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'CtaClick' AND (
       (c.column_name IN ('id', 'kind', 'ctaId', 'location', 'path', 'pageType', 'destination', 'deviceType')
        AND c.data_type = 'text' AND c.is_nullable = 'NO' AND c.column_default IS NULL)
    OR (c.column_name IN ('courseSlug', 'referrer', 'utmSource', 'utmMedium', 'utmCampaign', 'gclid')
        AND c.data_type = 'text' AND c.is_nullable = 'YES' AND c.column_default IS NULL)
    OR (c.column_name = 'createdAt'
        AND c.data_type = 'timestamp without time zone' AND c.datetime_precision = 3
        AND c.is_nullable = 'NO' AND c.column_default = 'CURRENT_TIMESTAMP'));
  IF cnt <> 15 THEN RAISE EXCEPTION 'expected 15 CtaClick columns with the right type/NULL rule/default, found %', cnt; END IF;

  -- primary key on id and the four indexes, each on the expected single column
  SELECT count(*) INTO cnt FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'CtaClick' AND (
       (indexname = 'CtaClick_pkey'           AND indexdef LIKE '%UNIQUE INDEX%(id)')
    OR (indexname = 'CtaClick_createdAt_idx'  AND indexdef LIKE '%("createdAt")')
    OR (indexname = 'CtaClick_kind_idx'       AND indexdef LIKE '%(kind)')
    OR (indexname = 'CtaClick_ctaId_idx'      AND indexdef LIKE '%("ctaId")')
    OR (indexname = 'CtaClick_courseSlug_idx' AND indexdef LIKE '%("courseSlug")'));
  IF cnt <> 5 THEN RAISE EXCEPTION 'expected the primary key and 4 indexes on CtaClick, found %', cnt; END IF;

  -- RLS on, no policies
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."CtaClick"'::regclass) THEN
    RAISE EXCEPTION 'RLS is not enabled on CtaClick';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'CtaClick') THEN
    RAISE EXCEPTION 'CtaClick has a policy; expected none';
  END IF;

  -- the 10 new columns: nullable text, no default
  SELECT count(*) INTO cnt FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.data_type = 'text' AND c.is_nullable = 'YES' AND c.column_default IS NULL AND (
       (c.table_name IN ('Lead', 'CorporateLead') AND c.column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
    OR (c.table_name IN ('CallClick', 'WhatsAppClick') AND c.column_name IN ('ctaId', 'location')));
  IF cnt <> 10 THEN RAISE EXCEPTION 'expected 10 new nullable text columns, found %', cnt; END IF;

  -- no rows added or lost; the new table is empty
  IF (SELECT count(*) FROM "Lead") <> lead_rows OR (SELECT count(*) FROM "CorporateLead") <> corp_rows
     OR (SELECT count(*) FROM "CallClick") <> call_rows OR (SELECT count(*) FROM "WhatsAppClick") <> wa_rows THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
  IF EXISTS (SELECT 1 FROM "CtaClick") THEN RAISE EXCEPTION 'CtaClick is not empty'; END IF;
END $$;

COMMIT;

-- ── STEP 3: verify (read-only) ──────────────────────────────────────────────────────────
-- Expected: every *_ok column true. The row counts are for the record (forms may add rows at
-- any time; the transaction itself already checked that the change added or lost none).
SELECT
  to_regclass('public."CtaClick"') IS NOT NULL AS table_ok,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'CtaClick') = 15 AS columns_ok,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CtaClick') = 5 AS indexes_ok,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."CtaClick"'::regclass) AS rls_ok,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND (
         (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
      OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')))) = 10 AS new_columns_ok,
  (SELECT count(*) FROM "Lead") AS lead_rows,
  (SELECT count(*) FROM "CorporateLead") AS corporate_lead_rows,
  (SELECT count(*) FROM "CallClick") AS call_click_rows,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;
