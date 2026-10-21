-- 2026-10-21 ROLLBACK for 2026-10-21-click-tracking.sql (PR B). Run in the Supabase SQL Editor
-- only if that change has to be undone, and only BEFORE the PR B code is live (the code writes
-- these columns and the table; with them gone, lead forms and click logging would fail).
-- Not run by Claude. If the editor asks about RLS, click "Run without RLS" (this file creates
-- no tables).
--
-- What it does: drops table "CtaClick" (every click row in it is lost) and exactly the 10
-- columns that file added: "Lead" and "CorporateLead" sourceCta, sourceLocation, sourcePath;
-- "CallClick" and "WhatsAppClick" ctaId, location. Values stored in them are lost. Nothing
-- else changes. One transaction; it stops (nothing changed) unless the table and all 10
-- columns exist, and checks afterwards that they are gone and the row counts are unchanged.
-- It also stops if any tracking data has been recorded yet (a CtaClick row, or a value in any
-- of the 10 columns): nothing is dropped that has no backup. The editor may warn that the query
-- is destructive; confirm only if you mean to undo the change.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (the last row, all *_ok true): tell Claude Code 'rollback ran'.

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
  IF to_regclass('public."CtaClick"') IS NULL THEN
    RAISE EXCEPTION 'table "CtaClick" does not exist; nothing changed';
  END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
    OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')));
  IF cnt <> 10 THEN
    RAISE EXCEPTION 'expected the 10 columns from the click-tracking file, found %; nothing changed', cnt;
  END IF;

  LOCK TABLE "Lead", "CorporateLead", "CallClick", "WhatsAppClick", "CtaClick" IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO lead_rows FROM "Lead";
  SELECT count(*) INTO corp_rows FROM "CorporateLead";
  SELECT count(*) INTO call_rows FROM "CallClick";
  SELECT count(*) INTO wa_rows   FROM "WhatsAppClick";

  -- only undo while nothing has been recorded (so nothing is lost without a backup)
  IF EXISTS (SELECT 1 FROM "CtaClick") THEN
    RAISE EXCEPTION 'CtaClick already has rows; nothing changed (back them up first)';
  END IF;
  IF EXISTS (SELECT 1 FROM "Lead" WHERE "sourceCta" IS NOT NULL OR "sourceLocation" IS NOT NULL OR "sourcePath" IS NOT NULL)
     OR EXISTS (SELECT 1 FROM "CorporateLead" WHERE "sourceCta" IS NOT NULL OR "sourceLocation" IS NOT NULL OR "sourcePath" IS NOT NULL)
     OR EXISTS (SELECT 1 FROM "CallClick" WHERE "ctaId" IS NOT NULL OR "location" IS NOT NULL)
     OR EXISTS (SELECT 1 FROM "WhatsAppClick" WHERE "ctaId" IS NOT NULL OR "location" IS NOT NULL) THEN
    RAISE EXCEPTION 'the new columns already hold values; nothing changed (back them up first)';
  END IF;

  DROP TABLE "CtaClick";
  ALTER TABLE "Lead"
    DROP COLUMN "sourceCta",
    DROP COLUMN "sourceLocation",
    DROP COLUMN "sourcePath";
  ALTER TABLE "CorporateLead"
    DROP COLUMN "sourceCta",
    DROP COLUMN "sourceLocation",
    DROP COLUMN "sourcePath";
  ALTER TABLE "CallClick"
    DROP COLUMN "ctaId",
    DROP COLUMN "location";
  ALTER TABLE "WhatsAppClick"
    DROP COLUMN "ctaId",
    DROP COLUMN "location";

  IF to_regclass('public."CtaClick"') IS NOT NULL THEN RAISE EXCEPTION 'CtaClick still exists'; END IF;
  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
    OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')));
  IF cnt <> 0 THEN RAISE EXCEPTION '% columns still exist', cnt; END IF;
  IF (SELECT count(*) FROM "Lead") <> lead_rows OR (SELECT count(*) FROM "CorporateLead") <> corp_rows
     OR (SELECT count(*) FROM "CallClick") <> call_rows OR (SELECT count(*) FROM "WhatsAppClick") <> wa_rows THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
END $$;

COMMIT;

-- verify (read-only): both *_ok true
SELECT
  to_regclass('public."CtaClick"') IS NULL AS table_gone_ok,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND (
         (table_name IN ('Lead', 'CorporateLead') AND column_name IN ('sourceCta', 'sourceLocation', 'sourcePath'))
      OR (table_name IN ('CallClick', 'WhatsAppClick') AND column_name IN ('ctaId', 'location')))) = 0 AS columns_gone_ok,
  (SELECT count(*) FROM "Lead") AS lead_rows,
  (SELECT count(*) FROM "CorporateLead") AS corporate_lead_rows,
  (SELECT count(*) FROM "CallClick") AS call_click_rows,
  (SELECT count(*) FROM "WhatsAppClick") AS whatsapp_click_rows;
