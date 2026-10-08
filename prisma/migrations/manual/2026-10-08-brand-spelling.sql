-- 2026-10-08 Brand spelling in the database: "Coss Cloud Solutions", and "Coss" when it
-- stands alone (confirmed final by Subodh, 7 Oct). Also removes the retired second phone
-- number (77807 27374) from Admin → Settings.
--
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code "SQL ran".
--
-- INDEPENDENT REVIEW: PASS (8 Oct 2026; two reviews, minor notes applied after the second:
-- entity-apostrophe and mixed-case aborts added to assertion C)
--
-- WHAT IT CHANGES (text only, nothing else)
--   "COSS Cloud Solution(s)"  -> "Coss Cloud Solutions"
--   "Coss Cloud Solution"     -> "Coss Cloud Solutions"
--   "Coss Cloud Solution's"   -> "Coss Cloud Solutions'"
--   "COSS" on its own         -> "Coss" (also in "COSS Cloud <word>", "COSS Team")
--   Left as they are, on purpose: "COSS" inside a web address, link or file name
--   (…-By-COSS-Cloud-….jpg, COSS.jpg, www.COSS…), hashtags (#COSS…), e-mail-like text,
--   words joined with - / _ (COSS-trained, COSS/Ameerpet, COSS_team), and the lower-case
--   phrase "coss cloud solutions". No slug, URL, status, canonical or price changes.
--   SiteSettings.secondaryPhone (the retired 77807 27374) -> empty (NULL). The site does not
--   read this field; the public /api/settings response stops listing the number.
--
-- COLUMNS AND EXPECTED COUNTS (from the read-only scan Subodh ran on 7 Oct, all rows:
-- published, drafts and orphans). Rows per column holding each form:
--   table.column                 "COSS Cloud Solution"  "Coss Cloud Solution"  "COSS"
--   BlogPost.author                       0                     0                 7
--   BlogPost.content                      3                     0                 9
--   BlogPost.excerpt                      0                     0                 4
--   BlogPost.seoDesc                      2                     0                 3
--   BlogPost.seoTitle                     0                     0                 3
--   BlogPost.tags                         0                     0                 3
--   Course.description                    0                     0                33
--   Course.excerpt                        0                     0                27
--   Course.seoDesc                        1                     1                32
--   Course.seoTitle                       0                     1                12
--   CourseCategory.description            0                     0                 1
--   CourseCategory.seoDesc                0                     0                13
--   CourseCategory.seoTitle               0                     0                13
--   PageSeo.keywords                      0                     0                 1
--   PageSeo.metaDescription               2                     0                43
--   PageSeo.metaTitle                     0                     0                18
--   PageSeo.ogDescription                 8                     5                 0
--   PageSeo.ogTitle                      35                     0                 0
--   PageSeo.pageTitle                     7                     5                 0
--   PageSeo.schemaMarkup                  8                     5                 3
--   Testimonial.quote                     5                     0                 7
--   SiteSettings.secondaryPhone: 1 row with the retired number.
--   Rows touched: BlogPost 9-11, Course 33-100, CourseCategory 13-14, PageSeo 43-255,
--   Testimonial 7-12, SiteSettings 1 (a row can hold several forms in several columns;
--   the assertions check every column exactly).
--   Testimonial quotes are students' words: only the brand's spelling changes in them
--   (capitals, plural "s", possessive).
--   Run it at a quiet time: an admin edit or a page view counter changing a touched row
--   while it runs makes it stop (nothing changes; just run it again).
--
-- ORDER: 0 helpers -> 1 backup into coss_backup -> 2 change -> 3 assertions -> drop helpers.
-- The assertions RAISE EXCEPTION (the whole transaction is undone) if:
--   - the counts in the database differ from the scan above (something changed since),
--   - any of the three forms is still left in these columns anywhere in the table,
--   - a changed value differs from its backup by anything other than the brand's capitals
--     and the added "s", or a web address in it changed, or schemaMarkup stops being JSON,
--   - any other column of a touched row changed, a value became NULL, or a phrase doubled,
--   - the retired number is still stored, or more than one Settings row was cleared.
-- Running it a second time fails at once (the backup tables already exist): nothing changes.
-- Rollback: 2026-10-08-brand-spelling-rollback.sql (restores the backed-up columns).

BEGIN;

-- ── 0. Helpers (temporary; dropped before COMMIT) ───────────────────────────
-- 1) capitals: "COSS Cloud Solution…" -> "Coss Cloud Solution…"
-- 2) possessive: "Coss Cloud Solution's" -> "Coss Cloud Solutions'" (straight or curly apostrophe kept)
-- 3) plural: "Coss Cloud Solution" -> "Coss Cloud Solutions"
-- 4) "COSS" on its own -> "Coss" (not inside a web address, file name, hashtag or e-mail)
CREATE FUNCTION pg_temp.coss_fix(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(t, 'COSS Cloud Solution', 'Coss Cloud Solution', 'g'),
               'Coss Cloud Solution([''’])s\M', 'Coss Cloud Solutions\1', 'g'),
             'Coss Cloud Solution\M', 'Coss Cloud Solutions', 'g'),
           '(?<![-/_=#@.])\mCOSS\M(?![-/_@]|\.[A-Za-z0-9])', 'Coss', 'g')
