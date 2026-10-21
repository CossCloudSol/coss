-- 2026-10-21 PageSeo meta title + description for the two digital-marketing blog posts.
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS": this file turns RLS on
-- for the one table it creates (the backup, in the coss_backup schema).
--
-- Why: these two posts are MDX files (their H1 and links change in code, PR fix/tracking-followup),
-- but their search title and description come from their PageSeo rows, which override the file.
--
-- What it changes: two PageSeo rows, columns "metaTitle", "metaDescription" and "updatedAt".
--   pageSlug blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad
--     metaTitle       → Digital Marketing Training in Dilsukhnagar – Free Demo Class
--     metaDescription → Digital marketing training in Dilsukhnagar, Hyderabad: SEO, Google Ads, social
--                       media and analytics with live projects. 5,000+ students trained since 2010.
--   pageSlug blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions
--     metaTitle       → Digital Marketing Course & Training in Ameerpet, Hyderabad
--     metaDescription → Digital marketing course and training in Ameerpet, Hyderabad: SEO, Google Ads,
--                       social media and analytics with live projects. 50+ hiring partners.
-- The site adds " | Coss Cloud Solutions" to the title. Claims used: only "5,000+ students trained",
-- "since 2010", "50+ hiring partners". No other column or row changes.
--
-- Safety: one transaction. Both rows (id, pageSlug, metaTitle, metaDescription, updatedAt) are
-- copied first into coss_backup.pageseo_dm_meta_20261021. Checks then stop everything (nothing
-- changed) unless exactly these 2 rows exist, exactly 2 rows change, they hold the new text, and
-- the PageSeo row count is unchanged. Running it a second time fails at once (the backup table
-- already exists) and changes nothing. Undo: 2026-10-21-pageseo-dm-posts-meta-rollback.sql.
--
-- WHEN: run it BEFORE the fix/tracking-followup merge, so tonight's build renders the new title and
-- description. Run after the deploy instead and the two blog pages keep the old text until they
-- are revalidated (Admin → SEO → open the page → Save, for each of the two pages).
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (STEP 3 shows both rows with the new text): tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: first pass FAIL (21 Oct; must-fix applied: the "updatedAt = now()" checks
-- could never match a TIMESTAMP(3) column; replaced by a backup-join check of the exact text).
-- Re-review: pending. Tested on in-memory Postgres.

-- ── STEP 1: preview (read-only): the two rows as they are now ──────────────────────────────
SELECT "pageSlug", "metaTitle", "metaDescription", "ogTitle", "ogDescription", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',
                     'blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions')
ORDER BY "pageSlug";

-- ── STEP 2: the change (one transaction) ──────────────────────────────────────────────────
BEGIN;
SET LOCAL lock_timeout = '3s';

CREATE TABLE coss_backup.pageseo_dm_meta_20261021 AS
SELECT id, "pageSlug", "metaTitle", "metaDescription", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',
                     'blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions');
ALTER TABLE coss_backup.pageseo_dm_meta_20261021 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  total_before bigint;
  cnt int;
BEGIN
  SELECT count(*) INTO total_before FROM "PageSeo";
  SELECT count(*) INTO cnt FROM coss_backup.pageseo_dm_meta_20261021;
  IF cnt <> 2 THEN
    RAISE EXCEPTION 'expected the 2 PageSeo rows, found %; nothing changed', cnt;
  END IF;

  UPDATE "PageSeo" p SET
    "metaTitle" = v.title,
    "metaDescription" = v.descr,
    "updatedAt" = now()
  FROM (VALUES
    ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',
     'Digital Marketing Training in Dilsukhnagar – Free Demo Class',
     'Digital marketing training in Dilsukhnagar, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 5,000+ students trained since 2010.'),
    ('blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions',
     'Digital Marketing Course & Training in Ameerpet, Hyderabad',
     'Digital marketing course and training in Ameerpet, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 50+ hiring partners.')
  ) AS v(slug, title, descr)
  WHERE p."pageSlug" = v.slug;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 2 THEN RAISE EXCEPTION 'expected 2 rows updated, got %', cnt; END IF;

  -- ROW_COUNT = 2 on the unique pageSlug proves no other row was touched; the row count must hold
  IF (SELECT count(*) FROM "PageSeo") <> total_before THEN RAISE EXCEPTION 'PageSeo row count changed'; END IF;

  -- the backed-up rows (joined on id) now hold exactly the new (slug, title, description) pairs,
  -- within the length limits (title before the brand suffix <= 60) and with no disallowed claims
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_dm_meta_20261021 b USING (id)
  WHERE (p."pageSlug", p."metaTitle", p."metaDescription") IN (
          ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',
           'Digital Marketing Training in Dilsukhnagar – Free Demo Class',
           'Digital marketing training in Dilsukhnagar, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 5,000+ students trained since 2010.'),
          ('blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions',
           'Digital Marketing Course & Training in Ameerpet, Hyderabad',
           'Digital marketing course and training in Ameerpet, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 50+ hiring partners.'))
    AND char_length(p."metaTitle") <= 60 AND char_length(p."metaDescription") <= 160
    AND p."metaDescription" !~* '(placement|placed|guarant|[0-9]+ ?%|lakh|lpa)';
  IF cnt <> 2 THEN RAISE EXCEPTION 'the new title/description did not land as expected (% of 2 rows)', cnt; END IF;
END $$;

COMMIT;

-- ── STEP 3: verify (read-only) ───────────────────────────────────────────────────────────
-- Expected: 2 rows, the new metaTitle and metaDescription, updatedAt = the time you ran it.
SELECT "pageSlug", "metaTitle", char_length("metaTitle") AS title_len,
       "metaDescription", char_length("metaDescription") AS descr_len, "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',
                     'blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions')
ORDER BY "pageSlug";
