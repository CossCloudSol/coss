-- 2026-10-10 Blog SEO rows: ranking wording out (S5 approved 9 Oct). Run ONCE, in full, in the
-- Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS": this file turns RLS on
-- for the one table it creates (in the coss_backup schema) and creates no temp tables.
--
-- What it changes: in the PageSeo rows of blog posts, two columns that no public page shows
-- today (checked on 71 live blog pages, 9 Oct) but that the admin lists and could reuse:
--   pageTitle      (the admin label)        e.g. "Best Tally Institute in Hyderabad – …"
--   schemaMarkup   (stored JSON-LD text)    titles, descriptions and breadcrumb names inside it
-- and sets "updatedAt" on the rows it changes. Wording changes, everywhere in those two columns:
--   "…Coss Cloud Solutions, Hyderabad's leading IT institute."  → "…Coss Cloud Solutions, Hyderabad, since 2010."
--   the same ending cut short ("Hyderabad's lea…", "Hyderabad's leading IT inst…") → "Hyderabad…"
--   "Best " at the start of a title or description, or after "– "  → removed
--     ("Best Tally Institute in Hyderabad" → "Tally Institute in Hyderabad")
--   "Top-Rated " and "Industry Leading "  → removed;   "at the Top "  → "at a "
-- These replacements are case-sensitive, so web addresses (all lower case, e.g.
-- /blog/best-tally-institute-…) are never touched. Slugs, canonical URLs, descriptions shown in
-- search, other columns and other rows do not change.
--
-- Expected counts (from the read-only scan 2026-10-09-blog-claims-scan.sql, run 9 Oct on
-- production): the change is limited to the 73 blog PageSeo rows that scan listed; 37 of them
-- have ranking wording in pageTitle and 72 in schemaMarkup.
--
-- Safety: one transaction. The 73 rows (id, pageSlug, pageTitle, schemaMarkup, updatedAt) are
-- copied first into coss_backup.pageseo_blog_ranking_20261010. Checks then stop everything
-- (nothing changed) if fewer or more than 73 rows are found, if any ranking wording is left in
-- ANY blog PageSeo row (web addresses ignored), if a stored JSON that was valid becomes invalid,
-- or if any other column or row changed. Running it a second time fails at once (the backup
-- table already exists) and changes nothing. Undo: 2026-10-10-pageseo-blog-ranking-rollback.sql.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: PASS (9 Oct 2026). Notes applied: changed-row guard tightened to 72-73;
-- the leftover check also ignores escaped (https:\/\/) and relative URLs and catches "course provider".

BEGIN;

-- Helpers (dropped at the end of this file)
CREATE FUNCTION pg_temp.coss_unrank(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
           t,
           'Hyderabad[’'']s leading IT institute\.', 'Hyderabad, since 2010.', 'g'),
           'Hyderabad[’'']s lea[A-Za-z ]*…', 'Hyderabad…', 'g'),
           '(^|"|– |- )Best ', '\1', 'g'),
           'Top-Rated ', '', 'g'),
           'Industry Leading ', '', 'g'),
           'at the Top ', 'at a ', 'g')
