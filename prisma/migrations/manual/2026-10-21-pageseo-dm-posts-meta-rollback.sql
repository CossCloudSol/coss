-- 2026-10-21 ROLLBACK for 2026-10-21-pageseo-dm-posts-meta.sql. Run in the Supabase SQL Editor
-- only if that change has to be undone. Not run by Claude. This file creates no tables.
--
-- What it does: puts "metaTitle", "metaDescription" and "updatedAt" of the two digital-marketing
-- blog PageSeo rows back to the values saved in coss_backup.pageseo_dm_meta_20261021 (joined on
-- id). Nothing else changes. The backup table is kept. One transaction; it stops (nothing
-- changed) unless the backup holds exactly 2 rows, both rows still hold the text the change file
-- set (so a later admin edit is never overwritten silently), and exactly 2 rows are restored.
-- Afterwards revalidate the two pages (Admin → SEO → open the page → Save), or the old text
-- shows only after the next deploy.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (the last result shows both rows back to their old text): tell Claude Code
-- 'rollback ran'.

BEGIN;
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM coss_backup.pageseo_dm_meta_20261021;
  IF cnt <> 2 THEN RAISE EXCEPTION 'backup holds % rows, expected 2; nothing changed', cnt; END IF;

  -- both rows still hold the text the change file set; anything else means someone edited them since
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_dm_meta_20261021 b USING (id)
  WHERE p."metaTitle" IN ('Digital Marketing Training in Dilsukhnagar – Free Demo Class',
                          'Digital Marketing Course & Training in Ameerpet, Hyderabad')
    AND p."metaDescription" IN (
      'Digital marketing training in Dilsukhnagar, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 5,000+ students trained since 2010.',
      'Digital marketing course and training in Ameerpet, Hyderabad: SEO, Google Ads, social media and analytics with live projects. 50+ hiring partners.');
  IF cnt <> 2 THEN RAISE EXCEPTION 'the rows were edited after the change (% of 2 still hold its text); nothing changed', cnt; END IF;

  UPDATE "PageSeo" p SET
    "metaTitle" = b."metaTitle",
    "metaDescription" = b."metaDescription",
    "updatedAt" = b."updatedAt"
  FROM coss_backup.pageseo_dm_meta_20261021 b
  WHERE p.id = b.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 2 THEN RAISE EXCEPTION 'expected 2 rows restored, got %', cnt; END IF;

  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_dm_meta_20261021 b ON b.id = p.id
  WHERE p."metaTitle" IS NOT DISTINCT FROM b."metaTitle"
    AND p."metaDescription" IS NOT DISTINCT FROM b."metaDescription";
  IF cnt <> 2 THEN RAISE EXCEPTION 'restore check failed (% of 2 rows match the backup)', cnt; END IF;
END $$;

COMMIT;

SELECT p."pageSlug", p."metaTitle", p."metaDescription", p."updatedAt"
FROM "PageSeo" p JOIN coss_backup.pageseo_dm_meta_20261021 b ON b.id = p.id
ORDER BY p."pageSlug";
