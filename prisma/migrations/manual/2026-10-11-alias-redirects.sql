-- 2026-10-11  Point the redirect rows of retired duplicate courses straight at the course's
-- final (flat canonical) page. SINGLE-RUN GUARDED. Run once, in full, in the Supabase SQL Editor.
-- Not run by Claude.
--
-- WHAT: 10 existing "Redirect" rows (5 retired duplicate courses) currently redirect to the nested
--   /courses/<cat>/<slug> URL of the surviving course, which then lands on that course's flat page:
--   a two-hop chain. They are changed to redirect to the flat page directly.
--   Only "Redirect"."destination" (and "updatedAt") change. No course is unpublished, merged or
--   deleted. No source URL is added or removed. statusCode and isActive are untouched.
--
--   source (the retired duplicate)                                         -> new destination
--   /courses/software-testing-os/linux-shell-scripting-training-hyderabad  -> /linux-administration-training-institute-in-hyderabad
--   /courses/linux-shell-scripting-training-hyderabad                      -> /linux-administration-training-institute-in-hyderabad
--   /courses/digital-design/digital-marketing-training-institute-in-hyderabad -> /digital-marketing-training-institute-in-hyderabad
--   /courses/digital-marketing-training-institute-in-hyderabad             -> /digital-marketing-training-institute-in-hyderabad
--   /courses/artificial-intelligence-training-institute-in-hyderabad       -> /artificial-intelligence-training-institute-in-hyderabad
--   /courses/data-analytics-bi/artificial-intelligence-training-institute-in-hyderabad -> same
--   /courses/full-stack-java-developer-bootcamp                            -> /java-training-institute-in-hyderabad
--   /courses/programming-full-stack/full-stack-java-developer-bootcamp     -> /java-training-institute-in-hyderabad
--   /courses/full-stack-java-training-in-hyderabad                         -> /java-training-institute-in-hyderabad
--   /courses/programming-full-stack/full-stack-java-training-in-hyderabad  -> /java-training-institute-in-hyderabad
--
-- EXPECTED: step 1 (preview) returns 10 rows, every row "matches_expected" = true.
--           step 2 prints UPDATE 10 and RETURNING lists the 10 rows.
--           The DO block raises an exception (and nothing is committed) on any other count.
--           Success = the final SELECT returns 10 rows with ok = true, then COMMIT.
-- IF ANYTHING ERRORS: the transaction aborts, nothing changed. Send the message back.
-- AFTER SUCCESS: regenerate redirects.config.mjs (Admin -> Redirects sync, or
--   node scripts/run-sync-redirects.mjs) and commit the file; the new destinations go live with
--   the next production deploy. Rollback: 2026-10-11-alias-redirects-rollback.sql.
-- INDEPENDENT REVIEW: not run (Subodh reviews this file in chat).
-- Postgres 13+. Schema: prisma/schema.prisma, model Redirect.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1) PREVIEW (read-only). Run this block first; expect 10 rows, all true.
-- ═════════════════════════════════════════════════════════════════════════════
WITH expected(source, old_destination, new_destination) AS (
  VALUES
    ('/courses/software-testing-os/linux-shell-scripting-training-hyderabad',
     '/courses/software-testing-os/linux-shell-scripting-training-in-hyderabad',
     '/linux-administration-training-institute-in-hyderabad'),
    ('/courses/linux-shell-scripting-training-hyderabad',
     '/courses/software-testing-os/linux-shell-scripting-training-in-hyderabad',
     '/linux-administration-training-institute-in-hyderabad'),
    ('/courses/digital-design/digital-marketing-training-institute-in-hyderabad',
     '/courses/digital-design/digital-marketing-training-in-hyderabad',
     '/digital-marketing-training-institute-in-hyderabad'),
    ('/courses/digital-marketing-training-institute-in-hyderabad',
     '/courses/digital-design/digital-marketing-training-in-hyderabad',
     '/digital-marketing-training-institute-in-hyderabad'),
    ('/courses/artificial-intelligence-training-institute-in-hyderabad',
     '/courses/artificial-intelligence-training/artificial-intelligence-ai-training-hyderabad',
     '/artificial-intelligence-training-institute-in-hyderabad'),
    ('/courses/data-analytics-bi/artificial-intelligence-training-institute-in-hyderabad',
     '/courses/artificial-intelligence-training/artificial-intelligence-ai-training-hyderabad',
     '/artificial-intelligence-training-institute-in-hyderabad'),
    ('/courses/full-stack-java-developer-bootcamp',
     '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
     '/java-training-institute-in-hyderabad'),
    ('/courses/programming-full-stack/full-stack-java-developer-bootcamp',
     '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
     '/java-training-institute-in-hyderabad'),
    ('/courses/full-stack-java-training-in-hyderabad',
     '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
     '/java-training-institute-in-hyderabad'),
    ('/courses/programming-full-stack/full-stack-java-training-in-hyderabad',
     '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
     '/java-training-institute-in-hyderabad')
)
SELECT e.source,
       r.destination                         AS current_destination,
       e.new_destination,
       r."statusCode",
       r."isActive",
       (r.destination = e.old_destination)   AS matches_expected
