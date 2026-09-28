-- 2026-09-28 header v2 data fixes. Run in the Supabase SQL Editor (one transaction).
-- Not run by Claude. Every part ends with SELECT checks; expected results are in the comments.
-- Postgres 13+ (gen_random_uuid() is built in).

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- a) Move the course in category "AWS DEVOPS" (slug aws-devops) into
--    "DevOps & Multi-Cloud" (slug devops-multi-cloud); delete the category if empty.
--    The course's nested URL changes, so two redirects are recorded as well.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Course" AS c
SET "categoryId"   = dm.id,
    "categorySlug" = dm.slug,
    "category"     = dm.name,
    "updatedAt"    = now()
FROM "CourseCategory" AS dm
WHERE dm.slug = 'devops-multi-cloud'
  AND (c."categorySlug" = 'aws-devops'
       OR c."categoryId" = (SELECT id FROM "CourseCategory" WHERE slug = 'aws-devops'));
-- Expected: UPDATE 1 (aws-devops-training-institute-in-hyderabad)

DELETE FROM "CourseCategory" AS cat
WHERE cat.slug = 'aws-devops'
  AND NOT EXISTS (
    SELECT 1 FROM "Course" c
    WHERE c."categoryId" = cat.id OR c."categorySlug" = 'aws-devops'
  );
-- Expected: DELETE 1

INSERT INTO "Redirect" (id, source, destination, "statusCode", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, '/courses/aws-devops', '/courses/devops-multi-cloud', 308, true, now()),
  (gen_random_uuid()::text, '/courses/aws-devops/aws-devops-training-institute-in-hyderabad',
   '/courses/devops-multi-cloud/aws-devops-training-institute-in-hyderabad', 308, true, now())
ON CONFLICT (source) DO UPDATE
SET destination = EXCLUDED.destination, "statusCode" = 308, "isActive" = true, "updatedAt" = now();

-- Check a1 — expect 1 row: category = 'DevOps & Multi-Cloud', categorySlug = 'devops-multi-cloud'
SELECT slug, category, "categorySlug", status
FROM "Course" WHERE slug = 'aws-devops-training-institute-in-hyderabad';
-- Check a2 — expect 0
SELECT count(*) AS aws_devops_category_left FROM "CourseCategory" WHERE slug = 'aws-devops';
-- Check a3 — expect 6 (5 existing + this course), all published
SELECT count(*) AS devops_multi_cloud_courses FROM "Course"
WHERE "categorySlug" = 'devops-multi-cloud' AND status = 'published';
-- Check a4 — expect 2 rows, statusCode 308, isActive true
SELECT source, destination, "statusCode", "isActive" FROM "Redirect"
WHERE source LIKE '/courses/aws-devops%' ORDER BY source;

-- ─────────────────────────────────────────────────────────────────────────────
-- b) Two courses titled "Microsoft Azure Administrator Training".
--    Leftover: azure-administrator-certification-training-hyderabad (nested URL,
--    already 308-redirected to the other in next.config.mjs). Keep:
--    azure-administrator-training-in-hyderabad (canonical, landing-page target).
--    First copy the leftover's thumbnail and featured flag onto the kept course
--    (duration left as is), then unpublish the leftover (not deleted) and
--    record its redirects in the table.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Course" AS keep
SET thumbnail   = old.thumbnail,
    featured    = true,
    "updatedAt" = now()
FROM "Course" AS old
WHERE keep.slug = 'azure-administrator-training-in-hyderabad'
  AND old.slug  = 'azure-administrator-certification-training-hyderabad';
-- Expected: UPDATE 1

UPDATE "Course"
SET status = 'draft', featured = false, "updatedAt" = now()
WHERE slug = 'azure-administrator-certification-training-hyderabad';
-- Expected: UPDATE 1

INSERT INTO "Redirect" (id, source, destination, "statusCode", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, '/courses/cloud-computing/azure-administrator-certification-training-hyderabad',
   '/courses/azure-administrator-training-in-hyderabad', 308, true, now()),
  (gen_random_uuid()::text, '/courses/azure-administrator-certification-training-hyderabad',
   '/courses/azure-administrator-training-in-hyderabad', 308, true, now())
ON CONFLICT (source) DO UPDATE
SET destination = EXCLUDED.destination, "statusCode" = 308, "isActive" = true, "updatedAt" = now();

-- Check b1 — expect 2 rows: the certification slug 'draft' / featured false / 45 Days;
--            azure-administrator-training-in-hyderabad 'published' / featured true / 60 Days
SELECT slug, title, status, featured, duration FROM "Course"
WHERE slug IN ('azure-administrator-certification-training-hyderabad', 'azure-administrator-training-in-hyderabad')
ORDER BY slug;
-- Check b1b — expect 1 row: thumbnail_copied = true, thumbnail starts with
--            https://res.cloudinary.com/dfditihuw/ (the same URL on both rows)
SELECT keep.slug, keep.featured,
       keep.thumbnail IS NOT NULL AND keep.thumbnail = old.thumbnail AS thumbnail_copied,
       keep.thumbnail
FROM "Course" keep, "Course" old
WHERE keep.slug = 'azure-administrator-training-in-hyderabad'
  AND old.slug  = 'azure-administrator-certification-training-hyderabad';
-- Check b2 — expect 1: exactly one published course with this title
SELECT count(*) AS published_azure_admin FROM "Course"
WHERE title = 'Microsoft Azure Administrator Training' AND status = 'published';
-- Check b3 — expect 2 rows → /courses/azure-administrator-training-in-hyderabad, 308, active
SELECT source, destination, "statusCode", "isActive" FROM "Redirect"
WHERE source LIKE '%azure-administrator-certification-training-hyderabad' ORDER BY source;

-- ─────────────────────────────────────────────────────────────────────────────
-- c) Topbar (AnnouncementBar singleton) for the new header strip.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "AnnouncementBar"
SET enabled = true,
    text = 'Upcoming batches filling fast',
    "ctaLabel" = 'See dates',
    "ctaUrl" = '/batches',
    "updatedAt" = now();
-- Expected: UPDATE 1 (the site has one row)

INSERT INTO "AnnouncementBar" (id, enabled, text, "ctaLabel", "ctaUrl", "updatedAt")
SELECT gen_random_uuid()::text, true, 'Upcoming batches filling fast', 'See dates', '/batches', now()
WHERE NOT EXISTS (SELECT 1 FROM "AnnouncementBar");
-- Expected: INSERT 0 0 (a row already exists)

-- Check c1 — expect exactly 1 row: true | Upcoming batches filling fast | See dates | /batches
SELECT enabled, text, "ctaLabel", "ctaUrl" FROM "AnnouncementBar";

COMMIT;
