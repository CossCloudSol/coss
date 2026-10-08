-- 2026-10-08 ROLLBACK for 2026-10-08-blog-77674-rename.sql. Run ONLY if that file ran and
-- must be undone. Run once, in full, in the Supabase SQL Editor (production). Not run by Claude.
--   - deletes exactly the Redirect row that file added (by its saved id);
--   - puts the PageSeo row back on 'blog/77674-2' with its old canonicalUrl and schemaMarkup.
-- The site code still serves the 308 until the code change is reverted too.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code "rollback ran".

BEGIN;

DELETE FROM "Redirect" r
USING coss_backup.rename_77674_redirect_20261008 b
WHERE r.id = b.id;

UPDATE "PageSeo" t SET
  "pageSlug" = b."pageSlug", "canonicalUrl" = b."canonicalUrl", "schemaMarkup" = b."schemaMarkup"
FROM coss_backup.rename_77674_pageseo_20261008 b
WHERE t.id = b.id;

DO $$
DECLARE
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM "Redirect" r JOIN coss_backup.rename_77674_redirect_20261008 b USING (id);
  IF n <> 0 THEN RAISE EXCEPTION 'Redirect: the added row is still there'; END IF;

  -- A later "sync redirects" may have re-created the rule under a new id: stop and ask, rather
  -- than delete a row this file did not add.
  SELECT count(*) INTO n FROM "Redirect" WHERE source = '/blog/77674-2';
  IF n <> 0 THEN RAISE EXCEPTION 'Redirect: % other rows for /blog/77674-2 remain (not added by the rename file); nothing changed', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.rename_77674_pageseo_20261008 b LEFT JOIN "PageSeo" t USING (id)
  WHERE t.id IS NULL OR (t."pageSlug", t."canonicalUrl", t."schemaMarkup") IS DISTINCT FROM (b."pageSlug", b."canonicalUrl", b."schemaMarkup");
  IF n <> 0 THEN RAISE EXCEPTION 'PageSeo: % rows not restored', n; END IF;
END
$$;

COMMIT;
