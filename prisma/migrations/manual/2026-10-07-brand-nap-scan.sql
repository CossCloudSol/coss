-- 2026-10-07 READ-ONLY scan for the brand-spelling / second-number SQL (item 8).
-- Run in the Supabase SQL Editor (production). It only reads (SELECT); nothing changes.
--
-- What it does: for every text column that reaches a page, counts the rows (ALL rows:
-- published, drafts, orphans) that still have
--   upper_brand    "COSS Cloud Solution(s)"   -> will become "Coss Cloud Solutions"
--   singular_brand "Coss Cloud Solution"      -> will become "Coss Cloud Solutions"
--   bare_coss      "COSS" on its own           -> will become "Coss"
--   second_number  77807 27374 (retired)
-- These counts become the expected counts of the change file.
--
-- After it runs: copy the result grid (or Download CSV) and paste it to Claude Code.
-- Not run by Claude.

SELECT * FROM (
SELECT 'PageSeo' AS tbl, 'pageTitle' AS col,
  count(*) FILTER (WHERE "pageTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "pageTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "pageTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "pageTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'metaTitle' AS col,
  count(*) FILTER (WHERE "metaTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "metaTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "metaTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "metaTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'metaDescription' AS col,
  count(*) FILTER (WHERE "metaDescription"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "metaDescription"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "metaDescription"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "metaDescription"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'ogTitle' AS col,
  count(*) FILTER (WHERE "ogTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "ogTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "ogTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "ogTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'ogDescription' AS col,
  count(*) FILTER (WHERE "ogDescription"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "ogDescription"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "ogDescription"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "ogDescription"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'focusKeyword' AS col,
  count(*) FILTER (WHERE "focusKeyword"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "focusKeyword"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "focusKeyword"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "focusKeyword"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'keywords' AS col,
  count(*) FILTER (WHERE "keywords"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "keywords"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "keywords"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "keywords"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'schemaMarkup' AS col,
  count(*) FILTER (WHERE "schemaMarkup"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaMarkup"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaMarkup"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaMarkup"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'PageSeo' AS tbl, 'schemaOverride' AS col,
  count(*) FILTER (WHERE "schemaOverride"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaOverride"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaOverride"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaOverride"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "PageSeo"
UNION ALL
SELECT 'Course' AS tbl, 'title' AS col,
  count(*) FILTER (WHERE "title"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "title"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "title"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "title"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'description' AS col,
  count(*) FILTER (WHERE "description"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "description"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "description"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "description"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'excerpt' AS col,
  count(*) FILTER (WHERE "excerpt"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "excerpt"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "excerpt"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "excerpt"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'highlights' AS col,
  count(*) FILTER (WHERE "highlights"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "highlights"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "highlights"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "highlights"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'seoTitle' AS col,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'seoDesc' AS col,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoDesc"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'Course' AS tbl, 'badge' AS col,
  count(*) FILTER (WHERE "badge"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "badge"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "badge"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "badge"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Course"
UNION ALL
SELECT 'CourseCategory' AS tbl, 'name' AS col,
  count(*) FILTER (WHERE "name"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "name"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "name"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "name"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "CourseCategory"
UNION ALL
SELECT 'CourseCategory' AS tbl, 'description' AS col,
  count(*) FILTER (WHERE "description"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "description"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "description"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "description"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "CourseCategory"
UNION ALL
SELECT 'CourseCategory' AS tbl, 'seoTitle' AS col,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "CourseCategory"
UNION ALL
SELECT 'CourseCategory' AS tbl, 'seoDesc' AS col,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoDesc"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "CourseCategory"
UNION ALL
SELECT 'BlogPost' AS tbl, 'title' AS col,
  count(*) FILTER (WHERE "title"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "title"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "title"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "title"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'excerpt' AS col,
  count(*) FILTER (WHERE "excerpt"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "excerpt"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "excerpt"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "excerpt"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'content' AS col,
  count(*) FILTER (WHERE "content"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "content"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "content"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "content"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'tags' AS col,
  count(*) FILTER (WHERE "tags"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "tags"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "tags"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "tags"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'seoTitle' AS col,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'seoDesc' AS col,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "seoDesc"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "seoDesc"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'author' AS col,
  count(*) FILTER (WHERE "author"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "author"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "author"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "author"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'BlogPost' AS tbl, 'authorRole' AS col,
  count(*) FILTER (WHERE "authorRole"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "authorRole"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "authorRole"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "authorRole"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "BlogPost"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'orgName' AS col,
  count(*) FILTER (WHERE "orgName"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "orgName"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "orgName"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "orgName"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'orgLegalName' AS col,
  count(*) FILTER (WHERE "orgLegalName"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "orgLegalName"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "orgLegalName"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "orgLegalName"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'primaryPhone' AS col,
  count(*) FILTER (WHERE "primaryPhone"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "primaryPhone"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "primaryPhone"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "primaryPhone"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'secondaryPhone' AS col,
  count(*) FILTER (WHERE "secondaryPhone"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "secondaryPhone"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "secondaryPhone"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "secondaryPhone"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'schemaOrgOverride' AS col,
  count(*) FILTER (WHERE "schemaOrgOverride"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaOrgOverride"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaOrgOverride"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaOrgOverride"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'schemaWebSiteOverride' AS col,
  count(*) FILTER (WHERE "schemaWebSiteOverride"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaWebSiteOverride"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaWebSiteOverride"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaWebSiteOverride"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'schemaDilsOverride' AS col,
  count(*) FILTER (WHERE "schemaDilsOverride"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaDilsOverride"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaDilsOverride"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaDilsOverride"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'SiteSettings' AS tbl, 'schemaAmeerpetOverride' AS col,
  count(*) FILTER (WHERE "schemaAmeerpetOverride"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "schemaAmeerpetOverride"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "schemaAmeerpetOverride"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "schemaAmeerpetOverride"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "SiteSettings"
UNION ALL
SELECT 'HomepageSettings' AS tbl, 'heroHeadline' AS col,
  count(*) FILTER (WHERE "heroHeadline"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "heroHeadline"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "heroHeadline"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "heroHeadline"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "HomepageSettings"
UNION ALL
SELECT 'HomepageSettings' AS tbl, 'heroSubtext' AS col,
  count(*) FILTER (WHERE "heroSubtext"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "heroSubtext"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "heroSubtext"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "heroSubtext"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "HomepageSettings"
UNION ALL
SELECT 'HomepageSettings' AS tbl, 'announcementText' AS col,
  count(*) FILTER (WHERE "announcementText"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "announcementText"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "announcementText"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "announcementText"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "HomepageSettings"
UNION ALL
SELECT 'HomepageSettings' AS tbl, 'featuredSectionTitle' AS col,
  count(*) FILTER (WHERE "featuredSectionTitle"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "featuredSectionTitle"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "featuredSectionTitle"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "featuredSectionTitle"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "HomepageSettings"
UNION ALL
SELECT 'HomepageSettings' AS tbl, 'featuredSectionSubtext' AS col,
  count(*) FILTER (WHERE "featuredSectionSubtext"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "featuredSectionSubtext"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "featuredSectionSubtext"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "featuredSectionSubtext"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "HomepageSettings"
UNION ALL
SELECT 'ContentBlock' AS tbl, 'title' AS col,
  count(*) FILTER (WHERE "title"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "title"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "title"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "title"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "ContentBlock"
UNION ALL
SELECT 'ContentBlock' AS tbl, 'body' AS col,
  count(*) FILTER (WHERE "body"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "body"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "body"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "body"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "ContentBlock"
UNION ALL
SELECT 'Testimonial' AS tbl, 'quote' AS col,
  count(*) FILTER (WHERE "quote"::text ~ 'COSS Cloud Solution') AS upper_brand,
  count(*) FILTER (WHERE "quote"::text ~ 'Coss Cloud Solution\M') AS singular_brand,
  count(*) FILTER (WHERE "quote"::text ~ '\mCOSS\M(?! Cloud)') AS bare_coss,
  count(*) FILTER (WHERE "quote"::text ~ '77807|7780727374') AS second_number,
  count(*) AS rows_in_table
FROM "Testimonial"
) s
WHERE upper_brand + singular_brand + bare_coss + second_number > 0
ORDER BY tbl, col;
