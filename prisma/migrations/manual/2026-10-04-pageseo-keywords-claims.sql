-- 2026-10-04 PageSeo.keywords: ranking and outcome claims in the keywords meta tag.
-- Pipeline item 1 (A3), database half. Not run by Claude. Run in the Supabase SQL Editor,
-- AFTER the fix/meta-claims-3 deploy is live (that PR makes the sweep scan the keywords tag
-- and fixes the code-sourced keywords: SEO seed, location pages).
--
-- What it does: for every PageSeo row, splits "keywords" on commas and, per keyword:
--   - drops a keyword that is an outcome claim (get placed/hired, guarantees, %, lifetime,
--     high-paying, placement rates/records, dream job);
--   - removes ranking words (best, top, top-rated, leading, premier, largest, most trusted,
--     number one, no. 1) and drops the keyword if only a generic word is left ("institute");
--   - drops a duplicate that cleaning created, then joins with ", ".
-- A row with no claim keyword is returned unchanged (formatting untouched).
-- Simulated on the live keywords of all 223 production pages (237 URLs): 141 pages have
-- keywords, 52 checker hits before, 0 after. The same SQL expression was checked
-- read-only on the local PostgreSQL 16 against all 141 strings: 141/141 identical to the
-- simulation.
--
-- EXPECTED ROWS: 50 PageSeo rows reachable from the site (listed below). The count in
-- STEP 1 can be higher: rows not linked from the site (orphaned keys) are fixed too, and the
-- STEP 1 preview lists every one. pageSlug is UNIQUE and id is the primary key; the backup
-- and the rollback join on id.
--   home, courses, about-us, why-us, blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad, blog/sql-mysql-postgresql-training-in-hyderabad, blog/spoken-english-institute-in-hyderabad, blog/sap-fico-training-in-hyderabad, blog/machine-learning-training-in-hyderabad, blog/join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad, blog/get-placed-with-coss-cloud-solutions-corporate-training-in-hyderabad, blog/full-stack-power-bi-training-in-hyderabad, blog/digital-marketing-training-in-dilsukhnagar, blog/devops-training-in-dilsukhnagar, blog/data-science-training-in-hyderabad, blog/data-analytics-training-in-hyderabad, blog/best-tally-institute-in-hyderabad-coss-cloud-solutions, blog/best-tally-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-spoken-english-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-python-institute-in-hyderabad-coss-cloud-solutions, blog/best-python-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-ms-office-institute-in-hyderabad-coss-cloud-solutions, blog/best-ms-office-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-microsoft-office-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-linux-training-institute-in-dilsukhnagarhyderabad, blog/best-linux-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution, blog/best-java-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution, blog/best-institute-for-devops-in-hyderabad-coss-cloud-solutions, blog/best-google-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution, blog/best-full-stack-java-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-ethical-hacking-institute-in-hyderabad-coss-cloud-solutions, blog/best-ethical-hacking-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions-2, blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions, blog/best-digital-marketing-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions, blog/best-cyber-security-institute-in-hyderabad-coss-cloud-solutions, blog/best-cyber-security-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-communication-skills-institute-in-hyderabad-coss-cloud-solutions, blog/best-communication-skills-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-certification-course-institute-in-hyderabad-coss-cloud-solutions, blog/best-certification-course-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions, blog/best-certification-course-institute-in-ameerpet-hyderabad-coss-cloud-solutions, blog/best-azure-devops-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution, blog/best-azure-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution, blog/best-aws-institutes-in-hyderabad-coss-cloud-solutions, blog/best-aws-course-provider-in-hyderabad-coss-cloud-solutions, blog/azure-data-engineer-training-in-hyderabad, blog/artificial-intelligence-training-in-hyderabad
--
-- Run order: 0 → 1 → 2 → 3 → 4, then 6 (drop the helper). 5 is the rollback, only if needed.
-- The SQL Editor shows only the last result: run each SELECT on its own.

