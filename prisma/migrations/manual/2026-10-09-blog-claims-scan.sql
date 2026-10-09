-- 2026-10-09 READ-ONLY scan for the blog claims fix (item 7, database half).
-- Run in the Supabase SQL Editor (production). It only reads (SELECT); nothing changes.
-- Not run by Claude.
--
-- What it does: looks through the blog text stored in the database — every BlogPost row
-- (published, drafts and any others) and the PageSeo rows for blog pages ('blog' and
-- 'blog/...') — for claims the site no longer makes:
--   ranking      "best / top / leading / premier ... institute", "Coss is the best ..."
--   salary       pay figures (LPA, lakhs per annum, ₹ per month)
--   high_paying  "high-paying", "lucrative", "dream job"
--   placement    placement records/rates, "students were placed", "100% job/placement"
--   guarantee    any "guarantee" wording (most are fine: "not guaranteed"; listed to check)
--   numbers      "thousands/hundreds of students", "15+ years", student counts other than 5,000+
--   ratings      "4.9/5", "top-rated", "highly rated"
--   kukatpally   Kukatpally / KPHB (there is no Kukatpally branch)
--   employers    named companies next to hiring / placed / partner
--   offer        "mention this blog", discounts
-- (The blog posts kept as files in the code were fixed separately; this is only the database.)
--
-- Output: one row per match, with about 100 characters either side so each sentence can be
-- rewritten by hand. An empty result ("Success. No rows returned") means nothing to fix.
--
-- After it runs: Download CSV (or copy the grid) and give it to Claude Code.

WITH texts(tbl, row_id, slug, status, col, t) AS (
  SELECT 'BlogPost', id, slug, status, 'title',    title         FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', id, slug, status, 'excerpt',  excerpt       FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', id, slug, status, 'content',  content       FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', id, slug, status, 'seoTitle', "seoTitle"    FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', id, slug, status, 'seoDesc',  "seoDesc"     FROM "BlogPost"
  UNION ALL SELECT 'BlogPost', id, slug, status, 'tags',     array_to_string(tags, ' | ') FROM "BlogPost"
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'pageTitle',       "pageTitle"       FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'metaTitle',       "metaTitle"       FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'metaDescription', "metaDescription" FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'ogTitle',         "ogTitle"         FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'ogDescription',   "ogDescription"   FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'keywords',        keywords          FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL SELECT 'PageSeo', id, "pageSlug", NULL, 'schemaMarkup',    "schemaMarkup"    FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
),
pats(kind, re) AS (VALUES
  ('ranking',     '\m(best|top-rated|top rated|top|leading|premier|renowned|most trusted|number one|no\. ?1|#1|go-to|industry-leading|unmatched|unparalleled|finest)\M[^.<]{0,30}\m(institutes?|institution|training providers?|training cent(re|er)s?|academy|coaching)\M'),
  ('ranking',     '\mcoss\M[^.<]{0,50}\m(is|as) (the|one of the) (best|top|leading|premier|most trusted|finest)\M'),
  ('salary',      '[0-9][0-9.,]*\s?(-|–|to)?\s?[0-9.,]*\s?(lpa|lakhs? per annum|lakhs? annually|lacs?)\M'),
  ('salary',      '₹\s?[0-9][0-9,.]*\s?(-|–|to)?\s?₹?[0-9,.]*\s?(lpa|per annum|per month|monthly|a month|/month)'),
  ('salary',      '\msalar(y|ies)\M[^.<]{0,60}[0-9]'),
  ('high_paying', '\m(high[- ]paying|lucrative|dream jobs?|six[- ]figure)\M'),
  ('placement',   '\mplacement (record|rate|track record|success)s?\M'),
  ('placement',   '\m(students?|graduates|alumni|candidates|learners)\M[^.<]{0,40}\m(were|have been|are now|got|successfully|been) placed\M'),
  ('placement',   '100\s?% (job|placement)'),
  ('guarantee',   '\mguarantee(d|s)?\M'),
  ('numbers',     '\m(thousands|hundreds|lakhs) of (students|learners|professionals|graduates|aspirants)\M'),
  ('numbers',     '\m(1[0-9]|20)\+? ?(years|yrs)\M'),
  ('numbers',     '\m[0-9]{1,3},[0-9]{3}\+?\s?(students|learners|professionals|graduates|alumni)\M'),
  ('ratings',     '[0-9](\.[0-9])?\s?(/\s?5|out of 5|stars?)\M|\mtop-rated\M|\mhighly rated\M|\m5-star\M'),
  ('kukatpally',  '\m(kukatpally|kphb)\M'),
  ('employers',   '\m(amazon|microsoft|google|deloitte|infosys|tcs|wipro|accenture|capgemini|cognizant|ibm|hcl|tech mahindra|kpmg|genpact|oracle)\M[^.<]{0,60}\m(hire|hires|hiring|recruit[a-z]*|placed|tie-?ups?|partner[a-z]*)\M'),
  ('offer',       'mention this blog|\mdiscount\M')
)
SELECT x.tbl, x.slug, x.status, x.col, p.kind,
       regexp_replace(m.hit[1], '\s+', ' ', 'g') AS context,
       x.row_id
FROM texts x
JOIN pats p ON x.t ~* p.re
CROSS JOIN LATERAL regexp_matches(x.t, '(.{0,100}(' || p.re || ').{0,100})', 'gi') AS m(hit)
-- the allowed "5,000+ students" count is not a hit
WHERE NOT (p.kind = 'numbers' AND m.hit[2] ~* '^5,000\+')
ORDER BY x.tbl, x.slug, x.col, p.kind;
