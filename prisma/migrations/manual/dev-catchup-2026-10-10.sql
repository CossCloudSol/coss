-- ═══════════════════════════════════════════════════════════════════════════
-- DEV DATABASE ONLY — never run on production
-- ═══════════════════════════════════════════════════════════════════════════
-- 2026-10-10 dev catch-up: adds the 26 attribution / consent columns of item 5 to the local dev
-- Postgres (.env.development.local), so local lead forms work again ("column does not exist"
-- errors from /api/leads, /api/contact and /api/corporate-leads otherwise).
-- Production already has them: 2026-10-10-attribution-consent.sql (run 10 Oct).
--
-- Guard: it stops (nothing changed) unless the database is the local dev one (coss_local_dev),
-- so even pasted into the Supabase SQL Editor it does nothing. Safe to run twice
-- (ADD COLUMN IF NOT EXISTS). Same columns, types and defaults as the production file.
--
-- Run with the dev URL, from the project root in Git Bash:
--   npx dotenv-cli -e .env.development.local -- npx prisma db execute --file prisma/migrations/manual/dev-catchup-2026-10-10.sql --schema prisma/schema.prisma
-- (dotenv-cli sets the dev URL first, so Prisma's own .env loading can't point it at production.)
-- Then run the VERIFY query at the bottom on the dev DB: it should return no rows.

BEGIN;

DO $$
BEGIN
  IF current_database() <> 'coss_local_dev' THEN
    RAISE EXCEPTION 'This file is for the local dev database (coss_local_dev) only; this is "%". Nothing changed.', current_database();
  END IF;
END $$;

ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "gclid"           text,
  ADD COLUMN IF NOT EXISTS "fbclid"          text,
  ADD COLUMN IF NOT EXISTS "utmTerm"         text,
  ADD COLUMN IF NOT EXISTS "utmContent"      text,
  ADD COLUMN IF NOT EXISTS "lastUtmSource"   text,
  ADD COLUMN IF NOT EXISTS "lastUtmMedium"   text,
  ADD COLUMN IF NOT EXISTS "lastUtmCampaign" text,
  ADD COLUMN IF NOT EXISTS "lastUtmTerm"     text,
  ADD COLUMN IF NOT EXISTS "lastUtmContent"  text,
  ADD COLUMN IF NOT EXISTS "lastGclid"       text,
  ADD COLUMN IF NOT EXISTS "lastFbclid"      text,
  ADD COLUMN IF NOT EXISTS "lastReferrer"    text,
  ADD COLUMN IF NOT EXISTS "lastLandingPage" text,
  ADD COLUMN IF NOT EXISTS "lastTouchAt"     timestamp(3) without time zone,
  ADD COLUMN IF NOT EXISTS "whatsappOptIn"   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "whatsappOptInAt" timestamp(3) without time zone;

ALTER TABLE "CorporateLead"
  ADD COLUMN IF NOT EXISTS "utmSource"   text,
  ADD COLUMN IF NOT EXISTS "utmMedium"   text,
  ADD COLUMN IF NOT EXISTS "utmCampaign" text,
  ADD COLUMN IF NOT EXISTS "utmTerm"     text,
  ADD COLUMN IF NOT EXISTS "utmContent"  text,
  ADD COLUMN IF NOT EXISTS "gclid"       text,
  ADD COLUMN IF NOT EXISTS "fbclid"      text,
  ADD COLUMN IF NOT EXISTS "referrer"    text,
  ADD COLUMN IF NOT EXISTS "landingPage" text,
  ADD COLUMN IF NOT EXISTS "consentAt"   timestamp(3) without time zone;

COMMIT;

-- VERIFY (dev DB): lists any of the 26 columns that is still missing. Expected: no rows.
SELECT e.tbl, e.col AS missing_column
FROM (VALUES
  ('Lead', 'gclid'), ('Lead', 'fbclid'), ('Lead', 'utmTerm'), ('Lead', 'utmContent'),
  ('Lead', 'lastUtmSource'), ('Lead', 'lastUtmMedium'), ('Lead', 'lastUtmCampaign'), ('Lead', 'lastUtmTerm'),
  ('Lead', 'lastUtmContent'), ('Lead', 'lastGclid'), ('Lead', 'lastFbclid'), ('Lead', 'lastReferrer'),
  ('Lead', 'lastLandingPage'), ('Lead', 'lastTouchAt'), ('Lead', 'whatsappOptIn'), ('Lead', 'whatsappOptInAt'),
  ('CorporateLead', 'utmSource'), ('CorporateLead', 'utmMedium'), ('CorporateLead', 'utmCampaign'), ('CorporateLead', 'utmTerm'),
  ('CorporateLead', 'utmContent'), ('CorporateLead', 'gclid'), ('CorporateLead', 'fbclid'), ('CorporateLead', 'referrer'),
  ('CorporateLead', 'landingPage'), ('CorporateLead', 'consentAt')
) AS e(tbl, col)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = e.tbl AND c.column_name = e.col
WHERE c.column_name IS NULL
ORDER BY 1, 2;
