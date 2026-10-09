-- 2026-10-10 ROLLBACK for 2026-10-10-attribution-consent.sql (item 5). Run in the Supabase SQL
-- Editor only if that change has to be undone, and only BEFORE the item 5 code is live (the code
-- writes these columns; with them gone, lead forms would fail). Not run by Claude.
-- This file creates no tables; if the editor asks about RLS, click "Run without RLS".
--
-- What it does: drops exactly the 26 columns that file added (16 on "Lead", 10 on
-- "CorporateLead"). Any values stored in them are lost. Nothing else changes.
-- One transaction; it stops (nothing changed) unless all 26 columns exist, and checks afterwards
-- that they are gone and the row counts are unchanged.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'rollback ran'.

BEGIN;
-- if another session holds a lock on these tables, stop cleanly instead of making lead forms wait
SET LOCAL lock_timeout = '5s';

DO $$
DECLARE
  lead_rows bigint;
  corp_rows bigint;
  cnt int;
BEGIN
  SELECT count(*) INTO lead_rows FROM "Lead";
  SELECT count(*) INTO corp_rows FROM "CorporateLead";

  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name = 'Lead' AND column_name IN ('gclid','fbclid','utmTerm','utmContent','lastUtmSource','lastUtmMedium','lastUtmCampaign','lastUtmTerm','lastUtmContent','lastGclid','lastFbclid','lastReferrer','lastLandingPage','lastTouchAt','whatsappOptIn','whatsappOptInAt'))
    OR (table_name = 'CorporateLead' AND column_name IN ('utmSource','utmMedium','utmCampaign','utmTerm','utmContent','gclid','fbclid','referrer','landingPage','consentAt')));
  IF cnt <> 26 THEN
    RAISE EXCEPTION 'expected the 26 columns from the attribution file, found %; nothing changed', cnt;
  END IF;

  ALTER TABLE "Lead"
    DROP COLUMN "gclid",
    DROP COLUMN "fbclid",
    DROP COLUMN "utmTerm",
    DROP COLUMN "utmContent",
    DROP COLUMN "lastUtmSource",
    DROP COLUMN "lastUtmMedium",
    DROP COLUMN "lastUtmCampaign",
    DROP COLUMN "lastUtmTerm",
    DROP COLUMN "lastUtmContent",
    DROP COLUMN "lastGclid",
    DROP COLUMN "lastFbclid",
    DROP COLUMN "lastReferrer",
    DROP COLUMN "lastLandingPage",
    DROP COLUMN "lastTouchAt",
    DROP COLUMN "whatsappOptIn",
    DROP COLUMN "whatsappOptInAt";

  ALTER TABLE "CorporateLead"
    DROP COLUMN "utmSource",
    DROP COLUMN "utmMedium",
    DROP COLUMN "utmCampaign",
    DROP COLUMN "utmTerm",
    DROP COLUMN "utmContent",
    DROP COLUMN "gclid",
    DROP COLUMN "fbclid",
    DROP COLUMN "referrer",
    DROP COLUMN "landingPage",
    DROP COLUMN "consentAt";

  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name = 'Lead' AND column_name IN ('gclid','fbclid','utmTerm','utmContent','lastUtmSource','lastUtmMedium','lastUtmCampaign','lastUtmTerm','lastUtmContent','lastGclid','lastFbclid','lastReferrer','lastLandingPage','lastTouchAt','whatsappOptIn','whatsappOptInAt'))
    OR (table_name = 'CorporateLead' AND column_name IN ('utmSource','utmMedium','utmCampaign','utmTerm','utmContent','gclid','fbclid','referrer','landingPage','consentAt')));
  IF cnt <> 0 THEN RAISE EXCEPTION '% columns still exist', cnt; END IF;
  IF (SELECT count(*) FROM "Lead") <> lead_rows OR (SELECT count(*) FROM "CorporateLead") <> corp_rows THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
  -- columns that existed before the attribution file are still there
  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'Lead'
    AND column_name IN ('utmSource','utmMedium','utmCampaign','referrer','landingPage','consentAt');
  IF cnt <> 6 THEN RAISE EXCEPTION 'an older Lead column is missing'; END IF;
END $$;

COMMIT;
