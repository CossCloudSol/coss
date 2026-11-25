-- 2026-11-26 WhatsApp ref code column (PR feat/wa-ref-column): schema change, additive only.
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS": this file creates no
-- table and does not touch RLS (STEP 2 checks that RLS, policies and indexes are exactly as
-- they were).
--
-- What it changes (nothing existing is read or rewritten):
--   "WhatsAppClick"   NEW COLUMN "refCode" (text, empty allowed, no default). It will hold the ref
--                     code the chat opened with, for example W-AWSDEVOPS-G (a course code and one
--                     first-touch channel letter; no name, phone number or other personal data).
--                     Every existing row stays empty.
-- 1 column. Adding an empty nullable column is instant (no table rewrite, no default).
-- No index: the weekly report reads rows by date ("createdAt" is already indexed) and groups them
-- in the app, so nothing filters on "refCode".
-- No backup table: no existing row is read or changed, so there is nothing to restore. The undo
-- is the rollback file (it drops the column, and refuses once the column holds values).
--
-- The file has three parts. Running it in full runs all three; the editor shows STEP 3's row.
--   STEP 1  preview: read-only, one row, the state before the change.
--   STEP 2  the change: one transaction with checks. It stops (nothing changed) if the table is
--           missing, if the column already exists, if the new column is not exactly nullable text
--           with no default, if a row gets a value, or if the column count, row count, RLS setting,
--           policies or indexes of "WhatsAppClick" differ from before (apart from the one new
--           column). Running the file a second time fails at once and changes nothing.
--   STEP 3  verify: read-only, one row; every *_ok column should be true.
-- Undo: 2026-11-26-whatsapp-click-refcode-rollback.sql.
--
-- WHEN: before the feat/wa-ref-column PR is merged. That PR holds the code that selects and
-- writes "refCode" (schema.prisma gets  refCode String?  with it). Deployed before this file ran,
-- every WhatsApp click write and read would fail. Run on its own, this file is invisible to the
-- live site: nothing reads or writes the column yet.
-- If you see ERROR: nothing changed; paste the error to Claude Code. (If the error says "lock
-- timeout", another session was using the table: nothing changed, run the file again.)
-- If you see Success (STEP 3 row, both *_ok true): tell Claude Code 'SQL ran'. If a *_ok is false,
-- do not run the file again; paste the row to Claude Code.
--
-- INDEPENDENT REVIEW: PASS (26 Nov 2026; no blocking findings; wording notes applied).
-- Tested on in-memory Postgres (forward, second run refused, rollback, rollback refused once a ref
-- code exists, forward again, RLS on / policies present / RLS off, table missing: 24 checks).

-- ── STEP 1: preview (read-only) ─────────────────────────────────────────────────────────
-- Expected: table_exists true, refcode_columns_existing 0, and (production today, from schema.prisma
-- and the earlier files) whatsappclick_columns 16, rls_enabled true, policies 0, indexes 7.
-- whatsapp_click_rows is for the record. Run in one go, the editor shows only STEP 3's row; STEP 2
-- stops by itself on anything unexpected, so this part is for reading first if you want to.
SELECT
  to_regclass('public."WhatsAppClick"') IS NOT NULL AS table_exists,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode') AS refcode_columns_existing,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick') AS whatsappclick_columns,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public."WhatsAppClick"')) AS rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS policies,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS indexes,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;

-- ── STEP 2: the change (one transaction) ────────────────────────────────────────────────
BEGIN;
-- if another session holds a lock on this table, stop cleanly instead of making clicks wait
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  rows_before bigint;
  cols_before int;
  idx_before  int;
  pol_before  int;
  rls_before  boolean;
  cnt int;
BEGIN
  IF to_regclass('public."WhatsAppClick"') IS NULL THEN
    RAISE EXCEPTION 'table "WhatsAppClick" does not exist; nothing changed';
  END IF;

  -- single run: the column must not exist yet
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode') THEN
    RAISE EXCEPTION 'column "WhatsAppClick"."refCode" already exists; nothing changed (has this file run before?)';
  END IF;

  -- hold the table still (reads continue, inserts wait) so the numbers below can't drift
  LOCK TABLE "WhatsAppClick" IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO rows_before FROM "WhatsAppClick";
  SELECT count(*) INTO cols_before FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick';
  SELECT count(*) INTO idx_before FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'WhatsAppClick';
  SELECT count(*) INTO pol_before FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'WhatsAppClick';
  SELECT relrowsecurity INTO rls_before FROM pg_class WHERE oid = 'public."WhatsAppClick"'::regclass;

  -- Same shape as Prisma's generated SQL for  refCode String?  (TEXT, no default, NULL allowed).
  ALTER TABLE "WhatsAppClick" ADD COLUMN "refCode" TEXT;

  -- checks: exactly one new column, and it is nullable text with no default
  SELECT count(*) INTO cnt FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick';
  IF cnt <> cols_before + 1 THEN
    RAISE EXCEPTION 'WhatsAppClick has % columns, expected %', cnt, cols_before + 1;
  END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'WhatsAppClick' AND c.column_name = 'refCode'
      AND c.data_type = 'text' AND c.is_nullable = 'YES' AND c.column_default IS NULL;
  IF cnt <> 1 THEN
    RAISE EXCEPTION '"refCode" is not nullable text with no default';
  END IF;

  -- no row added, lost or filled
  IF (SELECT count(*) FROM "WhatsAppClick") <> rows_before THEN
    RAISE EXCEPTION 'row count changed';
  END IF;
  IF EXISTS (SELECT 1 FROM "WhatsAppClick" WHERE "refCode" IS NOT NULL) THEN
    RAISE EXCEPTION 'an existing row has a refCode value';
  END IF;

  -- RLS setting, policies and indexes exactly as before
  IF (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."WhatsAppClick"'::regclass) IS DISTINCT FROM rls_before THEN
    RAISE EXCEPTION 'the RLS setting of WhatsAppClick changed';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') <> pol_before THEN
    RAISE EXCEPTION 'the policies on WhatsAppClick changed';
  END IF;
  IF (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') <> idx_before THEN
    RAISE EXCEPTION 'the indexes on WhatsAppClick changed';
  END IF;
END $$;

COMMIT;

-- ── STEP 3: verify (read-only) ──────────────────────────────────────────────────────────
-- Expected: both *_ok true (existing_rows_empty_ok is only true until the code is live, so read
-- it right after this file runs), and for the record (production today) whatsappclick_columns 17,
-- rls_enabled true, policies 0, indexes 7. STEP 2 has already stopped the run unless the RLS
-- setting, policies and indexes are exactly as they were, so RLS is unchanged whenever you see
-- Success. whatsapp_click_rows is for the record.
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode'
      AND data_type = 'text' AND is_nullable = 'YES' AND column_default IS NULL) = 1 AS refcode_column_ok,
  (SELECT count(*) FROM "WhatsAppClick" WHERE "refCode" IS NOT NULL) = 0 AS existing_rows_empty_ok,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick') AS whatsappclick_columns,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public."WhatsAppClick"')) AS rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS policies,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS indexes,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;
