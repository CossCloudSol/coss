-- 2026-10-09 Blog claims fix, database half (item 7). Run ONCE, in full, in the Supabase SQL
-- Editor (production). Not run by Claude.
--
-- What it changes:
-- A. The body text (BlogPost.content) of 5 published blog posts, 8 sentences in all, so they
--    make only the allowed claims. It also sets "updatedAt" on those 5 rows.
--   aws-cloud-certification-career-2025
--     "Exam pass guarantee — we refund your exam fee if you fail" → "Exam preparation — mock
--       tests and revision before you book your exam"
--     "Coss Cloud Solutions is a leading IT training institute in Hyderabad with centres …"
--       → "Coss Cloud Solutions has offered IT training in Hyderabad since 2010, with centres …"
--   data-analytics-course-hyderabad-beginners
--     "companies from TCS and Cognizant to smaller, product-based firms" → "IT services
--       companies and smaller, product-based firms"
--     "works for hundreds of students just like you" → "works for students just like you"
--     "back-office job in Gachibowli, making about ₹22,000 a month." → "back-office job in Gachibowli."
--   data-science-course-hyderabad-choosing-institute
--     "for companies like Deloitte or Tech Mahindra who hire fresh talent" → "for companies that
--       hire fresh talent"
--   multi-cloud-devops-course-hyderabad-career-guide
--     "Companies like Infosys, Capgemini, Deloitte, and numerous mid-sized product companies are
--       consistently hiring for these roles, and they're willing to pay for top talent." → "IT
--       services firms and many mid-sized product companies are consistently hiring for these roles."
--   top-10-reasons-cyber-security-career-hyderabad
--     "Government contracts are high-paying and stable." → "Government contracts are stable."
-- B. The search-result description (PageSeo.metaDescription) of /blog/master-aws-devops-in-hyderabad,
--    which today is a cut-off sentence: → "Learn AWS DevOps in Hyderabad: CI/CD, infrastructure
--    as code, monitoring and security on AWS, with hands-on labs at Coss Cloud Solutions, since
--    2010." Only if it is empty or still the old cut-off text; anything else stops the run.
-- Nothing else changes: no slugs, titles, statuses, canonical URLs, other columns or other rows.
--
-- Expected counts (from the read-only scan 2026-10-09-blog-claims-scan.sql, run 9 Oct on
-- production): 5 BlogPost rows, each old sentence found exactly once in its row; 1 PageSeo row
-- 'blog/master-aws-devops-in-hyderabad' (moved there by the 8 Oct rename SQL).
--
-- Safety: one transaction. The rows are copied first into coss_backup.blogpost_claims_20261009
-- (id, slug, content, updatedAt) and coss_backup.pageseo_claims_20261009 (id, pageSlug,
-- metaDescription, updatedAt). Checks then stop everything (nothing changed) if an old sentence
-- is not found exactly once, if any old sentence is left, if a new sentence is missing, if a
-- body shrinks or grows more than expected, or if any other column or row changed. Running it
-- a second time fails at once (the backup table already exists) and changes nothing.
-- Undo: 2026-10-09-blog-claims-rollback.sql.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'SQL ran'.
--
-- INDEPENDENT REVIEW: PASS (9 Oct 2026; two reviews. Notes applied: leftover checks narrowed to the
-- exact old phrases, published-status check, SEO row guard; surrounding text checked on the live posts)

BEGIN;

-- 1. Backup (fails if this file already ran: the table exists)
CREATE SCHEMA IF NOT EXISTS coss_backup;
CREATE TABLE coss_backup.blogpost_claims_20261009 AS
SELECT id, slug, content, "updatedAt"
FROM "BlogPost"
WHERE id IN ('cmpieh1an0003552d7caornk5', 'cmr09mhcg000e5s0h55malv9g', 'cmr8du7wr00025xxkiiw2wks4',
             'cmr8e725r00035xxkaqoq6ylg', 'cmpieh27i0005552drgbx2yrm');