-- ── STEP 0: helper (dropped in step 6) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.coss_keywords_fix_20261004(k text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
SELECT (
  WITH items AS (
    SELECT ord, btrim(raw) AS item FROM unnest(string_to_array(k, ',')) WITH ORDINALITY AS u(raw, ord)
  ), marked AS (
    SELECT ord, item, item ~* '(get(s|ting)?\s+(placed|hired)|guarant|[0-9]\s*%|life\s*-?\s*time|high[ -]?pay|placement\s+(rates?|records?)|dream\s+jobs?)' AS claim,
      btrim(regexp_replace(regexp_replace(regexp_replace(item, '\m(top[ -]?rated|toprated|most\s+trusted|number\s+one|no\.?\s*1)\M\s*', '', 'gi'), '\m(best|top|leading|premier|largest)\M\s*', '', 'gi'), '\s+', ' ', 'g')) AS cleaned
    FROM items WHERE item <> ''
  ), judged AS (
    SELECT ord, item, cleaned,
      (claim OR (cleaned <> item AND (cleaned = '' OR cleaned ~* '^(institutes?|training|courses?|classes|coaching|academy)$'))) AS dropped,
      (claim OR cleaned <> item) AS touched
    FROM marked
  ), kept AS (
    SELECT ord, cleaned, row_number() OVER (PARTITION BY lower(cleaned) ORDER BY ord) AS n FROM judged WHERE NOT dropped
  )
  SELECT CASE
    WHEN k IS NULL THEN NULL
    WHEN NOT EXISTS (SELECT 1 FROM judged WHERE touched) THEN k
    ELSE (SELECT string_agg(cleaned, ', ' ORDER BY ord) FROM kept WHERE n = 1)
  END
)
$fn$;

-- ── STEP 1: PREVIEW (read-only) ─────────────────────────────────────────────
SELECT "pageSlug", keywords AS old, public.coss_keywords_fix_20261004(keywords) AS new
FROM "PageSeo"
WHERE keywords IS DISTINCT FROM public.coss_keywords_fix_20261004(keywords)
ORDER BY "pageSlug";

-- Expected: 50 or more (see EXPECTED ROWS).
SELECT count(*) AS rows_to_change FROM "PageSeo" WHERE keywords IS DISTINCT FROM public.coss_keywords_fix_20261004(keywords);

-- ── STEP 2: BACKUP (only the rows that will change) ────────────────────────
CREATE SCHEMA IF NOT EXISTS coss_backup;
CREATE TABLE coss_backup."PageSeo_keywords_20261004" AS
SELECT id, "pageSlug", keywords, "updatedAt"
FROM "PageSeo"
WHERE keywords IS DISTINCT FROM public.coss_keywords_fix_20261004(keywords);

-- Expected: the same number as rows_to_change in STEP 1.
SELECT count(*) AS backed_up FROM coss_backup."PageSeo_keywords_20261004";

-- ── STEP 3: CHANGE (one transaction) ────────────────────────────────────────
BEGIN;

UPDATE "PageSeo" p SET
  keywords = public.coss_keywords_fix_20261004(p.keywords),
  "updatedAt" = now()
FROM coss_backup."PageSeo_keywords_20261004" b
WHERE p.id = b.id
  AND p.keywords IS DISTINCT FROM public.coss_keywords_fix_20261004(p.keywords)
RETURNING p."pageSlug", b.keywords AS old_keywords, p.keywords AS new_keywords;

COMMIT;

-- ── STEP 4: VERIFY (read-only) ──────────────────────────────────────────────
-- Expected 0: nothing left that the fix would still change.
SELECT count(*) AS still_to_change FROM "PageSeo" WHERE keywords IS DISTINCT FROM public.coss_keywords_fix_20261004(keywords);

-- Expected 0 rows: no ranking word or outcome claim left in any keywords value.
SELECT "pageSlug", keywords FROM "PageSeo"
WHERE keywords ~* '\m(top[ -]?rated|toprated|most\s+trusted|number\s+one|no\.?\s*1)\M\s*'
   OR keywords ~* '\m(best|top|leading|premier|largest)\M\s*'
   OR keywords ~* '(get(s|ting)?\s+(placed|hired)|guarant|[0-9]\s*%|life\s*-?\s*time|high[ -]?pay|placement\s+(rates?|records?)|dream\s+jobs?)';

-- Expected: every backed-up row changed (changed = backed_up from STEP 2).
SELECT count(*) AS changed FROM "PageSeo" p JOIN coss_backup."PageSeo_keywords_20261004" b ON b.id = p.id WHERE p.keywords IS DISTINCT FROM b.keywords;

-- ── STEP 5: ROLLBACK (only if needed) ───────────────────────────────────────
-- Restores keywords and updatedAt exactly as they were, from the backup.
-- BEGIN;
-- UPDATE "PageSeo" p SET keywords = b.keywords, "updatedAt" = b."updatedAt"
-- FROM coss_backup."PageSeo_keywords_20261004" b
-- WHERE p.id = b.id
-- RETURNING p."pageSlug", p.keywords;
-- COMMIT;

-- ── STEP 6: drop the helper ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.coss_keywords_fix_20261004(text);

-- Then make it live (see the clicks in the report) and tell Claude "SQL ran":
-- the full production sweep is re-run; the target is 0.