$f$;
-- ranking wording left anywhere in a text, web addresses removed first
CREATE FUNCTION pg_temp.coss_ranked(t text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $f$
  SELECT coalesce(regexp_replace(t, '(https?:)?(\\?/)+[^"[:space:]]*', '', 'g'), '') ~*
    ('\m(best|top-rated|top rated|top|leading|premier|renowned|most trusted|number one|industry[- ]leading|unmatched|unparalleled|finest)\M[^.<"]{0,30}\m(institutes?|institution|training providers?|course providers?|training cent(re|er)s?|academy)\M'
     || '|\mtop-rated\M|leading IT inst|Hyderabad[’'']s lead')
$f$;
CREATE FUNCTION pg_temp.coss_json_ok(t text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $f$
BEGIN
  PERFORM t::jsonb;
  RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END
$f$;

-- 1. Backup (fails if this file already ran: the table exists)
CREATE SCHEMA IF NOT EXISTS coss_backup;
CREATE TABLE coss_backup.pageseo_blog_ranking_20261010 AS
SELECT id, "pageSlug", "pageTitle", "schemaMarkup", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" IN (VALUES
  ('blog/advance-your-career-at-the-top-devops-institute-in-dilsukhnagar-coss-cloud-solutions'),
  ('blog/artificial-intelligence-training-in-hyderabad'),
  ('blog/aws-cloud-course-training-in-hyderabad-with-coss-cloud-solutions'),
  ('blog/azure-data-engineer-training-in-hyderabad'),
  ('blog/azure-devops-training-dilsukhnagar-hyderabad'),
  ('blog/best-aws-course-provider-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-aws-institutes-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-azure-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'),
  ('blog/best-azure-devops-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'),
  ('blog/best-certification-course-institute-in-ameerpet-hyderabad-coss-cloud-solutions'),
  ('blog/best-certification-course-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-certification-course-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions'),
  ('blog/best-communication-skills-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-communication-skills-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-cyber-security-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-cyber-security-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions'),
  ('blog/best-digital-marketing-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions-2'),
  ('blog/best-ethical-hacking-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-ethical-hacking-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-full-stack-java-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-google-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'),
  ('blog/best-institute-for-devops-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-java-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'),
  ('blog/best-linux-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'),
  ('blog/best-linux-training-institute-in-dilsukhnagarhyderabad'),
  ('blog/best-microsoft-office-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-ms-office-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-ms-office-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-python-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-python-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-spoken-english-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-tally-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'),
  ('blog/best-tally-institute-in-hyderabad-coss-cloud-solutions'),
  ('blog/cloud-computing-classes-with-coss-cloud-solutions-in-hyderabad'),
  ('blog/cloud-computing-future-in-hyderabad-with-coss-cloud-solutions'),
  ('blog/cloud-computing-training-in-hyderabad-the-best-career-move-in-2025'),
  ('blog/cloud-computing-training-institute-in-dilsukhnagar-hyderabad'),
  ('blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad'),
  ('blog/cyber-security-training-dilsukhnagar-hyderabad'),
  ('blog/data-analytics-institute-in-dilsukhnagar-hyderabad'),
  ('blog/data-analytics-training-in-hyderabad'),
  ('blog/data-engineer-course-training-hyderabad'),
  ('blog/data-science-training-dilsukhnagar-hyderabad'),
  ('blog/data-science-training-in-hyderabad'),
  ('blog/devops-institute-in-dilsukhnagar-hyderabad'),
  ('blog/devops-training-in-dilsukhnagar'),
  ('blog/devops-training-in-hyderabad-with-coss-cloud-solutions'),
  ('blog/digital-marketing-classes-in-hyderabad'),
  ('blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions'),
  ('blog/full-stack-power-bi-training-in-dilsukhnagar-hyderabad'),
  ('blog/full-stack-power-bi-training-in-hyderabad'),
  ('blog/how-to-learn-aws-cloud-for-beginners'),
  ('blog/job-opportunities-for-devops-professionals-in-hyderabad'),
  ('blog/join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad'),
  ('blog/learn-aws-devops-in-hyderabad-with-coss-cloud-solutions'),
  ('blog/learn-azure-cloud-with-coss-cloud-solutions-in-hyderabad'),
  ('blog/learn-ethical-hacking-in-hyderabad-with-coss-cloud-solutions'),
  ('blog/learn-linux-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad'),
  ('blog/learn-ms-office-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions'),
  ('blog/learn-tally-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions'),
  ('blog/learning-tally-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad'),
  ('blog/machine-learning-training-in-dilsukhnagar-hyderabad'),
  ('blog/machine-learning-training-in-hyderabad'),
  ('blog/master-aws-devops-in-hyderabad'),
  ('blog/sap-fico-training-in-hyderabad'),
  ('blog/spoken-english-institute-in-hyderabad'),
  ('blog/sql-mysql-postgresql-training-in-dilsukhnagar-hyderabad'),
  ('blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad')
);
ALTER TABLE coss_backup.pageseo_blog_ranking_20261010 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  cnt int;
  changed int;
  rest_before jsonb;
  others_before text;
BEGIN
  -- fingerprints before any change
  SELECT jsonb_object_agg(p.id, md5((to_jsonb(p) - 'pageTitle' - 'schemaMarkup' - 'updatedAt')::text)) INTO rest_before
  FROM "PageSeo" p WHERE p.id IN (SELECT id FROM coss_backup.pageseo_blog_ranking_20261010);
  SELECT md5(string_agg(md5(p::text), ',' ORDER BY p.id)) INTO others_before
  FROM "PageSeo" p WHERE p.id NOT IN (SELECT id FROM coss_backup.pageseo_blog_ranking_20261010);

  -- the 73 rows from the scan are all there
  SELECT count(*) INTO cnt FROM coss_backup.pageseo_blog_ranking_20261010;
  IF cnt <> 73 THEN RAISE EXCEPTION 'expected 73 blog PageSeo rows from the 9 Oct scan, found %', cnt; END IF;

  -- 2. Change (only rows where the wording actually changes)
  UPDATE "PageSeo" p
  SET "pageTitle" = pg_temp.coss_unrank(p."pageTitle"),
      "schemaMarkup" = pg_temp.coss_unrank(p."schemaMarkup"),
      "updatedAt" = (now() AT TIME ZONE 'UTC')
  WHERE p.id IN (SELECT id FROM coss_backup.pageseo_blog_ranking_20261010)
    AND (pg_temp.coss_unrank(p."pageTitle") IS DISTINCT FROM p."pageTitle"
         OR pg_temp.coss_unrank(p."schemaMarkup") IS DISTINCT FROM p."schemaMarkup");
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed < 72 OR changed > 73 THEN
    RAISE EXCEPTION 'changed % rows; expected 72 or 73 (the scan found ranking wording in the stored JSON of 72)', changed;
  END IF;

  -- 3. Checks
  -- no ranking wording left in any blog PageSeo row (title, label, descriptions, stored JSON)
  SELECT count(*) INTO cnt FROM "PageSeo" p
  WHERE (p."pageSlug" = 'blog' OR p."pageSlug" LIKE 'blog/%')
    AND (pg_temp.coss_ranked(p."pageTitle") OR pg_temp.coss_ranked(p."schemaMarkup"));
  IF cnt <> 0 THEN RAISE EXCEPTION '% blog PageSeo rows still have ranking wording in pageTitle or schemaMarkup', cnt; END IF;
  -- stored JSON that was valid is still valid
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_blog_ranking_20261010 k USING (id)
  WHERE k."schemaMarkup" IS NOT NULL AND pg_temp.coss_json_ok(k."schemaMarkup") AND NOT pg_temp.coss_json_ok(p."schemaMarkup");
  IF cnt <> 0 THEN RAISE EXCEPTION '% stored JSON values became invalid', cnt; END IF;
  -- no NULLs introduced; nothing got longer than the original (only words are removed or shortened)
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_blog_ranking_20261010 k USING (id)
  WHERE (k."pageTitle" IS NOT NULL AND p."pageTitle" IS NULL)
     OR (k."schemaMarkup" IS NOT NULL AND p."schemaMarkup" IS NULL)
     OR length(p."pageTitle") > length(k."pageTitle")
     OR length(p."schemaMarkup") > length(k."schemaMarkup")
     OR btrim(p."pageTitle") = '';
  IF cnt <> 0 THEN RAISE EXCEPTION '% rows changed in an unexpected way (NULL, empty or longer)', cnt; END IF;
  -- nothing but pageTitle, schemaMarkup and updatedAt changed on those rows; no other row changed
  SELECT count(*) INTO cnt FROM "PageSeo" p
  WHERE p.id IN (SELECT id FROM coss_backup.pageseo_blog_ranking_20261010)
    AND md5((to_jsonb(p) - 'pageTitle' - 'schemaMarkup' - 'updatedAt')::text) IS DISTINCT FROM (rest_before ->> p.id);
  IF cnt <> 0 THEN RAISE EXCEPTION 'other columns changed on % rows', cnt; END IF;
  IF others_before IS DISTINCT FROM
     (SELECT md5(string_agg(md5(p::text), ',' ORDER BY p.id)) FROM "PageSeo" p
      WHERE p.id NOT IN (SELECT id FROM coss_backup.pageseo_blog_ranking_20261010)) THEN
    RAISE EXCEPTION 'another PageSeo row changed';
  END IF;
  RAISE NOTICE 'changed % of the 73 rows', changed;
END $$;

DROP FUNCTION pg_temp.coss_unrank(text);
DROP FUNCTION pg_temp.coss_ranked(text);
DROP FUNCTION pg_temp.coss_json_ok(text);

COMMIT;