CREATE TABLE coss_backup.pageseo_claims_20261009 AS
SELECT id, "pageSlug", "metaDescription", "updatedAt"
FROM "PageSeo"
WHERE "pageSlug" = 'blog/master-aws-devops-in-hyderabad';

-- Fingerprints, to prove nothing else changes
CREATE TEMP TABLE claims_five_before ON COMMIT DROP AS
SELECT b.id, md5((to_jsonb(b) - 'content' - 'updatedAt')::text) AS h
FROM "BlogPost" b
WHERE b.id IN (SELECT id FROM coss_backup.blogpost_claims_20261009);

CREATE TEMP TABLE claims_other_before ON COMMIT DROP AS
SELECT md5(string_agg(md5(b::text), ',' ORDER BY b.id)) AS h
FROM "BlogPost" b
WHERE b.id NOT IN (SELECT id FROM coss_backup.blogpost_claims_20261009);

CREATE TEMP TABLE claims_seo_before ON COMMIT DROP AS
SELECT
  (SELECT md5((to_jsonb(p) - 'metaDescription' - 'updatedAt')::text) FROM "PageSeo" p
     WHERE p."pageSlug" = 'blog/master-aws-devops-in-hyderabad') AS row_h,
  (SELECT md5(string_agg(md5(p::text), ',' ORDER BY p.id)) FROM "PageSeo" p
     WHERE p."pageSlug" <> 'blog/master-aws-devops-in-hyderabad') AS others_h;

-- The 8 fixes: row, old sentence (whitespace-tolerant pattern), replacement, a phrase the new
-- text must contain
CREATE TEMP TABLE claims_fix (n int, id text, re text, repl text, must text) ON COMMIT DROP;
INSERT INTO claims_fix VALUES
 (1, 'cmpieh1an0003552d7caornk5', 'Exam pass guarantee(\*\*)?\s+—\s+we refund your exam fee if you fail',
     'Exam preparation\1 — mock tests and revision before you book your exam', 'mock tests and revision before you book your exam'),
 (2, 'cmpieh1an0003552d7caornk5', 'Coss Cloud Solutions is a leading IT training institute in Hyderabad\s+with\s+centres',
     'Coss Cloud Solutions has offered IT training in Hyderabad since 2010, with centres', 'has offered IT training in Hyderabad since 2010, with centres'),
 (3, 'cmr09mhcg000e5s0h55malv9g', 'with\s+companies\s+from\s+TCS\s+and\s+Cognizant\s+to\s+smaller,\s+product-based\s+firms',
     'with IT services companies and smaller, product-based firms', 'with IT services companies and smaller, product-based firms'),
 (4, 'cmr09mhcg000e5s0h55malv9g', 'works\s+for\s+hundreds\s+of\s+students\s+just\s+like\s+you',
     'works for students just like you', 'works for students just like you'),
 (5, 'cmr09mhcg000e5s0h55malv9g', 'back-office\s+job\s+in\s+Gachibowli,\s+making\s+about\s+₹22,000\s+a\s+month\.',
     'back-office job in Gachibowli.', 'back-office job in Gachibowli.'),
 (6, 'cmr8du7wr00025xxkiiw2wks4', 'for\s+companies\s+like\s+Deloitte\s+or\s+Tech\s+Mahindra\s+who\s+hire\s+fresh\s+talent',
     'for companies that hire fresh talent', 'for companies that hire fresh talent'),
 (7, 'cmr8e725r00035xxkaqoq6ylg', 'Companies\s+like\s+Infosys,\s+Capgemini,\s+Deloitte,\s+and\s+numerous\s+mid-sized\s+product\s+companies\s+are\s+consistently\s+hiring\s+for\s+these\s+roles,\s+and\s+they[’'']re\s+willing\s+to\s+pay\s+for\s+top\s+talent\.',
     'IT services firms and many mid-sized product companies are consistently hiring for these roles.', 'IT services firms and many mid-sized product companies are consistently hiring for these roles.'),
 (8, 'cmpieh27i0005552drgbx2yrm', 'Government\s+contracts\s+are\s+high-paying\s+and\s+stable\.',
     'Government contracts are stable.', 'Government contracts are stable.');

