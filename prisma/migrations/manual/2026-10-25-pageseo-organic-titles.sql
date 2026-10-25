-- 2026-10-25 PageSeo meta title + description for five pages with low search CTR.
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS": this file turns RLS on
-- for the one table it creates (the backup, in the coss_backup schema).
--
-- Why: Search Console, 28 days to 22 Oct: these pages sit at average position 3-15 with 100+
-- impressions and CTR under 2%. Their search title and description come from their PageSeo rows
-- (the Linux post is an MDX file, but its PageSeo row overrides the file). The two branch pages
-- (/locations/ameerpet, /locations/dilsukhnagar) change in code, PR feat/organic-lead-quick-wins;
-- this file only checks that no PageSeo row overrides that code text.
--
-- What it changes: five PageSeo rows, columns "metaTitle", "metaDescription" and "updatedAt".
--   pageSlug courses          (/courses)
--     metaTitle       → IT Courses in Hyderabad: AI, Cloud & DevOps – Free Demo
--     metaDescription → Coss Cloud Solutions IT courses in Hyderabad: AI, AWS, Azure, DevOps, Data
--                       Science, Cyber Security and Full Stack, classroom or online. Book a free demo.
--   pageSlug about            (/about-us)
--     metaTitle       → About Us – IT Training Institute in Hyderabad Since 2010
--     metaDescription → IT training in Hyderabad since 2010: 5,000+ students trained, 50+ hiring
--                       partners, branches in Dilsukhnagar and Ameerpet. Book a free demo class with Coss.
--   pageSlug student-reviews  (/student-reviews)
--     metaTitle       → Student Reviews – IT Training Institute in Hyderabad
--     metaDescription → Read Coss Cloud Solutions student reviews on Google for our Dilsukhnagar and
--                       Ameerpet branches, Hyderabad. 5,000+ students trained since 2010.
--   pageSlug contact          (/contact-us)
--     metaTitle       → Contact Us – Dilsukhnagar & Ameerpet Branches, Hyderabad
--     metaDescription → Contact Coss Cloud Solutions in Dilsukhnagar or Ameerpet, Hyderabad: call or
--                       WhatsApp +91 88851 66007, get directions, or book a free demo class.
--   pageSlug blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad
--     metaTitle       → Linux Training in Dilsukhnagar, Hyderabad – Free Demo Class
--     metaDescription → Linux training in Dilsukhnagar, Hyderabad: file management, permissions,
--                       shell scripting, networking and server management. 5,000+ students trained.
-- The site adds " | Coss Cloud Solutions" to the title. Claims used: only "5,000+ students trained",
-- "since 2010", "50+ hiring partners". No other column or row changes ("ogTitle"/"ogDescription"
-- are left as they are; STEP 1 shows them).
--
-- Safety: one transaction. The five rows (id, pageSlug, metaTitle, metaDescription, updatedAt) are
-- copied first into coss_backup.pageseo_organic_titles_20261025. Checks then stop everything
-- (nothing changed) unless exactly these 5 rows exist, no PageSeo row overrides the two branch
-- pages' code title/description, exactly 5 rows change, they hold the new text within the length
-- limits, and the PageSeo row count is unchanged. Running it a second time fails at once (the
-- backup table already exists) and changes nothing. Undo: 2026-10-25-pageseo-organic-titles-rollback.sql.
--
-- WHEN: run it BEFORE the feat/organic-lead-quick-wins merge, so the deploy's build renders the new
-- titles. Run after the deploy instead and the five pages keep the old text until they are
-- revalidated (Admin → SEO → open the page → Save, for each page).
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (STEP 3 shows all 5 rows with the new text): tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: PASS (25 Oct), no must-fix. Its nice-to-haves applied afterwards: the claims
-- check covers the title too, STEP 1b shows the OG columns, the rollback's restore check covers
-- every column it writes. Not run on any database by Claude.

-- ── STEP 1: preview (read-only) ─────────────────────────────────────────────────────────────
-- 1a. The five rows as they are now. Expected: 5 rows.
SELECT "pageSlug", "metaTitle", "metaDescription", "ogTitle", "ogDescription", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('courses', 'about', 'student-reviews', 'contact',
                     'blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad')
ORDER BY "pageSlug";

-- 1b. Branch pages: their title/description now come from code. Expected: 0 rows, or rows whose
--     metaTitle is empty and metaDescription is NULL. Anything else would hide the code change:
--     STEP 2 then stops with an error and changes nothing.
--     (ogTitle/ogDescription, if set, still override the share-card text only, not the search title.)
SELECT "pageSlug", "metaTitle", "metaDescription", "ogTitle", "ogDescription"
FROM "PageSeo"
WHERE "pageSlug" IN ('locations/ameerpet', 'locations/dilsukhnagar')
ORDER BY "pageSlug";

-- ── STEP 2: the change (one transaction) ──────────────────────────────────────────────────
BEGIN;
SET LOCAL lock_timeout = '3s';

CREATE TABLE coss_backup.pageseo_organic_titles_20261025 AS
SELECT id, "pageSlug", "metaTitle", "metaDescription", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('courses', 'about', 'student-reviews', 'contact',
                     'blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad');
ALTER TABLE coss_backup.pageseo_organic_titles_20261025 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  total_before bigint;
  cnt int;
