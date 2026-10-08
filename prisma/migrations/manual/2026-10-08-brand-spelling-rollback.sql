-- 2026-10-08 ROLLBACK for 2026-10-08-brand-spelling.sql. Run ONLY if that file ran and
-- its changes must be undone. Run once, in full, in the Supabase SQL Editor (production).
-- Not run by Claude.
--
-- It copies the backed-up columns (and only those) back from coss_backup onto the same
-- rows by id:
--   BlogPost: author, content, excerpt, seoDesc, seoTitle, tags
--   Course: description, excerpt, seoDesc, seoTitle
--   CourseCategory: description, seoDesc, seoTitle
--   PageSeo: keywords, metaDescription, metaTitle, ogDescription, ogTitle, pageTitle, schemaMarkup
--   Testimonial: quote
--   SiteSettings: secondaryPhone
-- An admin edit made to those columns after the change is overwritten by the backup value.
-- The backup tables are kept (drop them later by hand once they are no longer needed).
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code "rollback ran".

BEGIN;

UPDATE "BlogPost" t SET
  "author" = b."author", "content" = b."content", "excerpt" = b."excerpt",
  "seoDesc" = b."seoDesc", "seoTitle" = b."seoTitle", "tags" = b."tags"
FROM coss_backup.brand_blogpost_20261008 b
WHERE t.id = b.id;

UPDATE "Course" t SET
  "description" = b."description", "excerpt" = b."excerpt", "seoDesc" = b."seoDesc", "seoTitle" = b."seoTitle"
FROM coss_backup.brand_course_20261008 b
WHERE t.id = b.id;

UPDATE "CourseCategory" t SET
  "description" = b."description", "seoDesc" = b."seoDesc", "seoTitle" = b."seoTitle"
FROM coss_backup.brand_coursecategory_20261008 b
WHERE t.id = b.id;

UPDATE "PageSeo" t SET
  "keywords" = b."keywords", "metaDescription" = b."metaDescription", "metaTitle" = b."metaTitle",
  "ogDescription" = b."ogDescription", "ogTitle" = b."ogTitle", "pageTitle" = b."pageTitle",
  "schemaMarkup" = b."schemaMarkup"
FROM coss_backup.brand_pageseo_20261008 b
WHERE t.id = b.id;

UPDATE "Testimonial" t SET
  "quote" = b."quote"
FROM coss_backup.brand_testimonial_20261008 b
WHERE t.id = b.id;

UPDATE "SiteSettings" t SET
  "secondaryPhone" = b."secondaryPhone"
FROM coss_backup.brand_sitesettings_20261008 b
WHERE t.id = b.id;

-- Every backed-up row is back to its backed-up values (a missing row is reported too).
DO $$
DECLARE
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM coss_backup.brand_blogpost_20261008 b LEFT JOIN "BlogPost" t USING (id)
  WHERE t.id IS NULL OR (t."author", t."content", t."excerpt", t."seoDesc", t."seoTitle", t."tags")
        IS DISTINCT FROM (b."author", b."content", b."excerpt", b."seoDesc", b."seoTitle", b."tags");
  IF n <> 0 THEN RAISE EXCEPTION 'BlogPost: % rows not restored', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.brand_course_20261008 b LEFT JOIN "Course" t USING (id)
  WHERE t.id IS NULL OR (t."description", t."excerpt", t."seoDesc", t."seoTitle")
        IS DISTINCT FROM (b."description", b."excerpt", b."seoDesc", b."seoTitle");
  IF n <> 0 THEN RAISE EXCEPTION 'Course: % rows not restored', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.brand_coursecategory_20261008 b LEFT JOIN "CourseCategory" t USING (id)
  WHERE t.id IS NULL OR (t."description", t."seoDesc", t."seoTitle")
        IS DISTINCT FROM (b."description", b."seoDesc", b."seoTitle");
  IF n <> 0 THEN RAISE EXCEPTION 'CourseCategory: % rows not restored', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.brand_pageseo_20261008 b LEFT JOIN "PageSeo" t USING (id)
  WHERE t.id IS NULL OR (t."keywords", t."metaDescription", t."metaTitle", t."ogDescription", t."ogTitle", t."pageTitle", t."schemaMarkup")
        IS DISTINCT FROM (b."keywords", b."metaDescription", b."metaTitle", b."ogDescription", b."ogTitle", b."pageTitle", b."schemaMarkup");
  IF n <> 0 THEN RAISE EXCEPTION 'PageSeo: % rows not restored', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.brand_testimonial_20261008 b LEFT JOIN "Testimonial" t USING (id)
  WHERE t.id IS NULL OR t."quote" IS DISTINCT FROM b."quote";
  IF n <> 0 THEN RAISE EXCEPTION 'Testimonial: % rows not restored', n; END IF;

  SELECT count(*) INTO n FROM coss_backup.brand_sitesettings_20261008 b LEFT JOIN "SiteSettings" t USING (id)
  WHERE t.id IS NULL OR t."secondaryPhone" IS DISTINCT FROM b."secondaryPhone";
  IF n <> 0 THEN RAISE EXCEPTION 'SiteSettings: % rows not restored', n; END IF;
END
$$;

COMMIT;