DO $$
DECLARE
  f record;
  cnt int;
  new_desc constant text := 'Learn AWS DevOps in Hyderabad: CI/CD, infrastructure as code, monitoring and security on AWS, with hands-on labs at Coss Cloud Solutions, since 2010.';
BEGIN
  -- the 5 posts exist, are published and have content; the SEO row exists once and is empty
  -- or still the old cut-off text
  IF (SELECT count(*) FROM "BlogPost"
      WHERE id IN (SELECT id FROM coss_backup.blogpost_claims_20261009)
        AND status = 'published' AND content IS NOT NULL) <> 5 THEN
    RAISE EXCEPTION 'expected 5 published BlogPost rows, found % (% of them published)',
      (SELECT count(*) FROM coss_backup.blogpost_claims_20261009),
      (SELECT count(*) FROM "BlogPost" WHERE id IN (SELECT id FROM coss_backup.blogpost_claims_20261009) AND status = 'published');
  END IF;
  IF (SELECT count(*) FROM coss_backup.pageseo_claims_20261009) <> 1 THEN
    RAISE EXCEPTION 'expected 1 PageSeo row blog/master-aws-devops-in-hyderabad, found %',
      (SELECT count(*) FROM coss_backup.pageseo_claims_20261009);
  END IF;
  IF (SELECT count(*) FROM coss_backup.pageseo_claims_20261009
      WHERE "metaDescription" IS NULL OR btrim("metaDescription") = ''
         OR "metaDescription" ~ '^Master AWS DevOps in Hyderabad with Coss Cloud Solutions\s+AWS DevOps has become') <> 1 THEN
    RAISE EXCEPTION 'the PageSeo description is not empty or the old cut-off text; not touching it';
  END IF;
  -- each old sentence is in its row exactly once, before anything changes
  FOR f IN SELECT * FROM claims_fix ORDER BY n LOOP
    SELECT count(*) INTO cnt FROM "BlogPost" b, regexp_matches(b.content, f.re, 'g') m WHERE b.id = f.id;
    IF cnt <> 1 THEN
      RAISE EXCEPTION 'fix %: old sentence found % times in row % (expected 1)', f.n, cnt, f.id;
    END IF;
  END LOOP;

  -- 2. Change
  FOR f IN SELECT * FROM claims_fix ORDER BY n LOOP
    UPDATE "BlogPost" SET content = regexp_replace(content, f.re, f.repl) WHERE id = f.id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt <> 1 THEN RAISE EXCEPTION 'fix %: updated % rows', f.n, cnt; END IF;
  END LOOP;
  UPDATE "BlogPost" SET "updatedAt" = (now() AT TIME ZONE 'UTC')
  WHERE id IN (SELECT id FROM coss_backup.blogpost_claims_20261009);
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 5 THEN RAISE EXCEPTION 'updatedAt set on % rows (expected 5)', cnt; END IF;
  UPDATE "PageSeo" SET "metaDescription" = new_desc, "updatedAt" = (now() AT TIME ZONE 'UTC')
  WHERE "pageSlug" = 'blog/master-aws-devops-in-hyderabad';
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 1 THEN RAISE EXCEPTION 'PageSeo description set on % rows (expected 1)', cnt; END IF;

  -- 3. Checks
  FOR f IN SELECT * FROM claims_fix ORDER BY n LOOP
    -- the old sentence is gone
    SELECT count(*) INTO cnt FROM "BlogPost" b, regexp_matches(b.content, f.re, 'g') m WHERE b.id = f.id;
    IF cnt <> 0 THEN RAISE EXCEPTION 'fix %: old sentence still there % times', f.n, cnt; END IF;
    -- the new sentence is there exactly once
    SELECT (length(b.content) - length(replace(b.content, f.must, ''))) / length(f.must) INTO cnt
    FROM "BlogPost" b WHERE b.id = f.id;
    IF cnt <> 1 THEN RAISE EXCEPTION 'fix %: new text found % times (expected 1)', f.n, cnt; END IF;
  END LOOP;
  -- the old wording is gone from the 5 rows (exact phrases only, so other text can't trip it)
  SELECT count(*) INTO cnt
  FROM "BlogPost" b
  WHERE b.id IN (SELECT id FROM coss_backup.blogpost_claims_20261009)
    AND ( b.content ~* 'exam pass guarantee'
       OR b.content ~* 'leading IT training institute'
       OR b.content ~* 'TCS\s+and\s+Cognizant'
       OR b.content ~* 'hundreds\s+of\s+students'
       OR b.content ~ '₹22,000'
       OR b.content ~* 'Deloitte\s+or\s+Tech\s+Mahindra'
       OR b.content ~* 'Infosys,\s+Capgemini,\s+Deloitte'
       OR b.content ~* 'pay\s+for\s+top\s+talent'
       OR b.content ~* 'contracts\s+are\s+high-paying' );
  IF cnt <> 0 THEN RAISE EXCEPTION '% of the 5 rows still have an old phrase', cnt; END IF;
  -- bodies changed only by the expected amount (largest single cut is about 75 characters)
  SELECT count(*) INTO cnt
  FROM "BlogPost" b JOIN coss_backup.blogpost_claims_20261009 k USING (id)
  WHERE b.content IS NULL
     OR length(b.content) < length(k.content) - 150
     OR length(b.content) > length(k.content) + 40
     OR b.content = k.content;
  IF cnt <> 0 THEN RAISE EXCEPTION '% rows changed by an unexpected amount (or not at all)', cnt; END IF;
  -- nothing but content and updatedAt changed on the 5 rows (slug, title, status, dates …)
  SELECT count(*) INTO cnt FROM "BlogPost" b JOIN claims_five_before k USING (id)
  WHERE md5((to_jsonb(b) - 'content' - 'updatedAt')::text) <> k.h;
  IF cnt <> 0 THEN RAISE EXCEPTION 'other columns changed on % of the 5 rows', cnt; END IF;
  -- every other BlogPost row is unchanged
  IF (SELECT h FROM claims_other_before) IS DISTINCT FROM
     (SELECT md5(string_agg(md5(b::text), ',' ORDER BY b.id)) FROM "BlogPost" b
      WHERE b.id NOT IN (SELECT id FROM coss_backup.blogpost_claims_20261009)) THEN
    RAISE EXCEPTION 'another BlogPost row changed';
  END IF;
  -- the SEO row: new description in place, nothing else on it changed, other PageSeo rows unchanged
  IF (SELECT count(*) FROM "PageSeo" WHERE "pageSlug" = 'blog/master-aws-devops-in-hyderabad'
      AND "metaDescription" = new_desc) <> 1 THEN
    RAISE EXCEPTION 'PageSeo description not set';
  END IF;
  IF (SELECT row_h FROM claims_seo_before) IS DISTINCT FROM
     (SELECT md5((to_jsonb(p) - 'metaDescription' - 'updatedAt')::text) FROM "PageSeo" p
      WHERE p."pageSlug" = 'blog/master-aws-devops-in-hyderabad') THEN
    RAISE EXCEPTION 'another column changed on the PageSeo row';
  END IF;
  IF (SELECT others_h FROM claims_seo_before) IS DISTINCT FROM
     (SELECT md5(string_agg(md5(p::text), ',' ORDER BY p.id)) FROM "PageSeo" p
      WHERE p."pageSlug" <> 'blog/master-aws-devops-in-hyderabad') THEN
    RAISE EXCEPTION 'another PageSeo row changed';
  END IF;
END $$;

COMMIT;
