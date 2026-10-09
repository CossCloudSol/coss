-- 2026-10-10 Item 5: attribution + consent columns (schema change; additive only).
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- This file creates no tables. If the editor still asks about Row Level Security, click
-- "Run without RLS" (RLS is already on for both tables; adding columns does not change it).
--
-- What it changes: adds empty columns. No existing value is read or rewritten.
--   "Lead"           gclid, fbclid, utmTerm, utmContent                       (text, empty)
--                    lastUtmSource, lastUtmMedium, lastUtmCampaign, lastUtmTerm,
--                    lastUtmContent, lastGclid, lastFbclid, lastReferrer,
--                    lastLandingPage                                          (text, empty)
--                    lastTouchAt, whatsappOptInAt                             (timestamp, empty)
--                    whatsappOptIn                     (true/false, NOT NULL, default false)
--   "CorporateLead"  utmSource, utmMedium, utmCampaign, utmTerm, utmContent, gclid, fbclid,
--                    referrer, landingPage                                    (text, empty)
--                    consentAt                                                (timestamp, empty)
-- 16 + 10 = 26 columns. Lead.consentAt and Lead's utmSource/utmMedium/utmCampaign/referrer/
-- landingPage already exist and are not touched. Adding these columns is instant (no table
-- rewrite: the default false is a constant).
--
-- Safety: one transaction. It stops (nothing changed) if any of the 26 columns already exists,
-- if a row count changes, or if a column does not end up with the expected type, NULL rule and
-- default. Running it a second time fails at once (the columns exist) and changes nothing.
-- Undo: 2026-10-10-attribution-consent-rollback.sql (drops exactly these 26 columns).
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: PASS (10 Oct 2026; note applied: lock_timeout 5s). Tested on in-memory Postgres.

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

  -- none of the new columns exists yet (single run)
  SELECT count(*) INTO cnt FROM information_schema.columns
  WHERE table_schema = 'public' AND (
       (table_name = 'Lead' AND column_name IN ('gclid','fbclid','utmTerm','utmContent','lastUtmSource','lastUtmMedium','lastUtmCampaign','lastUtmTerm','lastUtmContent','lastGclid','lastFbclid','lastReferrer','lastLandingPage','lastTouchAt','whatsappOptIn','whatsappOptInAt'))
    OR (table_name = 'CorporateLead' AND column_name IN ('utmSource','utmMedium','utmCampaign','utmTerm','utmContent','gclid','fbclid','referrer','landingPage','consentAt')));
  IF cnt <> 0 THEN
    RAISE EXCEPTION '% of the new columns already exist; nothing changed (has this file run before?)', cnt;
  END IF;

  ALTER TABLE "Lead"
    ADD COLUMN "gclid"           text,
    ADD COLUMN "fbclid"          text,
    ADD COLUMN "utmTerm"         text,
    ADD COLUMN "utmContent"      text,
    ADD COLUMN "lastUtmSource"   text,
    ADD COLUMN "lastUtmMedium"   text,
    ADD COLUMN "lastUtmCampaign" text,
    ADD COLUMN "lastUtmTerm"     text,
    ADD COLUMN "lastUtmContent"  text,
    ADD COLUMN "lastGclid"       text,
    ADD COLUMN "lastFbclid"      text,
    ADD COLUMN "lastReferrer"    text,
    ADD COLUMN "lastLandingPage" text,
    ADD COLUMN "lastTouchAt"     timestamp(3) without time zone,
    ADD COLUMN "whatsappOptIn"   boolean NOT NULL DEFAULT false,
    ADD COLUMN "whatsappOptInAt" timestamp(3) without time zone;

  ALTER TABLE "CorporateLead"
    ADD COLUMN "utmSource"   text,
    ADD COLUMN "utmMedium"   text,
    ADD COLUMN "utmCampaign" text,
    ADD COLUMN "utmTerm"     text,
    ADD COLUMN "utmContent"  text,
    ADD COLUMN "gclid"       text,
    ADD COLUMN "fbclid"      text,
    ADD COLUMN "referrer"    text,
    ADD COLUMN "landingPage" text,
    ADD COLUMN "consentAt"   timestamp(3) without time zone;

  -- checks: every column has the expected type / NULL rule / default
  SELECT count(*) INTO cnt FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND (
       (c.table_name = 'Lead' AND c.column_name IN ('gclid','fbclid','utmTerm','utmContent','lastUtmSource','lastUtmMedium','lastUtmCampaign','lastUtmTerm','lastUtmContent','lastGclid','lastFbclid','lastReferrer','lastLandingPage')
        AND c.data_type = 'text' AND c.is_nullable = 'YES' AND c.column_default IS NULL)
    OR (c.table_name = 'Lead' AND c.column_name IN ('lastTouchAt','whatsappOptInAt')
        AND c.data_type = 'timestamp without time zone' AND c.datetime_precision = 3 AND c.is_nullable = 'YES' AND c.column_default IS NULL)
    OR (c.table_name = 'Lead' AND c.column_name = 'whatsappOptIn'
        AND c.data_type = 'boolean' AND c.is_nullable = 'NO' AND c.column_default = 'false')
    OR (c.table_name = 'CorporateLead' AND c.column_name IN ('utmSource','utmMedium','utmCampaign','utmTerm','utmContent','gclid','fbclid','referrer','landingPage')
        AND c.data_type = 'text' AND c.is_nullable = 'YES' AND c.column_default IS NULL)
    OR (c.table_name = 'CorporateLead' AND c.column_name = 'consentAt'
        AND c.data_type = 'timestamp without time zone' AND c.datetime_precision = 3 AND c.is_nullable = 'YES' AND c.column_default IS NULL));
  IF cnt <> 26 THEN
    RAISE EXCEPTION 'expected 26 new columns with the right type/NULL rule/default, found %', cnt;
  END IF;

  -- no rows added or lost; existing rows got the defaults
  IF (SELECT count(*) FROM "Lead") <> lead_rows OR (SELECT count(*) FROM "CorporateLead") <> corp_rows THEN
    RAISE EXCEPTION 'row counts changed';
  END IF;
  IF EXISTS (SELECT 1 FROM "Lead" WHERE "whatsappOptIn" IS DISTINCT FROM false OR "whatsappOptInAt" IS NOT NULL OR "lastTouchAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'existing leads did not get the defaults';
  END IF;
END $$;

COMMIT;