$f$;

CREATE FUNCTION pg_temp.coss_fix_arr(a text[]) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE WHEN a IS NULL THEN NULL
              ELSE ARRAY(SELECT pg_temp.coss_fix(x) FROM unnest(a) WITH ORDINALITY AS u(x, o) ORDER BY o) END
$f$;

-- True when the text holds any form the scan counted (the scan's three patterns), or
-- "COSS Cloud <another word>" (the scan's "COSS" pattern skipped "COSS Cloud"), so every
-- row this file changes is backed up.
CREATE FUNCTION pg_temp.coss_hit(t text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $f$
  SELECT coalesce(t ~ 'COSS Cloud Solution' OR t ~ 'Coss Cloud Solution\M' OR t ~ '\mCOSS\M', false)
$f$;

-- Lower case, singular brand (possessive folded the same way): equal before and after
-- when only the brand's capitals, the plural "s" and the possessive changed.
CREATE FUNCTION pg_temp.coss_norm(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT regexp_replace(
           regexp_replace(lower(t), 'coss cloud solution([''’])s\M', 'coss cloud solutions\1', 'g'),
         'coss cloud solutions?\M', 'coss cloud solution', 'g')
$f$;

-- Every link target in the text, in order: web addresses, src/href values, markdown link targets.
CREATE FUNCTION pg_temp.coss_urls(t text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
  SELECT ARRAY(SELECT m[1] FROM regexp_matches(coalesce(t, ''), '(https?://[^]\s"''<>)]+)', 'g') AS m)
      || ARRAY(SELECT m[1] FROM regexp_matches(coalesce(t, ''), '(?:src|href)\s*=\s*["'']([^"'']*)["'']', 'gi') AS m)
      || ARRAY(SELECT m[1] FROM regexp_matches(coalesce(t, ''), '\]\(([^)\s]+)', 'g') AS m)
$f$;

CREATE FUNCTION pg_temp.coss_is_json(t text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $f$
BEGIN
  IF t IS NULL THEN RETURN false; END IF;
  PERFORM t::jsonb;
  RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END
$f$;

-- ── 1. Backup: every row that holds a form, with the columns this file changes ──
-- rest_md5 fingerprints all the row's OTHER columns (checked unchanged in step 3).
CREATE SCHEMA IF NOT EXISTS coss_backup;

CREATE TABLE coss_backup.brand_blogpost_20261008 AS
SELECT id, "author", "content", "excerpt", "seoDesc", "seoTitle", "tags",
       md5((to_jsonb(t) - ARRAY['author','content','excerpt','seoDesc','seoTitle','tags'])::text) AS rest_md5
FROM "BlogPost" t
WHERE pg_temp.coss_hit("author") OR pg_temp.coss_hit("content") OR pg_temp.coss_hit("excerpt")
   OR pg_temp.coss_hit("seoDesc") OR pg_temp.coss_hit("seoTitle") OR pg_temp.coss_hit("tags"::text);

CREATE TABLE coss_backup.brand_course_20261008 AS
SELECT id, "description", "excerpt", "seoDesc", "seoTitle",
       md5((to_jsonb(t) - ARRAY['description','excerpt','seoDesc','seoTitle'])::text) AS rest_md5
FROM "Course" t
WHERE pg_temp.coss_hit("description") OR pg_temp.coss_hit("excerpt")
   OR pg_temp.coss_hit("seoDesc") OR pg_temp.coss_hit("seoTitle");

CREATE TABLE coss_backup.brand_coursecategory_20261008 AS
SELECT id, "description", "seoDesc", "seoTitle",
       md5((to_jsonb(t) - ARRAY['description','seoDesc','seoTitle'])::text) AS rest_md5
FROM "CourseCategory" t
WHERE pg_temp.coss_hit("description") OR pg_temp.coss_hit("seoDesc") OR pg_temp.coss_hit("seoTitle");

CREATE TABLE coss_backup.brand_pageseo_20261008 AS
SELECT id, "keywords", "metaDescription", "metaTitle", "ogDescription", "ogTitle", "pageTitle", "schemaMarkup",
       md5((to_jsonb(t) - ARRAY['keywords','metaDescription','metaTitle','ogDescription','ogTitle','pageTitle','schemaMarkup'])::text) AS rest_md5
FROM "PageSeo" t
WHERE pg_temp.coss_hit("keywords") OR pg_temp.coss_hit("metaDescription") OR pg_temp.coss_hit("metaTitle")
   OR pg_temp.coss_hit("ogDescription") OR pg_temp.coss_hit("ogTitle") OR pg_temp.coss_hit("pageTitle")
   OR pg_temp.coss_hit("schemaMarkup");

CREATE TABLE coss_backup.brand_testimonial_20261008 AS
SELECT id, "quote",
       md5((to_jsonb(t) - ARRAY['quote'])::text) AS rest_md5
FROM "Testimonial" t
WHERE pg_temp.coss_hit("quote");

CREATE TABLE coss_backup.brand_sitesettings_20261008 AS
SELECT id, "secondaryPhone",
       md5((to_jsonb(t) - ARRAY['secondaryPhone'])::text) AS rest_md5
FROM "SiteSettings" t
WHERE regexp_replace(coalesce("secondaryPhone", ''), '\D', '', 'g') ~ '7780727374$';

-- ── 2. Change: only the backed-up rows (by id), only the backed-up columns ──────
UPDATE "BlogPost" t SET
  "author"   = pg_temp.coss_fix("author"),
  "content"  = pg_temp.coss_fix("content"),
  "excerpt"  = pg_temp.coss_fix("excerpt"),
  "seoDesc"  = pg_temp.coss_fix("seoDesc"),
  "seoTitle" = pg_temp.coss_fix("seoTitle"),
  "tags"     = pg_temp.coss_fix_arr("tags")
WHERE t.id IN (SELECT id FROM coss_backup.brand_blogpost_20261008);

UPDATE "Course" t SET
  "description" = pg_temp.coss_fix("description"),
  "excerpt"     = pg_temp.coss_fix("excerpt"),
  "seoDesc"     = pg_temp.coss_fix("seoDesc"),
  "seoTitle"    = pg_temp.coss_fix("seoTitle")
WHERE t.id IN (SELECT id FROM coss_backup.brand_course_20261008);

UPDATE "CourseCategory" t SET
  "description" = pg_temp.coss_fix("description"),
  "seoDesc"     = pg_temp.coss_fix("seoDesc"),
  "seoTitle"    = pg_temp.coss_fix("seoTitle")
WHERE t.id IN (SELECT id FROM coss_backup.brand_coursecategory_20261008);

UPDATE "PageSeo" t SET
  "keywords"        = pg_temp.coss_fix("keywords"),
  "metaDescription" = pg_temp.coss_fix("metaDescription"),
  "metaTitle"       = pg_temp.coss_fix("metaTitle"),
  "ogDescription"   = pg_temp.coss_fix("ogDescription"),
  "ogTitle"         = pg_temp.coss_fix("ogTitle"),
  "pageTitle"       = pg_temp.coss_fix("pageTitle"),
  "schemaMarkup"    = pg_temp.coss_fix("schemaMarkup")
WHERE t.id IN (SELECT id FROM coss_backup.brand_pageseo_20261008);

UPDATE "Testimonial" t SET
  "quote" = pg_temp.coss_fix("quote")
WHERE t.id IN (SELECT id FROM coss_backup.brand_testimonial_20261008);

UPDATE "SiteSettings" t SET
  "secondaryPhone" = NULL
WHERE t.id IN (SELECT id FROM coss_backup.brand_sitesettings_20261008);

-- ── 3. Assertions: any failure undoes everything ─────────────────────────────
DO $$
DECLARE
  c record;
  n_up bigint; n_sg bigint; n_bare bigint;
  n bigint; n_bak bigint; n_join bigint;
  fix_fn text;
  -- The three forms exactly as the 7 Oct scan counted them.
  p_up   constant text := 'COSS Cloud Solution';
  p_sg   constant text := 'Coss Cloud Solution\M';
  p_bare constant text := '\mCOSS\M(?! Cloud)';
  -- "COSS" that should be gone: on its own, not inside a web address, file name or hashtag.
  p_left constant text := '(?<![-/_=#@.])\mCOSS\M(?![-/_@]|\.[A-Za-z0-9])';
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('BlogPost',       'brand_blogpost_20261008',       'author',           0,  0,  7, false),
    ('BlogPost',       'brand_blogpost_20261008',       'content',          3,  0,  9, false),
    ('BlogPost',       'brand_blogpost_20261008',       'excerpt',          0,  0,  4, false),
    ('BlogPost',       'brand_blogpost_20261008',       'seoDesc',          2,  0,  3, false),
    ('BlogPost',       'brand_blogpost_20261008',       'seoTitle',         0,  0,  3, false),
    ('BlogPost',       'brand_blogpost_20261008',       'tags',             0,  0,  3, true),
    ('Course',         'brand_course_20261008',         'description',      0,  0, 33, false),
    ('Course',         'brand_course_20261008',         'excerpt',          0,  0, 27, false),
    ('Course',         'brand_course_20261008',         'seoDesc',          1,  1, 32, false),
    ('Course',         'brand_course_20261008',         'seoTitle',         0,  1, 12, false),
    ('CourseCategory', 'brand_coursecategory_20261008', 'description',      0,  0,  1, false),
    ('CourseCategory', 'brand_coursecategory_20261008', 'seoDesc',          0,  0, 13, false),
    ('CourseCategory', 'brand_coursecategory_20261008', 'seoTitle',         0,  0, 13, false),
    ('PageSeo',        'brand_pageseo_20261008',        'keywords',         0,  0,  1, false),
    ('PageSeo',        'brand_pageseo_20261008',        'metaDescription',  2,  0, 43, false),
    ('PageSeo',        'brand_pageseo_20261008',        'metaTitle',        0,  0, 18, false),
    ('PageSeo',        'brand_pageseo_20261008',        'ogDescription',    8,  5,  0, false),
    ('PageSeo',        'brand_pageseo_20261008',        'ogTitle',         35,  0,  0, false),
    ('PageSeo',        'brand_pageseo_20261008',        'pageTitle',        7,  5,  0, false),
    ('PageSeo',        'brand_pageseo_20261008',        'schemaMarkup',     8,  5,  3, false),
    ('Testimonial',    'brand_testimonial_20261008',    'quote',            5,  0,  7, false)
  ) AS v(tbl, bak, col, e_up, e_sg, e_bare, is_array) LOOP

    -- A. The backup holds the database as it was: its counts must equal the scan.
    EXECUTE format('SELECT count(*) FILTER (WHERE %1$I::text ~ $1), count(*) FILTER (WHERE %1$I::text ~ $2),
                           count(*) FILTER (WHERE %1$I::text ~ $3) FROM coss_backup.%2$I', c.col, c.bak)
      INTO n_up, n_sg, n_bare USING p_up, p_sg, p_bare;
    IF n_up <> c.e_up OR n_sg <> c.e_sg OR n_bare <> c.e_bare THEN
      RAISE EXCEPTION '%.%: the database differs from the 7 Oct scan (found %/%/%, expected %/%/%)',
        c.tbl, c.col, n_up, n_sg, n_bare, c.e_up, c.e_sg, c.e_bare;
    END IF;

    -- B. Nothing left anywhere in the table.
    EXECUTE format('SELECT count(*) FROM %1$I WHERE %2$I::text ~ $1 OR %2$I::text ~ $2 OR %2$I::text ~ $3', c.tbl, c.col)
      INTO n USING p_up, p_sg, p_left;
    IF n <> 0 THEN
      RAISE EXCEPTION '%.%: % rows still hold the old spelling', c.tbl, c.col, n;
    END IF;

    -- C. Every backed-up row: new value = the fix applied to the old one; only the brand's
    --    capitals and "s" differ; web addresses unchanged; no NULL where there was text;
    --    no doubled phrase and no mixed case ("Coss CLOUD …") introduced; and no possessive
    --    written as an HTML entity (&#39;s, &rsquo;s …), which the fix does not handle.
    fix_fn := CASE WHEN c.is_array THEN 'pg_temp.coss_fix_arr' ELSE 'pg_temp.coss_fix' END;
    EXECUTE format($q$
      SELECT count(*) FROM coss_backup.%2$I b JOIN %1$I t USING (id)
      WHERE t.%3$I IS DISTINCT FROM %4$s(b.%3$I)
         OR pg_temp.coss_norm(t.%3$I::text) IS DISTINCT FROM pg_temp.coss_norm(b.%3$I::text)
         OR pg_temp.coss_urls(t.%3$I::text) IS DISTINCT FROM pg_temp.coss_urls(b.%3$I::text)
         OR (b.%3$I IS NOT NULL AND t.%3$I IS NULL)
         OR (t.%3$I::text ~ 'Solutions Solutions|Coss Coss' AND NOT coalesce(b.%3$I::text ~ 'Solutions Solutions|Coss Coss', false))
         OR (t.%3$I::text ~ '\mCoss CLOUD' AND NOT coalesce(b.%3$I::text ~ '\mCoss CLOUD', false))
         OR b.%3$I::text ~* 'Coss Cloud Solution(&#39;|&#x27;|&apos;|&rsquo;|&#8217;|ʼ)s'
    $q$, c.tbl, c.bak, c.col, fix_fn) INTO n;
    IF n <> 0 THEN
      RAISE EXCEPTION '%.%: % rows changed in an unexpected way', c.tbl, c.col, n;
    END IF;
  END LOOP;

  -- D. Per table: every backed-up row still exists, and none of its other columns changed.
  FOR c IN SELECT * FROM (VALUES
    ('BlogPost',       'brand_blogpost_20261008',       ARRAY['author','content','excerpt','seoDesc','seoTitle','tags']),
    ('Course',         'brand_course_20261008',         ARRAY['description','excerpt','seoDesc','seoTitle']),
    ('CourseCategory', 'brand_coursecategory_20261008', ARRAY['description','seoDesc','seoTitle']),
    ('PageSeo',        'brand_pageseo_20261008',        ARRAY['keywords','metaDescription','metaTitle','ogDescription','ogTitle','pageTitle','schemaMarkup']),
    ('Testimonial',    'brand_testimonial_20261008',    ARRAY['quote']),
    ('SiteSettings',   'brand_sitesettings_20261008',   ARRAY['secondaryPhone'])
  ) AS v(tbl, bak, cols) LOOP
    EXECUTE format('SELECT count(*) FROM coss_backup.%I', c.bak) INTO n_bak;
    EXECUTE format('SELECT count(*) FROM coss_backup.%2$I b JOIN %1$I t USING (id)', c.tbl, c.bak) INTO n_join;
    IF n_bak = 0 OR n_join <> n_bak THEN
      RAISE EXCEPTION '%: backup rows % / rows still present %', c.tbl, n_bak, n_join;
    END IF;
    EXECUTE format('SELECT count(*) FROM coss_backup.%2$I b JOIN %1$I t USING (id)
                    WHERE md5((to_jsonb(t) - $1)::text) <> b.rest_md5', c.tbl, c.bak)
      INTO n USING c.cols;
    IF n <> 0 THEN
      RAISE EXCEPTION '%: % rows changed outside the brand columns', c.tbl, n;
    END IF;
  END LOOP;

  -- E. schemaMarkup that was valid JSON is still valid JSON.
  SELECT count(*) INTO n FROM coss_backup.brand_pageseo_20261008 b JOIN "PageSeo" t USING (id)
  WHERE pg_temp.coss_is_json(b."schemaMarkup") AND NOT pg_temp.coss_is_json(t."schemaMarkup");
  IF n <> 0 THEN
    RAISE EXCEPTION 'PageSeo.schemaMarkup: % rows stopped being valid JSON', n;
  END IF;

  -- F. The retired number: exactly the one row's secondaryPhone cleared, and no
  --    secondaryPhone in SiteSettings still holds it.
  SELECT count(*) INTO n FROM coss_backup.brand_sitesettings_20261008;
  IF n <> 1 THEN
    RAISE EXCEPTION 'SiteSettings: expected 1 row with the retired number, found %', n;
  END IF;
  SELECT count(*) INTO n FROM "SiteSettings"
  WHERE regexp_replace(coalesce("secondaryPhone", ''), '\D', '', 'g') ~ '7780727374$';
  IF n <> 0 THEN
    RAISE EXCEPTION 'SiteSettings: the retired number is still stored (% rows)', n;
  END IF;
  SELECT count(*) INTO n FROM coss_backup.brand_sitesettings_20261008 b JOIN "SiteSettings" t USING (id)
  WHERE t."secondaryPhone" IS NOT NULL;
  IF n <> 0 THEN
    RAISE EXCEPTION 'SiteSettings: % backed-up rows were not cleared', n;
  END IF;
END
$$;

DROP FUNCTION pg_temp.coss_fix(text);
DROP FUNCTION pg_temp.coss_fix_arr(text[]);
DROP FUNCTION pg_temp.coss_hit(text);
DROP FUNCTION pg_temp.coss_norm(text);
DROP FUNCTION pg_temp.coss_urls(text);
DROP FUNCTION pg_temp.coss_is_json(text);

COMMIT;
