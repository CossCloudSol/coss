-- 2026-10-09 READ-ONLY status check for 2026-10-09-blog-claims.sql (item 7). Run in the Supabase
-- SQL Editor (production). It only reads (SELECT); nothing changes. Not run by Claude.
--
-- Answers: did the blog claims fix already go through (the 9 Oct run that ended with
-- 'relation "claims_five_before" does not exist')?
-- One row per item:
--   5 posts      old_text = still has an old sentence?  new_text = has all of its new sentences?
--   SEO row      new_text = the new AWS DevOps description is in place?
--   3 backups    exists = the backup table from the fix exists?  rls = RLS is on for it?
-- Copy the result grid to Claude Code.

SELECT 'post' AS kind, b.slug AS item,
       b.content ~* 'exam pass guarantee|leading IT training institute|TCS\s+and\s+Cognizant|hundreds\s+of\s+students|₹22,000|Deloitte\s+or\s+Tech\s+Mahindra|Infosys,\s+Capgemini,\s+Deloitte|pay\s+for\s+top\s+talent|contracts\s+are\s+high-paying' AS old_text,
       CASE b.id
         WHEN 'cmpieh1an0003552d7caornk5' THEN b.content LIKE '%mock tests and revision before you book your exam%' AND b.content LIKE '%has offered IT training in Hyderabad since 2010, with centres%'
         WHEN 'cmr09mhcg000e5s0h55malv9g' THEN b.content LIKE '%with IT services companies and smaller, product-based firms%' AND b.content LIKE '%works for students just like you%' AND b.content LIKE '%back-office job in Gachibowli.%'
         WHEN 'cmr8du7wr00025xxkiiw2wks4' THEN b.content LIKE '%for companies that hire fresh talent%'
         WHEN 'cmr8e725r00035xxkaqoq6ylg' THEN b.content LIKE '%IT services firms and many mid-sized product companies are consistently hiring for these roles.%'
         WHEN 'cmpieh27i0005552drgbx2yrm' THEN b.content LIKE '%Government contracts are stable.%'
       END AS new_text,
       NULL::boolean AS exists_, NULL::boolean AS rls,
       b."updatedAt"::text AS updated_at
FROM "BlogPost" b
WHERE b.id IN ('cmpieh1an0003552d7caornk5', 'cmr09mhcg000e5s0h55malv9g', 'cmr8du7wr00025xxkiiw2wks4',
               'cmr8e725r00035xxkaqoq6ylg', 'cmpieh27i0005552drgbx2yrm')
UNION ALL
SELECT 'seo', p."pageSlug", NULL,
       p."metaDescription" = 'Learn AWS DevOps in Hyderabad: CI/CD, infrastructure as code, monitoring and security on AWS, with hands-on labs at Coss Cloud Solutions, since 2010.',
       NULL, NULL, p."updatedAt"::text
FROM "PageSeo" p
WHERE p."pageSlug" = 'blog/master-aws-devops-in-hyderabad'
UNION ALL
SELECT 'backup', t.name, NULL, NULL,
       c.oid IS NOT NULL, c.relrowsecurity, NULL
FROM (VALUES ('blogpost_claims_20261009'), ('pageseo_claims_20261009'), ('blogpost_claims_fix_20261009')) AS t(name)
LEFT JOIN pg_namespace n ON n.nspname = 'coss_backup'
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = t.name
ORDER BY 1, 2;
