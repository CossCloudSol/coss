-- Manual data fix (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Companion to branch fix/claims-cleanup, which made the same fixes in files.
--
-- STATUS 2026-09-26: PART 3 IS SUPERSEDED — DO NOT RUN IT. The developer
-- applied the DB fixes directly with targeted SQL instead: the ML course,
-- the SAP FICO highlight, the placement blog sentence, the Azure DevOps meta
-- description, and the 4 Kukatpally redirects. PART 1 is still useful as a
-- read-only check; PART 4 only applies to a PART 3 run and does not undo
-- those direct fixes. Kept for history.
-- Finds and fixes the same texts where they live in the database instead:
--   "BlogPost", "Course", "PageSeo", "CourseCategory", plus "Redirect".
-- No schema change.
--
-- Run the parts IN ORDER, one at a time, in the SAME SQL Editor tab:
--   PART 1  read-only search                  (safe to run any time)
--   PART 2  preview of every text change      (read-only; creates session-only
--                                              pg_temp functions, no table writes)
--   PART 3  the fix, in one transaction, with a backup table saved first
--   PART 4  rollback from that backup         (only if needed)
-- Pasting the whole file at once runs PART 3 and commits it.
--
-- PART 3 changes automatically:
--   Links      urdigital.in spam links unwrapped (anchor text kept);
--              indads.in / click.in / realtrainings.com citations removed;
--              utm_source=chatgpt.com stripped.
--   Location   "located in / based in / Located in the heart of Kukatpally",
--              "Location:** / Address: Kukatpally", the three-centre list,
--              and the four "learning hub" passages -> students travel in
--              from Kukatpally; the Ameerpet branch is a direct Red Line ride.
--   Claims     the exact placement / pass-rate / "first attempt" sentences
--              and the two rating sentences removed from the blog files;
--              "Lifetime LMS" and "lifetime access" (course materials, not
--              the alumni network) -> 1-year; "3,000+ students" -> 5,000+;
--              certification headline -> "Exam-Focused IT Certification
--              Training"; the Salesforce FAQ answer.
--   Posts      DB copies of the two Kukatpally-branch posts -> status 'draft'.
--   Redirects  /blog/<those two slugs> -> /locations/kukatpally (301), and
--              every redirect that pointed at them now goes straight there.
-- Left for a manual edit (PART 1 marks them MANUAL): other "#1", pass-rate
-- and placement-rate wording that isn't one of the exact sentences above.
-- "best" / "leading" wording, "100% Secure" and "100% free" are untouched.


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
         WHEN val ~* 'urdigital\.in'                                  THEN 'spam link (auto-fix)'
         WHEN val ~* '(indads\.in|click\.in|realtrainings\.com)'      THEN 'directory citation (auto-fix)'
         WHEN val ~* 'utm_source=chatgpt\.com'                        THEN 'chatgpt param (auto-fix)'
         WHEN val ~* 'lifetime (lms|access)'                          THEN 'lifetime access (auto-fix, except alumni network)'
         WHEN val ~  '3,000\+ students'                               THEN '3,000+ (auto-fix)'
         WHEN val ~* 'kukatpally'                                     THEN 'Kukatpally (auto-fix for the known sentences; review the rest)'
         WHEN val ~* '(\d\.\d\+? ?(★|stars?|/ ?5|google rating)|\d+\+? (positive )?(google )?reviews)'
                                                                      THEN 'rating / review count (auto-fix for the known sentences; review the rest)'
         WHEN val ~* '(placement (rate|record)|success rate|first attempt|ace the|pass rate|95 ?%)'
                                                                      THEN 'placement / pass claim (auto-fix for the known sentences; review the rest)'
         ELSE '#1 claim (MANUAL)'
       END AS finding,
       substring(val from '(?i).{0,70}(?:urdigital\.in|indads\.in|click\.in|realtrainings\.com|utm_source=chatgpt\.com|lifetime (?:lms|access)|3,000\+ students|kukatpally|\d\.\d\+? ?(?:★|stars?|/ ?5|google rating)|\d+\+? (?:positive )?(?:google )?reviews|placement (?:rate|record)|success rate|first attempt|ace the|pass rate|95 ?%|#1\M).{0,70}') AS snippet
FROM fields
WHERE val ~* '(urdigital\.in|indads\.in|click\.in|realtrainings\.com|utm_source=chatgpt\.com|lifetime (lms|access)|3,000\+ students|kukatpally|\d\.\d\+? ?(★|stars?|/ ?5|google rating)|\d+\+? (positive )?(google )?reviews|placement (rate|record)|success rate|first attempt|ace the|pass rate|95 ?%|#1\M)'
ORDER BY tbl, row_key, col;

-- Redirects touching the two Kukatpally-branch posts (read-only).
SELECT id, source, destination, "statusCode", "isActive"
FROM "Redirect"
WHERE source      ~* '(best-certification-course-institute-in-kukatpally|digital-marketing-institute-in-kukatpally)-hyderabad-coss-cloud-solutions'
   OR destination ~* '(best-certification-course-institute-in-kukatpally|digital-marketing-institute-in-kukatpally)-hyderabad-coss-cloud-solutions'
ORDER BY source;

-- DB copies of those two posts, if any (read-only).
SELECT id, slug, status FROM "BlogPost"
WHERE slug IN ('best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
               'digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions');


-- ============================================================
-- PART 2 — PREVIEW. Creates session-only helpers (pg_temp: they disappear
-- when the session ends and touch no table) and shows before/after for
-- every field PART 3 would change.
-- ============================================================

-- Pattern-based fixes (links, location statements, lifetime, 3,000+).
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
        -- lifetime course access -> the allowed 1-year access (not the alumni network)
        'lifetime lms( access)?', '1-year LMS access', 'gi'),
        'Lifetime Access(?! to [^.]{0,40}alumni)', '1-Year Access', 'g'),
        'lifetime access(?! to [^.]{0,40}alumni)', '1-year access', 'gi'),
        '3,000\+ students', '5,000+ students', 'g'),
      -- chatgpt tracking parameter (after the link removals above)
      '?utm_source=chatgpt.com&', '?'),
      '&utm_source=chatgpt.com', ''),
      '?utm_source=chatgpt.com', '')
  END
