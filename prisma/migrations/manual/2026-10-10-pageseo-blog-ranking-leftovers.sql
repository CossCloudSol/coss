-- 2026-10-10 READ-ONLY: why 2026-10-10-pageseo-blog-ranking.sql stopped with
-- "18 blog PageSeo rows still have ranking wording". Run in the Supabase SQL Editor (production).
-- It only reads (SELECT); it creates nothing and changes nothing. Not run by Claude.
--
-- For every blog PageSeo row (pageSlug 'blog' or 'blog/...') it applies the SAME replacements as
-- that file, removes web addresses the same way, and lists each ranking phrase the file's check
-- would still find, with about 40 characters either side. One row per hit:
--   page_slug | col (pageTitle / schemaMarkup) | hit (the matched words) | context
-- Expect hits on 18 page_slugs. Download CSV and give it to Claude Code.

WITH src(page_slug, col, t) AS (
  SELECT "pageSlug", 'pageTitle', "pageTitle" FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
  UNION ALL
  SELECT "pageSlug", 'schemaMarkup', "schemaMarkup" FROM "PageSeo" WHERE "pageSlug" = 'blog' OR "pageSlug" LIKE 'blog/%'
),
after_fix(page_slug, col, t) AS (
  -- the file's replacements (coss_unrank), then the check's address removal (coss_ranked)
  SELECT page_slug, col,
    coalesce(regexp_replace(
      regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
        t,
        'Hyderabad[’'']s leading IT institute\.', 'Hyderabad, since 2010.', 'g'),
        'Hyderabad[’'']s lea[A-Za-z ]*…', 'Hyderabad…', 'g'),
        '(^|"|– |- )Best ', '\1', 'g'),
        'Top-Rated ', '', 'g'),
        'Industry Leading ', '', 'g'),
        'at the Top ', 'at a ', 'g'),
      '(https?:)?(\\?/)+[^"[:space:]]*', '', 'g'), '')
  FROM src
)
SELECT a.page_slug, a.col, m[2] AS hit, regexp_replace(m[1], '\s+', ' ', 'g') AS context
FROM after_fix a
CROSS JOIN LATERAL regexp_matches(a.t,
  '(.{0,40}(\m(?:best|top-rated|top rated|top|leading|premier|renowned|most trusted|number one|industry[- ]leading|unmatched|unparalleled|finest)\M[^.<"]{0,30}\m(?:institutes?|institution|training providers?|course providers?|training cent(?:re|er)s?|academy)\M|\mtop-rated\M|leading IT inst|Hyderabad[’'']s lead).{0,40})',
  'gi') AS m
ORDER BY a.page_slug, a.col;
