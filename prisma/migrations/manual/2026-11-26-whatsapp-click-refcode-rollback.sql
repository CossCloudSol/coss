-- 2026-11-26 ROLLBACK for 2026-11-26-whatsapp-click-refcode.sql (PR feat/wa-ref-column). Run in the
-- Supabase SQL Editor only if that change has to be undone, and only BEFORE the feat/wa-ref-column
-- code is live (the code selects and writes "refCode"; with the column gone, every WhatsApp click
-- write and read would fail).
-- Not run by Claude. If the editor asks about RLS, click "Run without RLS" (this file creates no
-- tables and does not touch RLS).
--
-- What it does: drops the column "WhatsAppClick"."refCode". Nothing else changes. One transaction;
-- it stops (nothing changed) unless the column exists. It also stops if any row already holds a
-- ref code: nothing is dropped that has no backup (copy the values somewhere first). Afterwards it
-- checks that the column is gone, that the row count is unchanged and that the RLS setting,
-- policies and indexes of "WhatsAppClick" are as before. The editor may warn that the query is
-- destructive; confirm only if you mean to undo the change.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code. (If the error says "lock
-- timeout", another session was using the table: nothing changed, run the file again.)
-- If you see Success (the last row, both *_ok true): tell Claude Code 'rollback ran'. If a *_ok is
-- false, do not run the file again; paste the row to Claude Code.

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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode') THEN
    RAISE EXCEPTION 'column "WhatsAppClick"."refCode" does not exist; nothing changed';
  END IF;

  LOCK TABLE "WhatsAppClick" IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO rows_before FROM "WhatsAppClick";
  SELECT count(*) INTO cols_before FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick';
  SELECT count(*) INTO idx_before FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'WhatsAppClick';
  SELECT count(*) INTO pol_before FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'WhatsAppClick';
  SELECT relrowsecurity INTO rls_before FROM pg_class WHERE oid = 'public."WhatsAppClick"'::regclass;

  -- only undo while nothing has been recorded (so nothing is lost without a backup)
  IF EXISTS (SELECT 1 FROM "WhatsAppClick" WHERE "refCode" IS NOT NULL) THEN
    RAISE EXCEPTION 'the refCode column already holds values; nothing changed (back them up first)';
  END IF;

  ALTER TABLE "WhatsAppClick" DROP COLUMN "refCode";

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode') THEN
    RAISE EXCEPTION 'the refCode column still exists';
  END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick';
  IF cnt <> cols_before - 1 THEN
    RAISE EXCEPTION 'WhatsAppClick has % columns, expected %', cnt, cols_before - 1;
  END IF;
  IF (SELECT count(*) FROM "WhatsAppClick") <> rows_before THEN
    RAISE EXCEPTION 'row count changed';
  END IF;
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

-- verify (read-only): both *_ok true, and for the record (production today) whatsappclick_columns 16,
-- rls_enabled true, policies 0, indexes 7. The transaction above has already stopped the run unless
-- the RLS setting, policies and indexes are exactly as they were. whatsapp_click_rows is for the record.
SELECT
  NOT EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'WhatsAppClick' AND column_name = 'refCode') AS column_gone_ok,
  to_regclass('public."WhatsAppClick"') IS NOT NULL AS table_ok,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WhatsAppClick') AS whatsappclick_columns,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public."WhatsAppClick"')) AS rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS policies,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'WhatsAppClick') AS indexes,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;