$fn$;

-- Exact-sentence fixes, mirroring the file edits. Each apostrophe phrase is
-- listed twice: with ’ and with &#8217; (how the WordPress import stored it).
CREATE OR REPLACE FUNCTION pg_temp.clean(t text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  s text := pg_temp.clean_claims(t);
  p text[];
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;

  FOREACH p SLICE 1 IN ARRAY ARRAY[
    -- centre list
    ['**Ameerpet**, **Dilsukhnagar**, and **Kukatpally**', '**Ameerpet** and **Dilsukhnagar**'],
    -- "learning hub" passages -> students travel in from Kukatpally
    ['**Kukatpally – The New Learning Hub**', '**Coming from Kukatpally?**'],
    ['Kukatpally has grown into an academic and tech-friendly locality. Surrounded by engineering colleges, coaching centers, and IT hubs, it’s the perfect place to gain skills while staying close to employment zones like HITEC City and Gachibowli.',
     'Many of our students travel in from Kukatpally and KPHB, an area full of engineering colleges and close to HITEC City and Gachibowli. Our Ameerpet branch is a direct ride on the Metro Red Line from there, with no line change.'],
    ['Kukatpally has grown into an academic and tech-friendly locality. Surrounded by engineering colleges, coaching centers, and IT hubs, it&#8217;s the perfect place to gain skills while staying close to employment zones like HITEC City and Gachibowli.',
     'Many of our students travel in from Kukatpally and KPHB, an area full of engineering colleges and close to HITEC City and Gachibowli. Our Ameerpet branch is a direct ride on the Metro Red Line from there, with no line change.'],
    ['**Kukatpally’s Educational Infrastructure**', '**Students from Kukatpally**'],
    ['**Kukatpally&#8217;s Educational Infrastructure**', '**Students from Kukatpally**'],
    ['Kukatpally is a well-connected academic hub, offering easy access, comfortable accommodation, and a vibrant student community.',
     'Kukatpally has a large student community, and many of our learners travel in from there. Our Ameerpet branch is a direct ride on the Metro Red Line from Kukatpally and KPHB, with no line change.'],
    ['Kukatpally, in particular, is easily accessible and surrounded by educational and technological infrastructure.',
     'Many of our students travel in from nearby areas such as Kukatpally, a direct Metro Red Line ride from our Ameerpet branch.'],
    ['**Education Infrastructure in Kukatpally**', '**Students from Kukatpally**'],
    ['Kukatpally is known for its academic institutions and proximity to major business districts. With affordable housing and excellent connectivity, it’s the **perfect location for career-focused learners**.',
     'Kukatpally is known for its academic institutions, and many of our learners travel in from there. Our Ameerpet branch is a direct ride on the Metro Red Line from Kukatpally and KPHB, with no line change.'],
    ['Kukatpally is known for its academic institutions and proximity to major business districts. With affordable housing and excellent connectivity, it&#8217;s the **perfect location for career-focused learners**.',
     'Kukatpally is known for its academic institutions, and many of our learners travel in from there. Our Ameerpet branch is a direct ride on the Metro Red Line from Kukatpally and KPHB, with no line change.'],
    ['Attend training at the Kukatpally center or opt for', 'Attend training at our Dilsukhnagar or Ameerpet centre or opt for'],
    -- placement / pass-rate claims
    ['Proven placement record', 'Placement assistance'],
    ['Coss Cloud Solutions has a record of high job placement rates, with alumni working at leading tech firms.',
     'Coss Cloud Solutions offers placement assistance, and its alumni work at leading tech firms.'],
    ['Coss Cloud ensures every learner is ready to ace the Microsoft certification on their first attempt.',
     'Coss Cloud helps learners prepare for the Microsoft certification exam.'],
    ['**Success Rate and Industry Partnerships**', '**Industry Partnerships**'],
    ['The institute boasts high certification success rates and partnerships with leading IT firms for placements.',
     'The institute has partnerships with leading IT firms for placements.'],
    ['advanced lab facilities, and job placement record.', 'advanced lab facilities, and placement assistance.'],
    ['comprehensive curriculum and successful placement record,', 'comprehensive curriculum and placement support,'],
    ['thanks to its quality education and strong placement record.', 'thanks to its quality education and placement support.'],
    ['The training institute’s comprehensive exam preparation ensures that students are well-equipped to pass these certifications on their first attempt.',
     'The training institute’s comprehensive exam preparation helps students get ready for these certification exams.'],
    ['The training institute&#8217;s comprehensive exam preparation ensures that students are well-equipped to pass these certifications on their first attempt.',
     'The training institute&#8217;s comprehensive exam preparation helps students get ready for these certification exams.'],
    ['100% job-oriented training', 'Job-oriented training'],
    ['known for its cutting-edge curriculum and stellar placement records.', 'known for its cutting-edge curriculum and placement assistance.'],
    ['- **Proven Track Record**: High success rate in certifications.' || E'\n', ''],
    ['Excellent student success rates' || E'\n\n', ''],
    ['Yes, Salesforce certified professionals have very high placement rates in our alumni network.',
     'Salesforce skills are in demand, and our placement support covers resume building, mock interviews and referrals to our hiring partners. Placement itself is not guaranteed.'],
    -- certification headline
    ['Crack Your IT Certification on the First Attempt', 'Exam-Focused IT Certification Training'],
    -- lifetime phrasings the patterns above don't cover
    ['**6. Will I get lifetime access to learning materials?**Online learners get recorded videos and resources for future reference.',
     '**6. Will I get access to learning materials?**Online learners get 1-year access to recorded videos and resources.'],
    ['with access to lifetime materials and post-course support.', 'with 1-year access to materials and post-course support.'],
    -- third-party ratings
    ['With 4.8+ Google rating and 5,000+ students trained, ', 'With 5,000+ students trained, ']
  ] LOOP
    s := replace(s, p[1], p[2]);
  END LOOP;

  -- Sulekha rating sentence (with its citation link, if present)
  s := regexp_replace(s, 'Their reputation is supported by positive reviews: they hold about a 4\.9★ rating with 61 reviews on Sulekha for the Dilsukhnagar branch\.( \[Sulekha[^]]*\]\([^)]*\))?\s*', '', 'g');
  RETURN s;
END
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
  UNION ALL SELECT 'PageSeo', "pageSlug", 'pageTitle',       "pageTitle"       FROM "PageSeo" WHERE "pageSlug" <> 'locations/kukatpally'
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
       substring(val                from '(?i).{0,60}(?:urdigital|indads|click\.in|realtrainings|chatgpt|lifetime|3,000\+|kukatpally|placement rec|placement rate|success rate|first attempt|google rating|4\.9★|crack your).{0,60}') AS before_snippet,
       substring(pg_temp.clean(val) from '(?i).{0,60}(?:Dilsukhnagar and Ameerpet|Red Line|1-year|5,000\+ students|placement (?:assistance|support)|Industry Partnerships|prepare for|Exam-Focused).{0,60}')     AS after_snippet
FROM fields
WHERE val IS DISTINCT FROM pg_temp.clean(val)
ORDER BY tbl, row_key, col;


-- ============================================================
-- PART 3 — THE FIX. One transaction: back up every row it will touch,
-- update, show counts. Needs the PART 2 functions in the same session.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "_claims_cleanup_backup_20260926" (
  tbl text NOT NULL, id text NOT NULL, saved_at timestamptz NOT NULL DEFAULT now(), row_json jsonb NOT NULL,
  PRIMARY KEY (tbl, id)
);

-- 3a. Backups (original rows; ON CONFLICT keeps the first copy if re-run).
INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'BlogPost', id, to_jsonb(b) FROM "BlogPost" b
WHERE title IS DISTINCT FROM pg_temp.clean(title) OR excerpt IS DISTINCT FROM pg_temp.clean(excerpt)
   OR content IS DISTINCT FROM pg_temp.clean(content) OR "seoTitle" IS DISTINCT FROM pg_temp.clean("seoTitle")
   OR "seoDesc" IS DISTINCT FROM pg_temp.clean("seoDesc")
   OR (slug IN ('best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
                'digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions') AND status <> 'draft')
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
  AND ("pageTitle" IS DISTINCT FROM pg_temp.clean("pageTitle") OR "metaTitle" IS DISTINCT FROM pg_temp.clean("metaTitle")
    OR "metaDescription" IS DISTINCT FROM pg_temp.clean("metaDescription")
    OR "ogTitle" IS DISTINCT FROM pg_temp.clean("ogTitle") OR "ogDescription" IS DISTINCT FROM pg_temp.clean("ogDescription")
    OR "schemaOverride" IS DISTINCT FROM pg_temp.clean("schemaOverride"))
ON CONFLICT DO NOTHING;

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'CourseCategory', id, to_jsonb(cc) FROM "CourseCategory" cc
WHERE description IS DISTINCT FROM pg_temp.clean(description) OR "seoDesc" IS DISTINCT FROM pg_temp.clean("seoDesc")
ON CONFLICT DO NOTHING;

INSERT INTO "_claims_cleanup_backup_20260926" (tbl, id, row_json)
SELECT 'Redirect', id, to_jsonb(r) FROM "Redirect" r
WHERE source IN ('/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
                 '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions')
   OR rtrim(destination, '/') IN (
        '/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions')
ON CONFLICT DO NOTHING;

-- 3b. Text fixes: only rows saved in the backup, so every change is restorable.
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
  "pageTitle" = pg_temp.clean("pageTitle"), "metaTitle" = pg_temp.clean("metaTitle"),
  "metaDescription" = pg_temp.clean("metaDescription"),
  "ogTitle" = pg_temp.clean("ogTitle"), "ogDescription" = pg_temp.clean("ogDescription"),
  "schemaOverride" = pg_temp.clean("schemaOverride"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'PageSeo');

UPDATE "CourseCategory" SET
  description = pg_temp.clean(description), "seoDesc" = pg_temp.clean("seoDesc"), "updatedAt" = now()
WHERE id IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'CourseCategory');

