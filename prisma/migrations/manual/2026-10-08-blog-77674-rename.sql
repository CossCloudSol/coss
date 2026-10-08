-- 2026-10-08 Blog post /blog/77674-2 → /blog/master-aws-devops-in-hyderabad (S4 approved
-- by Subodh, 7 Oct). The site change ships in code (the post file is renamed and the 308 is in
-- redirects.config.mjs); this file makes the database match:
--   1. adds the managed redirect (Admin → Redirects) /blog/77674-2 → the new URL, status 308,
--      so a later "sync redirects" keeps it;
--   2. moves the post's SEO row (PageSeo "blog/77674-2": its title, description, keywords) to
--      the new slug, and points its canonical URL (and any copy of the old path in its stored
--      schema) at the new URL.
-- Safe to run before or after the code is live: nothing here is read until then.
--
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code "SQL ran".
--
-- INDEPENDENT REVIEW: PASS (8 Oct 2026; minor notes applied: wider old-path and chain checks,
-- UTC timestamps, rollback stops if a re-created redirect remains)
--
-- EXPECTED COUNTS
--   PageSeo rows with pageSlug 'blog/77674-2': 1 (the live page's title "Master AWS DevOps
--   Training in Hyderabad" comes from it), moved to 'blog/master-aws-devops-in-hyderabad'.
--   PageSeo rows already at the new slug: 0.
--   Redirect rows with source '/blog/77674-2': 0 before, 1 after.
--   Redirect rows with source '/blog/master-aws-devops-in-hyderabad': 0 (no loop).
-- Nothing else changes. Running it a second time fails at once (the backup tables exist).
-- Rollback: 2026-10-08-blog-77674-rename-rollback.sql.

BEGIN;

-- ── 1. Backup ───────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS coss_backup;

CREATE TABLE coss_backup.rename_77674_pageseo_20261008 AS
SELECT id, "pageSlug", "canonicalUrl", "schemaMarkup",
       md5((to_jsonb(t) - ARRAY['pageSlug','canonicalUrl','schemaMarkup'])::text) AS rest_md5
FROM "PageSeo" t
WHERE "pageSlug" = 'blog/77674-2';

-- The id of the redirect row this file adds (the rollback deletes exactly that row).
CREATE TABLE coss_backup.rename_77674_redirect_20261008 AS
SELECT gen_random_uuid()::text AS id;

-- ── 2. Change ───────────────────────────────────────────────────────────────
UPDATE "PageSeo" t SET
  "pageSlug"     = 'blog/master-aws-devops-in-hyderabad',
  "canonicalUrl" = regexp_replace("canonicalUrl", '/blog/77674-2(?![0-9A-Za-z-])', '/blog/master-aws-devops-in-hyderabad', 'g'),
  "schemaMarkup" = regexp_replace("schemaMarkup", '/blog/77674-2(?![0-9A-Za-z-])', '/blog/master-aws-devops-in-hyderabad', 'g')
WHERE t.id IN (SELECT id FROM coss_backup.rename_77674_pageseo_20261008);

-- "source" is unique: if the redirect already exists this fails and nothing changes.
INSERT INTO "Redirect" (id, source, destination, "statusCode", "isActive", "createdAt", "updatedAt")
SELECT id, '/blog/77674-2', '/blog/master-aws-devops-in-hyderabad', 308, true,
       now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC'
FROM coss_backup.rename_77674_redirect_20261008;

-- ── 3. Assertions: any failure undoes everything ─────────────────────────────
DO $$
DECLARE
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM coss_backup.rename_77674_pageseo_20261008;
  IF n <> 1 THEN
    RAISE EXCEPTION 'PageSeo: expected 1 row for blog/77674-2, found %', n;
  END IF;

  SELECT count(*) INTO n FROM "PageSeo" WHERE "pageSlug" = 'blog/master-aws-devops-in-hyderabad';
  IF n <> 1 THEN
    RAISE EXCEPTION 'PageSeo: expected exactly 1 row at the new slug, found % (one already existed?)', n;
  END IF;

  SELECT count(*) INTO n FROM "PageSeo" WHERE "pageSlug" = 'blog/77674-2';
  IF n <> 0 THEN
    RAISE EXCEPTION 'PageSeo: % rows still use the old slug', n;
  END IF;

  -- The moved row: no old path left anywhere in it (also the JSON-escaped form, and columns this
  -- file does not rewrite: those must stop the run, not be changed); nothing else changed.
  SELECT count(*) INTO n FROM coss_backup.rename_77674_pageseo_20261008 b JOIN "PageSeo" t USING (id)
  WHERE coalesce(t."canonicalUrl", '') ~ '/blog/77674-2(?![0-9A-Za-z-])'
     OR coalesce(t."schemaMarkup", '') ~ '/blog/77674-2(?![0-9A-Za-z-])'
     OR coalesce(t."schemaMarkup", '') ~ '\\/blog\\/77674-2(?![0-9A-Za-z-])'
     OR coalesce(t."schemaOverride", '') ~ '77674-2(?![0-9A-Za-z-])'
     OR coalesce(t."ogImage", '') ~ '/blog/77674-2(?![0-9A-Za-z-])'
     OR md5((to_jsonb(t) - ARRAY['pageSlug','canonicalUrl','schemaMarkup'])::text) <> b.rest_md5
     OR (b."canonicalUrl" IS NOT NULL AND t."canonicalUrl" IS NULL)
     OR (b."schemaMarkup" IS NOT NULL AND t."schemaMarkup" IS NULL);
  IF n <> 0 THEN
    RAISE EXCEPTION 'PageSeo: the moved row changed in an unexpected way';
  END IF;

  SELECT count(*) INTO n FROM "Redirect" r JOIN coss_backup.rename_77674_redirect_20261008 b USING (id)
  WHERE r.source = '/blog/77674-2' AND r.destination = '/blog/master-aws-devops-in-hyderabad'
    AND r."statusCode" = 308 AND r."isActive";
  IF n <> 1 THEN
    RAISE EXCEPTION 'Redirect: the new row is missing or wrong (% matching rows)', n;
  END IF;

  SELECT count(*) INTO n FROM "Redirect" WHERE source = '/blog/77674-2';
  IF n <> 1 THEN
    RAISE EXCEPTION 'Redirect: % rows for /blog/77674-2 (expected 1)', n;
  END IF;

  SELECT count(*) INTO n FROM "Redirect" WHERE source ~ '^/blog/master-aws-devops-in-hyderabad/?$';
  IF n <> 0 THEN
    RAISE EXCEPTION 'Redirect: the new URL itself redirects (% rows): that would loop', n;
  END IF;

  -- No other redirect points at the old URL (it would become a two-hop chain; the site's
  -- redirect list has none). If one exists, stop: repointing it is a separate decision.
  SELECT count(*) INTO n FROM "Redirect" WHERE destination ~ '^/blog/77674-2/?$';
  IF n <> 0 THEN
    RAISE EXCEPTION 'Redirect: % other rows point at /blog/77674-2 (would chain); nothing changed', n;
  END IF;
END
$$;

COMMIT;
