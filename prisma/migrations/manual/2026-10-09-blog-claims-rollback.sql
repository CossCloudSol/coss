-- 2026-10-09 ROLLBACK for 2026-10-09-blog-claims.sql (item 7, database half).
-- Run in the Supabase SQL Editor only if the blog claims fix has to be undone. Not run by Claude.
--
-- What it does: puts back, exactly as saved before the fix,
--   - the body text (content) and "updatedAt" of the 5 blog posts (coss_backup.blogpost_claims_20261009)
--   - the description ("metaDescription") and "updatedAt" of the PageSeo row
--     'blog/master-aws-devops-in-hyderabad' (coss_backup.pageseo_claims_20261009).
-- Nothing else changes. Note: any edit made in the admin to these 5 posts or that SEO row after
-- the fix ran is overwritten too.
-- One transaction; it stops (nothing changed) unless exactly 5 posts and 1 SEO row are restored
-- and they match the backup afterwards. The backup tables are kept.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'rollback ran'.

BEGIN;

DO $$
DECLARE
  cnt int;
BEGIN
  IF (SELECT count(*) FROM coss_backup.blogpost_claims_20261009) <> 5 THEN
    RAISE EXCEPTION 'expected 5 rows in coss_backup.blogpost_claims_20261009';
  END IF;
  IF (SELECT count(*) FROM coss_backup.pageseo_claims_20261009) <> 1 THEN
    RAISE EXCEPTION 'expected 1 row in coss_backup.pageseo_claims_20261009';
  END IF;

  UPDATE "BlogPost" b
  SET content = k.content, "updatedAt" = k."updatedAt"
  FROM coss_backup.blogpost_claims_20261009 k
  WHERE b.id = k.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 5 THEN RAISE EXCEPTION 'restored % posts (expected 5)', cnt; END IF;

  UPDATE "PageSeo" p
  SET "metaDescription" = k."metaDescription", "updatedAt" = k."updatedAt"
  FROM coss_backup.pageseo_claims_20261009 k
  WHERE p.id = k.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 1 THEN RAISE EXCEPTION 'restored % SEO rows (expected 1)', cnt; END IF;

  SELECT count(*) INTO cnt
  FROM "BlogPost" b JOIN coss_backup.blogpost_claims_20261009 k USING (id)
  WHERE b.content IS DISTINCT FROM k.content OR b."updatedAt" IS DISTINCT FROM k."updatedAt";
  IF cnt <> 0 THEN RAISE EXCEPTION '% posts do not match the backup after restore', cnt; END IF;
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_claims_20261009 k USING (id)
  WHERE p."metaDescription" IS DISTINCT FROM k."metaDescription" OR p."updatedAt" IS DISTINCT FROM k."updatedAt";
  IF cnt <> 0 THEN RAISE EXCEPTION 'the SEO row does not match the backup after restore'; END IF;
END $$;

COMMIT;