-- 3c. Unpublish DB copies of the two Kukatpally-branch posts.
UPDATE "BlogPost" SET status = 'draft', "updatedAt" = now()
WHERE slug IN ('best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
               'digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions')
  AND status <> 'draft';

-- 3d. Redirects: anything that pointed at the posts goes straight to
-- /locations/kukatpally (no chains), then add the two /blog/ sources.
UPDATE "Redirect" SET destination = '/locations/kukatpally', "statusCode" = 301, "updatedAt" = now()
WHERE rtrim(destination, '/') IN (
        '/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
        '/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions');

INSERT INTO "Redirect" (id, source, destination, "statusCode", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, '/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions', '/locations/kukatpally', 301, true, now(), now()),
  (gen_random_uuid()::text, '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions',         '/locations/kukatpally', 301, true, now(), now())
ON CONFLICT (source) DO UPDATE
  SET destination = EXCLUDED.destination, "statusCode" = 301, "isActive" = true, "updatedAt" = now();

-- Rows touched per table. If anything looks wrong, run ROLLBACK; instead of COMMIT;
SELECT tbl, count(*) AS rows_backed_up_and_changed FROM "_claims_cleanup_backup_20260926" GROUP BY tbl ORDER BY tbl;
SELECT source, destination, "statusCode" FROM "Redirect" WHERE destination = '/locations/kukatpally' ORDER BY source;

