-- 2026-10-10 ROLLBACK for 2026-10-10-pageseo-blog-ranking.sql. Run in the Supabase SQL Editor only
-- if that change has to be undone. Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS" (this file creates no tables).
--
-- What it does: puts back pageTitle, schemaMarkup and "updatedAt" of the 73 blog PageSeo rows
-- exactly as saved in coss_backup.pageseo_blog_ranking_20261010 before the change. Nothing else
-- changes. Any admin edit made to those two columns after the change is overwritten too.
-- One transaction; it stops (nothing changed) unless exactly 73 rows are restored and they match
-- the backup afterwards. The backup table is kept.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'rollback ran'.

BEGIN;

DO $$
DECLARE
  cnt int;
BEGIN
  IF (SELECT count(*) FROM coss_backup.pageseo_blog_ranking_20261010) <> 73 THEN
    RAISE EXCEPTION 'expected 73 rows in coss_backup.pageseo_blog_ranking_20261010';
  END IF;

  UPDATE "PageSeo" p
  SET "pageTitle" = k."pageTitle", "schemaMarkup" = k."schemaMarkup", "updatedAt" = k."updatedAt"
  FROM coss_backup.pageseo_blog_ranking_20261010 k
  WHERE p.id = k.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 73 THEN RAISE EXCEPTION 'restored % rows (expected 73)', cnt; END IF;

  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_blog_ranking_20261010 k USING (id)
  WHERE p."pageTitle" IS DISTINCT FROM k."pageTitle"
     OR p."schemaMarkup" IS DISTINCT FROM k."schemaMarkup"
     OR p."updatedAt" IS DISTINCT FROM k."updatedAt";
  IF cnt <> 0 THEN RAISE EXCEPTION '% rows do not match the backup after restore', cnt; END IF;
END $$;

COMMIT;
