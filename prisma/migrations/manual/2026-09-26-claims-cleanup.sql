-- Manual data fix (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Companion to branch fix/claims-cleanup, which made the same fixes in files.
-- Finds and fixes the same texts where they live in the database instead:
--   "BlogPost", "Course", "PageSeo", "CourseCategory".
-- No schema change.
--
-- Run the parts IN ORDER, one at a time:
--   PART 1  read-only search                  (safe to run any time)
--   PART 2  preview of every change           (read-only; creates a
--                                              session-only pg_temp function)
--   PART 3  the fix, in one transaction, with a backup table saved first
--   PART 4  rollback from that backup         (only if needed)
--
-- What PART 3 changes automatically (mechanical, safe to automate):
--   - urdigital.in spam links: unwrapped, anchor text kept (markdown and HTML)
--   - indads.in / click.in / realtrainings.com citations: link and label removed
--   - "?utm_source=chatgpt.com" / "&utm_source=chatgpt.com" stripped from URLs
--   - "located in / based in / Located in the heart of Kukatpally, Hyderabad",
--     "Location:** Kukatpally", "Address: Kukatpally", and the
--     "Ameerpet, Dilsukhnagar, and Kukatpally" centre list -> real branches
--   - "Lifetime LMS" / "Lifetime LMS access" -> "1-year LMS access"
--   - "3,000+ students" -> "5,000+ students"
-- What it does NOT change (PART 1 lists them for a manual edit, because
-- rewording prose safely needs a person): "#1" claims, "pass rate" / "95%",
-- and any other Kukatpally wording (area descriptions, titles, slugs).


-- ============================================================
-- PART 1 — READ-ONLY SEARCH. Lists every field containing a target text.
-- ============================================================

WITH fields (tbl, row_key, col, status, val) AS (
            SELECT 'BlogPost', slug, 'title',        status, title                         FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'excerpt',      status, excerpt                       FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'content',      status, content                       FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'seoTitle',     status, "seoTitle"                    FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'seoDesc',      status, "seoDesc"                     FROM "BlogPost"
  UNION ALL SELECT 'Course',   slug, 'title',        status, title                         FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'description',  status, description                   FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'excerpt',      status, excerpt                       FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'badge',        status, badge                         FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'highlights',   status, array_to_string(highlights, ' | ') FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'syllabus',     status, syllabus::text                FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'seoTitle',     status, "seoTitle"                    FROM "Course"
  UNION ALL SELECT 'Course',   slug, 'seoDesc',      status, "seoDesc"                     FROM "Course"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'pageTitle',       NULL, "pageTitle"            FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'metaTitle',       NULL, "metaTitle"            FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'metaDescription', NULL, "metaDescription"      FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'ogTitle',         NULL, "ogTitle"              FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'ogDescription',   NULL, "ogDescription"        FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'keywords',        NULL, keywords               FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'focusKeyword',    NULL, "focusKeyword"         FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'schemaMarkup',    NULL, "schemaMarkup"         FROM "PageSeo"
  UNION ALL SELECT 'PageSeo',  "pageSlug", 'schemaOverride',  NULL, "schemaOverride"       FROM "PageSeo"
  UNION ALL SELECT 'CourseCategory', slug, 'description', status, description              FROM "CourseCategory"
  UNION ALL SELECT 'CourseCategory', slug, 'seoTitle',    status, "seoTitle"               FROM "CourseCategory"
  UNION ALL SELECT 'CourseCategory', slug, 'seoDesc',     status, "seoDesc"                FROM "CourseCategory"
)
SELECT tbl, row_key, col, status,
       CASE
         WHEN val ~* 'urdigital\.in'                            THEN 'spam link (auto-fix)'
         WHEN val ~* '(indads\.in|click\.in|realtrainings\.com)' THEN 'directory citation (auto-fix)'
         WHEN val ~* 'utm_source=chatgpt\.com'                  THEN 'chatgpt param (auto-fix)'
         WHEN val ~* 'lifetime lms'                             THEN 'lifetime LMS (auto-fix)'
         WHEN val ~  '3,000\+ students'                         THEN '3,000+ (auto-fix)'
         WHEN val ~* 'kukatpally'                               THEN 'Kukatpally (auto-fix only for location statements; review the rest)'
         WHEN val ~* '(pass rate|95 ?%)'                        THEN 'pass rate (MANUAL)'
         ELSE '#1 claim (MANUAL)'
       END AS finding,
       substring(val from '(?i).{0,70}(?:urdigital\.in|indads\.in|click\.in|realtrainings\.com|utm_source=chatgpt\.com|lifetime lms|3,000\+ students|kukatpally|pass rate|95 ?%|#1\M).{0,70}') AS snippet
FROM fields
WHERE val ~* '(urdigital\.in|indads\.in|click\.in|realtrainings\.com|utm_source=chatgpt\.com|lifetime lms|3,000\+ students|kukatpally|pass rate|95 ?%|#1\M)'
ORDER BY tbl, row_key, col;


-- ============================================================
-- PART 2 — PREVIEW. Creates a session-only helper (pg_temp: it disappears
-- when the session ends, touches no table) and shows before/after for every
-- field PART 3 would change. Run PART 2 and PART 3 in the same SQL Editor
-- tab/session, or re-run the CREATE FUNCTION before PART 3.
-- ============================================================

CREATE OR REPLACE FUNCTION pg_temp.clean_claims(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE WHEN t IS NULL THEN NULL ELSE
    replace(replace(replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
      regexp_replace(
        t,
        -- urdigital.in spam links: unwrap, keep the anchor text
        '\[([^]]*)\]\(https?://(www\.)?urdigital\.in[^)]*\)', '\1', 'gi'),
        '<a[^>]*href="https?://(www\.)?urdigital\.in[^"]*"[^>]*>([^<]*)</a>', '\2', 'gi'),
        -- directory / classified-ad citations: remove link and label
        ' ?\[[^]]*\]\(https?://[^)]*(indads\.in|click\.in|realtrainings\.com)[^)]*\)', '', 'gi'),
        ' ?<a[^>]*href="[^"]*(indads\.in|click\.in|realtrainings\.com)[^"]*"[^>]*>[^<]*</a>', '', 'gi'),
        -- false Kukatpally location statements -> real branches
        'Located in (the heart of )?Kukatpally, Hyderabad', 'With branches in Dilsukhnagar and Ameerpet, Hyderabad', 'g'),
        '(located|based) in (the heart of )?Kukatpally, Hyderabad', 'with branches in Dilsukhnagar and Ameerpet, Hyderabad', 'g'),
        '(Location:\*\*|Address:) Kukatpally, Hyderabad', '\1 Dilsukhnagar and Ameerpet, Hyderabad', 'g'),
        -- lifetime access -> the allowed 1-year access; old student count
        'lifetime lms( access)?', '1-year LMS access', 'gi'),
        '3,000\+ students', '5,000+ students', 'g'),
      -- chatgpt tracking parameter (after the link removals above)
      '?utm_source=chatgpt.com&', '?'),
      '&utm_source=chatgpt.com', ''),
      '?utm_source=chatgpt.com', '')
  END