FROM expected e
LEFT JOIN "Redirect" r ON r.source = e.source
ORDER BY e.source;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2) THE CHANGE. Run from here to COMMIT in one go.
-- ═════════════════════════════════════════════════════════════════════════════
BEGIN;

-- Backup of exactly the rows that will change.
CREATE SCHEMA IF NOT EXISTS coss_backup;
CREATE TABLE coss_backup.redirect_alias_20261011 AS
SELECT * FROM "Redirect"
WHERE source IN (
  '/courses/software-testing-os/linux-shell-scripting-training-hyderabad',
  '/courses/linux-shell-scripting-training-hyderabad',
  '/courses/digital-design/digital-marketing-training-institute-in-hyderabad',
  '/courses/digital-marketing-training-institute-in-hyderabad',
  '/courses/artificial-intelligence-training-institute-in-hyderabad',
  '/courses/data-analytics-bi/artificial-intelligence-training-institute-in-hyderabad',
  '/courses/full-stack-java-developer-bootcamp',
  '/courses/programming-full-stack/full-stack-java-developer-bootcamp',
  '/courses/full-stack-java-training-in-hyderabad',
  '/courses/programming-full-stack/full-stack-java-training-in-hyderabad'
);

-- The change: only rows whose destination is exactly the expected old value are touched.
UPDATE "Redirect" AS r
SET destination = v.new_destination,
    "updatedAt" = now()
FROM (VALUES
  ('/courses/software-testing-os/linux-shell-scripting-training-hyderabad',
   '/courses/software-testing-os/linux-shell-scripting-training-in-hyderabad',
   '/linux-administration-training-institute-in-hyderabad'),
  ('/courses/linux-shell-scripting-training-hyderabad',
   '/courses/software-testing-os/linux-shell-scripting-training-in-hyderabad',
   '/linux-administration-training-institute-in-hyderabad'),
  ('/courses/digital-design/digital-marketing-training-institute-in-hyderabad',
   '/courses/digital-design/digital-marketing-training-in-hyderabad',
   '/digital-marketing-training-institute-in-hyderabad'),
  ('/courses/digital-marketing-training-institute-in-hyderabad',
   '/courses/digital-design/digital-marketing-training-in-hyderabad',
   '/digital-marketing-training-institute-in-hyderabad'),
  ('/courses/artificial-intelligence-training-institute-in-hyderabad',
   '/courses/artificial-intelligence-training/artificial-intelligence-ai-training-hyderabad',
   '/artificial-intelligence-training-institute-in-hyderabad'),
  ('/courses/data-analytics-bi/artificial-intelligence-training-institute-in-hyderabad',
   '/courses/artificial-intelligence-training/artificial-intelligence-ai-training-hyderabad',
   '/artificial-intelligence-training-institute-in-hyderabad'),
  ('/courses/full-stack-java-developer-bootcamp',
   '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
   '/java-training-institute-in-hyderabad'),
  ('/courses/programming-full-stack/full-stack-java-developer-bootcamp',
   '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
   '/java-training-institute-in-hyderabad'),
  ('/courses/full-stack-java-training-in-hyderabad',
   '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
   '/java-training-institute-in-hyderabad'),
  ('/courses/programming-full-stack/full-stack-java-training-in-hyderabad',
   '/courses/programming-full-stack/full-stack-java-developer-training-in-hyderabad',
   '/java-training-institute-in-hyderabad')
) AS v(source, old_destination, new_destination)
WHERE r.source = v.source
  AND r.destination = v.old_destination