COMMIT;

-- Afterwards:
--  - Re-run PART 1: only MANUAL findings should remain.
--  - next.config.mjs on this branch already contains these redirect rules, in
--    the order sync-redirects writes them, so the next sync reproduces them.
--  - Blog and course pages are cached; save once in admin or wait for
--    revalidation to see text changes live.


-- ============================================================
-- PART 4 — ROLLBACK. Restores every backed-up row. Not run automatically.
-- Afterwards you can DROP TABLE "_claims_cleanup_backup_20260926";
-- ============================================================

-- BEGIN;
-- UPDATE "BlogPost" t SET title = r.row_json->>'title', excerpt = r.row_json->>'excerpt', content = r.row_json->>'content',
--        "seoTitle" = r.row_json->>'seoTitle', "seoDesc" = r.row_json->>'seoDesc', status = r.row_json->>'status', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'BlogPost' AND t.id = r.id;
-- UPDATE "Course" t SET description = r.row_json->>'description', excerpt = r.row_json->>'excerpt',
--        highlights = ARRAY(SELECT jsonb_array_elements_text(r.row_json->'highlights')),
--        syllabus = r.row_json->'syllabus', "seoTitle" = r.row_json->>'seoTitle', "seoDesc" = r.row_json->>'seoDesc', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'Course' AND t.id = r.id;
-- UPDATE "PageSeo" t SET "pageTitle" = r.row_json->>'pageTitle', "metaTitle" = r.row_json->>'metaTitle',
--        "metaDescription" = r.row_json->>'metaDescription', "ogTitle" = r.row_json->>'ogTitle',
--        "ogDescription" = r.row_json->>'ogDescription', "schemaOverride" = r.row_json->>'schemaOverride', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'PageSeo' AND t.id = r.id;
-- UPDATE "CourseCategory" t SET description = r.row_json->>'description', "seoDesc" = r.row_json->>'seoDesc', "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'CourseCategory' AND t.id = r.id;
-- -- Redirects: restore changed rows, then remove the two /blog/ rules if they didn't exist before.
-- UPDATE "Redirect" t SET destination = r.row_json->>'destination', "statusCode" = (r.row_json->>'statusCode')::int,
--        "isActive" = (r.row_json->>'isActive')::boolean, "updatedAt" = now()
--   FROM "_claims_cleanup_backup_20260926" r WHERE r.tbl = 'Redirect' AND t.id = r.id;
-- DELETE FROM "Redirect"
--   WHERE source IN ('/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',
--                    '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions')
--     AND id NOT IN (SELECT id FROM "_claims_cleanup_backup_20260926" WHERE tbl = 'Redirect');
-- COMMIT;