$fn$;

-- The centre list is a plain string replace, applied on top.
CREATE OR REPLACE FUNCTION pg_temp.clean(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT replace(pg_temp.clean_claims(t),
                 '**Ameerpet**, **Dilsukhnagar**, and **Kukatpally**',
                 '**Ameerpet** and **Dilsukhnagar**')
$fn$;

WITH fields (tbl, row_key, col, val) AS (
            SELECT 'BlogPost', slug, 'title',   title    FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'excerpt', excerpt  FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'content', content  FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'seoTitle', "seoTitle" FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', slug, 'seoDesc',  "seoDesc"  FROM "BlogPost"
  UNION ALL SELECT 'Course', slug, 'description', description FROM "Course"
  UNION ALL SELECT 'Course', slug, 'excerpt',     excerpt     FROM "Course"
  UNION ALL SELECT 'Course', slug, 'highlights',  array_to_string(highlights, ' | ') FROM "Course"
  UNION ALL SELECT 'Course', slug, 'syllabus',    syllabus::text FROM "Course"
  UNION ALL SELECT 'Course', slug, 'seoTitle',    "seoTitle"  FROM "Course"
  UNION ALL SELECT 'Course', slug, 'seoDesc',     "seoDesc"   FROM "Course"
  UNION ALL SELECT 'PageSeo', "pageSlug", 'metaTitle',       "metaTitle"       FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
  UNION ALL SELECT 'PageSeo', "pageSlug", 'metaDescription', "metaDescription" FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
  UNION ALL SELECT 'PageSeo', "pageSlug", 'ogTitle',         "ogTitle"         FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
  UNION ALL SELECT 'PageSeo', "pageSlug", 'ogDescription',   "ogDescription"   FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
  UNION ALL SELECT 'PageSeo', "pageSlug", 'schemaOverride',  "schemaOverride"  FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
  UNION ALL SELECT 'CourseCategory', slug, 'description', description FROM "CourseCategory"
  UNION ALL SELECT 'CourseCategory', slug, 'seoDesc',     "seoDesc"   FROM "CourseCategory"
)
SELECT tbl, row_key, col,
       length(val) - length(pg_temp.clean(val)) AS chars_removed,
       substring(val            from '(?i).{0,60}(?:urdigital|indads|click\.in|realtrainings|chatgpt|lifetime lms|3,000\+|kukatpally).{0,60}') AS before_snippet,
       substring(pg_temp.clean(val) from '(?i).{0,60}(?:Dilsukhnagar and Ameerpet|1-year LMS|5,000\+ students).{0,60}')                         AS after_snippet
FROM fields
WHERE val IS DISTINCT FROM pg_temp.clean(val)
ORDER BY tbl, row_key, col;


-- ============================================================
-- PART 3 — THE FIX. One transaction: back up the rows it will touch, update,
-- show counts. Needs the PART 2 functions in the same session.
-- ============================================================

BEGIN;

-- Backup of the original rows (kept until you drop it; see PART 4).
CREATE TABLE IF NOT EXISTS "_claims_cleanup_backup_20260926" (
  tbl text NOT NULL, id text NOT NULL, saved_at timestamptz NOT NULL DEFAULT now(), row_json jsonb NOT NULL,
  PRIMARY KEY (tbl, id)
);

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'BlogPost', id, to_jsonb(b) FROM "BlogPost" b
WHERE title IS DISTINCT FROM pg_temp.clean(title) OR excerpt IS DISTINCT FROM pg_temp.clean(excerpt)
   OR content IS DISTINCT FROM pg_temp.clean(content) OR "seoTitle" IS DISTINCT FROM pg_temp.clean("seoTitle")
   OR "seoDesc" IS DISTINCT FROM pg_temp.clean("seoDesc")
ON CONFLICT DO NOTHING;

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'Course', id, to_jsonb(c) FROM "Course" c
WHERE description IS DISTINCT FROM pg_temp.clean(description) OR excerpt IS DISTINCT FROM pg_temp.clean(excerpt)
   OR array_to_string(highlights, E'\x1F') IS DISTINCT FROM pg_temp.clean(array_to_string(highlights, E'\x1F'))
   OR syllabus::text IS DISTINCT FROM pg_temp.clean(syllabus::text)
   OR "seoTitle" IS DISTINCT FROM pg_temp.clean("seoTitle") OR "seoDesc" IS DISTINCT FROM pg_temp.clean("seoDesc")
ON CONFLICT DO NOTHING;

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'PageSeo', id, to_jsonb(p) FROM "PageSeo" p
WHERE "pageSlug" <> 'locations/kukatpally'
  AND ("metaTitle" IS DISTINCT FROM pg_temp.clean("metaTitle") OR "metaDescription" IS DISTINCT FROM pg_temp.clean("metaDescription")
    OR "ogTitle" IS DISTINCT FROM pg_temp.clean("ogTitle") OR "ogDescription" IS DISTINCT FROM pg_temp.clean("ogDescription")
    OR "schemaOverride" IS DISTINCT FROM pg_temp.clean("schemaOverride"))
ON CONFLICT DO NOTHING;

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'CourseCategory', id, to_jsonb(cc) FROM "CourseCategory" cc
WHERE description IS DISTINCT FROM pg_temp.clean(description) OR "seoDesc" IS DISTINCT FROM pg_temp.clean("seoDesc")
ON CONFLICT DO NOTHING;

-- Updates: only rows saved in the backup above, so every change is restorable.
UPDATE "BlogPost" SET
  title = pg_temp.clean(title), excerpt = pg_temp.clean(excerpt), content = pg_temp.clean(content),
  "seoTitle" = pg_temp.clean("seoTitle"), "seoDesc" = pg_temp.clean("seoDesc"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'BlogPost');

UPDATE "Course" SET
  description = pg_temp.clean(description), excerpt = pg_temp.clean(excerpt),
  highlights  = ARRAY(SELECT pg_temp.clean(h) FROM unnest(highlights) WITH ORDINALITY AS u(h, n) ORDER BY n),
  syllabus    = pg_temp.clean(syllabus::text)::jsonb,
  "seoTitle"  = pg_temp.clean("seoTitle"), "seoDesc" = pg_temp.clean("seoDesc"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'Course');

UPDATE "PageSeo" SET
  "metaTitle" = pg_temp.clean("metaTitle"), "metaDescription" = pg_temp.clean("metaDescription"),
  "ogTitle" = pg_temp.clean("ogTitle"), "ogDescription" = pg_temp.clean("ogDescription"),
  "schemaOverride" = pg_temp.clean("schemaOverride"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'PageSeo');

UPDATE "CourseCategory" SET
  description = pg_temp.clean(description), "seoDesc" = pg_temp.clean("seoDesc"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'CourseCategory');

-- Rows changed per table. If anything looks wrong, run ROLLBACK; instead of COMMIT;
SELECT tbl, count(*) AS rows_changed FROM "_claims_cleanup_backup_20260926" GROUP BY tbl ORDER BY tbl;

COMMIT;

-- Afterwards: re-run PART 1. Only MANUAL findings (and reviewed Kukatpally
-- wording) should remain. Blog and course pages are cached; publish/save
-- once in admin, or wait for revalidation, to see the change live.


-- ============================================================
-- PART 4 — ROLLBACK. Restores the backed-up fields exactly. Not run
-- automatically. Afterwards you can DROP TABLE "_claims_cleanup_backup_20260926";
-- ============================================================

-- BEGIN;
-- UPDATE "BlogPost" t SET title = r.row_json->>'title', excerpt = r.row_json->>'excerpt', content = r.row_json->>'content',
--        "seoTitle" = r.row_json->>'seoTitle', "seoDesc" = r.row_json->>'seoDesc', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'BlogPost' AND t.id = r.id;
-- UPDATE "Course" t SET description = r.row_json->>'description', excerpt = r.row_json->>'excerpt',
--        highlights = ARRAY(SELECT jsonb_array_elements_text(r.row_json->'highlights')),
--        syllabus = r.row_json->'syllabus', "seoTitle" = r.row_json->>'seoTitle', "seoDesc" = r.row_json->>'seoDesc', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'Course' AND t.id = r.id;
-- UPDATE "PageSeo" t SET "metaTitle" = r.row_json->>'metaTitle', "metaDescription" = r.row_json->>'metaDescription',
--        "ogTitle" = r.row_json->>'ogTitle', "ogDescription" = r.row_json->>'ogDescription',
--        "schemaOverride" = r.row_json->>'schemaOverride', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'PageSeo' AND t.id = r.id;
-- UPDATE "CourseCategory" t SET description = r.row_json->>'description', "seoDesc" = r.row_json->>'seoDesc', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'CourseCategory' AND t.id = r.id;
-- COMMIT;