RETURNING r.source, v.old_destination, r.destination AS new_destination, r."statusCode", r."isActive";
-- Expected: UPDATE 10

-- Assertions: any surprise raises, and nothing is committed.
DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM coss_backup.redirect_alias_20261011;
  IF n <> 10 THEN
    RAISE EXCEPTION 'expected 10 backed-up rows, got %. Nothing was committed.', n;
  END IF;

  -- exactly 10 rows were written in this transaction (now() is the transaction start time)
  SELECT count(*) INTO n FROM "Redirect" WHERE "updatedAt" = now();
  IF n <> 10 THEN
    RAISE EXCEPTION 'expected 10 redirect rows updated, got %', n;
  END IF;

  -- every changed row now points at one of the three flat pages, and status / active are untouched
  SELECT count(*) INTO n
  FROM "Redirect" r
  JOIN coss_backup.redirect_alias_20261011 b ON b.id = r.id
  WHERE r.destination IN (
          '/linux-administration-training-institute-in-hyderabad',
          '/digital-marketing-training-institute-in-hyderabad',
          '/artificial-intelligence-training-institute-in-hyderabad',
          '/java-training-institute-in-hyderabad')
    AND r."statusCode" = b."statusCode"
    AND r."isActive" = b."isActive"
    AND r.source = b.source;
  IF n <> 10 THEN
    RAISE EXCEPTION 'expected 10 rows on the flat pages with status/active unchanged, got %', n;
  END IF;

  -- the four flat pages are not themselves redirect sources (no hop, no loop)
  SELECT count(*) INTO n FROM "Redirect"
  WHERE "isActive" AND source IN (
          '/linux-administration-training-institute-in-hyderabad',
          '/digital-marketing-training-institute-in-hyderabad',
          '/artificial-intelligence-training-institute-in-hyderabad',
          '/java-training-institute-in-hyderabad');
  IF n <> 0 THEN
    RAISE EXCEPTION 'a target page is itself a redirect source (% rows)', n;
  END IF;

  -- nothing else changed: the Redirect table has the same number of rows as before
  SELECT count(*) INTO n FROM "Redirect" r
  WHERE r."updatedAt" = now()
    AND r.id NOT IN (SELECT id FROM coss_backup.redirect_alias_20261011);
  IF n <> 0 THEN
    RAISE EXCEPTION '% rows outside the intended set changed', n;
  END IF;
END $$;

-- Verify (expect 10 rows, ok = true).
SELECT r.source, r.destination, r."statusCode", r."isActive",
       r.destination IN (
         '/linux-administration-training-institute-in-hyderabad',
         '/digital-marketing-training-institute-in-hyderabad',
         '/artificial-intelligence-training-institute-in-hyderabad',
         '/java-training-institute-in-hyderabad') AS ok
FROM "Redirect" r
WHERE r.id IN (SELECT id FROM coss_backup.redirect_alias_20261011)
ORDER BY r.source;

COMMIT;