BEGIN
  SELECT count(*) INTO total_before FROM "PageSeo";
  SELECT count(*) INTO cnt FROM coss_backup.pageseo_organic_titles_20261025;
  IF cnt <> 5 THEN
    RAISE EXCEPTION 'expected the 5 PageSeo rows, found %; nothing changed', cnt;
  END IF;

  -- a PageSeo row with a title or description would override the branch pages' new code text
  SELECT count(*) INTO cnt
  FROM "PageSeo"
  WHERE "pageSlug" IN ('locations/ameerpet', 'locations/dilsukhnagar')
    AND (COALESCE(btrim("metaTitle"), '') <> '' OR "metaDescription" IS NOT NULL);
  IF cnt <> 0 THEN
    RAISE EXCEPTION '% branch-page PageSeo row(s) override the code title/description (see STEP 1b); nothing changed', cnt;
  END IF;

  UPDATE "PageSeo" p SET
    "metaTitle" = v.title,
    "metaDescription" = v.descr,
    "updatedAt" = now()
  FROM (VALUES
    ('courses',
     'IT Courses in Hyderabad: AI, Cloud & DevOps – Free Demo',
     'Coss Cloud Solutions IT courses in Hyderabad: AI, AWS, Azure, DevOps, Data Science, Cyber Security and Full Stack, classroom or online. Book a free demo.'),
    ('about',
     'About Us – IT Training Institute in Hyderabad Since 2010',
     'IT training in Hyderabad since 2010: 5,000+ students trained, 50+ hiring partners, branches in Dilsukhnagar and Ameerpet. Book a free demo class with Coss.'),
    ('student-reviews',
     'Student Reviews – IT Training Institute in Hyderabad',
     'Read Coss Cloud Solutions student reviews on Google for our Dilsukhnagar and Ameerpet branches, Hyderabad. 5,000+ students trained since 2010.'),
    ('contact',
     'Contact Us – Dilsukhnagar & Ameerpet Branches, Hyderabad',
     'Contact Coss Cloud Solutions in Dilsukhnagar or Ameerpet, Hyderabad: call or WhatsApp +91 88851 66007, get directions, or book a free demo class.'),
    ('blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad',
     'Linux Training in Dilsukhnagar, Hyderabad – Free Demo Class',
     'Linux training in Dilsukhnagar, Hyderabad: file management, permissions, shell scripting, networking and server management. 5,000+ students trained.')
  ) AS v(slug, title, descr)
  WHERE p."pageSlug" = v.slug;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 5 THEN RAISE EXCEPTION 'expected 5 rows updated, got %', cnt; END IF;

  -- ROW_COUNT = 5 on the unique pageSlug proves no other row was touched; the row count must hold
  IF (SELECT count(*) FROM "PageSeo") <> total_before THEN RAISE EXCEPTION 'PageSeo row count changed'; END IF;

  -- the backed-up rows (joined on id) now hold exactly the new (slug, title, description) triples,
  -- within the length limits (title before the brand suffix <= 60, description <= 155) and with no
  -- disallowed claims
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_organic_titles_20261025 b USING (id)
  WHERE (p."pageSlug", p."metaTitle", p."metaDescription") IN (
          ('courses',
           'IT Courses in Hyderabad: AI, Cloud & DevOps – Free Demo',
           'Coss Cloud Solutions IT courses in Hyderabad: AI, AWS, Azure, DevOps, Data Science, Cyber Security and Full Stack, classroom or online. Book a free demo.'),
          ('about',
           'About Us – IT Training Institute in Hyderabad Since 2010',
           'IT training in Hyderabad since 2010: 5,000+ students trained, 50+ hiring partners, branches in Dilsukhnagar and Ameerpet. Book a free demo class with Coss.'),
          ('student-reviews',
           'Student Reviews – IT Training Institute in Hyderabad',
           'Read Coss Cloud Solutions student reviews on Google for our Dilsukhnagar and Ameerpet branches, Hyderabad. 5,000+ students trained since 2010.'),
          ('contact',
           'Contact Us – Dilsukhnagar & Ameerpet Branches, Hyderabad',
           'Contact Coss Cloud Solutions in Dilsukhnagar or Ameerpet, Hyderabad: call or WhatsApp +91 88851 66007, get directions, or book a free demo class.'),
          ('blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad',
           'Linux Training in Dilsukhnagar, Hyderabad – Free Demo Class',
           'Linux training in Dilsukhnagar, Hyderabad: file management, permissions, shell scripting, networking and server management. 5,000+ students trained.'))
    AND char_length(p."metaTitle") <= 60 AND char_length(p."metaDescription") <= 155
    AND p."metaTitle" !~* '(placement|placed|guarant|[0-9]+ ?%|lakh|lpa)'
    AND p."metaDescription" !~* '(placement|placed|guarant|[0-9]+ ?%|lakh|lpa)';
  IF cnt <> 5 THEN RAISE EXCEPTION 'the new title/description did not land as expected (% of 5 rows)', cnt; END IF;
END $$;

COMMIT;

-- ── STEP 3: verify (read-only) ───────────────────────────────────────────────────────────
-- Expected: 5 rows, the new metaTitle and metaDescription, updatedAt = the time you ran it.
SELECT "pageSlug", "metaTitle", char_length("metaTitle") AS title_len,
       "metaDescription", char_length("metaDescription") AS descr_len, "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN ('courses', 'about', 'student-reviews', 'contact',
                     'blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad')
ORDER BY "pageSlug";
