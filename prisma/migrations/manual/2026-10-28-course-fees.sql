-- 2026-10-28 Course fees: client-approved "From" prices (fee review sheet, 28 Oct 2026).
-- Run ONCE, in full, in the Supabase SQL Editor (production). Not run by Claude.
-- If the editor asks about Row Level Security, click "Run without RLS": this file turns RLS on
-- for the one table it creates (the backup, in the coss_backup schema).
--
-- What it changes, on table "Course" only (no new columns):
--   1. 28 published course rows get the client's fee as "price", plus "duration",
--      "mode" = 'Classroom + Online', and "updatedAt". Two of them are also renamed:
--        devops-training-institute-in-hyderabad      title -> DevOps Essentials
--        multi-cloud-architecture-training-in-hyderabad  title -> Multi Cloud with DevOps
--      URLs (slugs) do not change.
--   2. "originalPrice" is set to NULL on EVERY course row that has one (the site no longer shows
--      crossed-out prices: a reference price that was never charged is a misleading discount
--      under the CCPA guidelines). The code in PR feat/course-fees stops rendering it too.
-- Not in this file: Cloud Computing (AWS + Azure), German and the AI single modules have no course
-- row yet; AI Foundation keeps its fee (Subodh's call, 28 Oct).
--
-- Safety: one transaction. Every row this file changes is copied first into
-- coss_backup.course_fees_20261028 (id, slug, title, price, originalPrice, duration, mode,
-- updatedAt). Checks then stop everything (nothing changed) unless all 28 slugs exist and are
-- published, exactly 28 rows get the new fee, no course still has an originalPrice, the
-- Course row count is unchanged, and the 28 rows hold exactly the new values. Running it a
-- second time fails at once (the backup table already exists) and changes nothing.
-- Undo: 2026-10-28-course-fees-rollback.sql.
--
-- WHEN: before the feat/course-fees merge, so the deploy's build renders the new fees.
-- If you see ERROR: nothing changed; paste the error to Claude.
-- If you see Success (STEP 3 shows 28 rows with the new fee, and 0 crossed-out prices): tell
-- Claude 'SQL ran'.

-- ── STEP 1: preview (read-only) ─────────────────────────────────────────────────────────────
-- 1a. The 28 rows as they are now. Expected: 28 rows, all status published.
SELECT slug, title, status, price, "originalPrice", duration, mode
FROM "Course"
WHERE slug IN ('artificial-intelligence-ai-training-hyderabad', 'artificial-intelligence-training-institute-in-hyderabad', 'aws-devops-training-institute-in-hyderabad', 'azure-devops-training-in-hyderabad', 'linux-shell-scripting-training-hyderabad', 'linux-shell-scripting-training-in-hyderabad', 'data-science-training-institute-in-hyderabad', 'data-analytics-training-institute-in-hyderabad', 'cyber-security-training-institute-in-hyderabad', 'ethical-hacking-training-institute-in-hyderabad', 'ethical-hacking-ceh-training-hyderabad', 'ceh-certification-training-in-hyderabad', 'ethical-hacking-cyber-security-professional', 'digital-marketing-training-in-hyderabad', 'digital-marketing-training-institute-in-hyderabad', 'hr-recruitment', 'hr-recruitment-training-in-hyderabad', 'hr-operations-training-in-hyderabad', 'hr-management-training-in-hyderabad', 'hr-leadership-training-in-hyderabad', 'hr-learning-development-training-in-hyderabad', 'hr-business-partner-training-in-hyderabad', 'full-stack-python-training-in-hyderabad', 'full-stack-java-training-in-hyderabad', 'full-stack-java-developer-training-in-hyderabad', 'full-stack-java-developer-bootcamp', 'multi-cloud-architecture-training-in-hyderabad', 'devops-training-institute-in-hyderabad')
ORDER BY slug;

-- 1b. Courses with a crossed-out price today (any status).
SELECT count(*) AS courses_with_original_price FROM "Course" WHERE "originalPrice" IS NOT NULL;

-- ── STEP 2: the change (one transaction) ──────────────────────────────────────────────────
BEGIN;
SET LOCAL lock_timeout = '3s';

CREATE TEMP TABLE fee_map (slug text PRIMARY KEY, price double precision NOT NULL, duration text NOT NULL, title text) ON COMMIT DROP;
INSERT INTO fee_map (slug, price, duration, title) VALUES
    ('artificial-intelligence-ai-training-hyderabad', 50000, '3 Months', NULL),
    ('artificial-intelligence-training-institute-in-hyderabad', 50000, '3 Months', NULL),
    ('aws-devops-training-institute-in-hyderabad', 30000, '3 Months', NULL),
    ('azure-devops-training-in-hyderabad', 30000, '3 Months', NULL),
    ('linux-shell-scripting-training-hyderabad', 12000, '45 Days', NULL),
    ('linux-shell-scripting-training-in-hyderabad', 12000, '45 Days', NULL),
    ('data-science-training-institute-in-hyderabad', 35000, '6 Months', NULL),
    ('data-analytics-training-institute-in-hyderabad', 30000, '4 Months', NULL),
    ('cyber-security-training-institute-in-hyderabad', 35000, '3 Months', NULL),
    ('ethical-hacking-training-institute-in-hyderabad', 30000, '3 Months', NULL),
    ('ethical-hacking-ceh-training-hyderabad', 30000, '3 Months', NULL),
    ('ceh-certification-training-in-hyderabad', 30000, '3 Months', NULL),
    ('ethical-hacking-cyber-security-professional', 30000, '3 Months', NULL),
    ('digital-marketing-training-in-hyderabad', 30000, '3 Months', NULL),
    ('digital-marketing-training-institute-in-hyderabad', 30000, '3 Months', NULL),
    ('hr-recruitment', 30000, '2 Months', NULL),
    ('hr-recruitment-training-in-hyderabad', 30000, '2 Months', NULL),
    ('hr-operations-training-in-hyderabad', 30000, '2 Months', NULL),
    ('hr-management-training-in-hyderabad', 30000, '2 Months', NULL),
    ('hr-leadership-training-in-hyderabad', 30000, '2 Months', NULL),
    ('hr-learning-development-training-in-hyderabad', 30000, '2 Months', NULL),
    ('hr-business-partner-training-in-hyderabad', 30000, '2 Months', NULL),
    ('full-stack-python-training-in-hyderabad', 30000, '4 Months', NULL),
    ('full-stack-java-training-in-hyderabad', 32000, '4 Months', NULL),
    ('full-stack-java-developer-training-in-hyderabad', 32000, '4 Months', NULL),
    ('full-stack-java-developer-bootcamp', 32000, '4 Months', NULL),
    ('multi-cloud-architecture-training-in-hyderabad', 45000, '5 Months', 'Multi Cloud with DevOps'),
    ('devops-training-institute-in-hyderabad', 15000, '45 Days', 'DevOps Essentials');

CREATE TABLE coss_backup.course_fees_20261028 AS
SELECT id, slug, title, price, "originalPrice", duration, mode, "updatedAt"
FROM "Course"
WHERE slug IN (SELECT slug FROM fee_map) OR "originalPrice" IS NOT NULL;
ALTER TABLE coss_backup.course_fees_20261028 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  total_before bigint;
  cnt int;
BEGIN
  SELECT count(*) INTO total_before FROM "Course";

  SELECT count(*) INTO cnt FROM fee_map;
  IF cnt <> 28 THEN RAISE EXCEPTION 'fee map has % rows, expected 28; nothing changed', cnt; END IF;

  SELECT count(*) INTO cnt FROM "Course" c JOIN fee_map m USING (slug) WHERE c.status = 'published';
  IF cnt <> 28 THEN RAISE EXCEPTION 'expected 28 published courses for the fee map, found %; nothing changed', cnt; END IF;

  UPDATE "Course" c SET
    price = m.price,
    duration = m.duration,
    mode = 'Classroom + Online',
    title = COALESCE(m.title, c.title),
    "updatedAt" = now()
  FROM fee_map m
  WHERE c.slug = m.slug AND c.status = 'published';
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 28 THEN RAISE EXCEPTION 'expected 28 fee rows updated, got %', cnt; END IF;

  UPDATE "Course" SET "originalPrice" = NULL, "updatedAt" = now() WHERE "originalPrice" IS NOT NULL;

  IF EXISTS (SELECT 1 FROM "Course" WHERE "originalPrice" IS NOT NULL) THEN
    RAISE EXCEPTION 'a course still has an originalPrice';
  END IF;
  IF (SELECT count(*) FROM "Course") <> total_before THEN RAISE EXCEPTION 'Course row count changed'; END IF;

  -- the 28 rows now hold exactly the mapped values
  SELECT count(*) INTO cnt
  FROM "Course" c JOIN fee_map m USING (slug)
  WHERE c.price = m.price AND c.duration = m.duration AND c.mode = 'Classroom + Online'
    AND c.title = COALESCE(m.title, (SELECT b.title FROM coss_backup.course_fees_20261028 b WHERE b.id = c.id));
  IF cnt <> 28 THEN RAISE EXCEPTION 'the new fees did not land as expected (% of 28 rows)', cnt; END IF;

  -- rows outside the fee map changed only originalPrice (and updatedAt)
  SELECT count(*) INTO cnt
  FROM "Course" c JOIN coss_backup.course_fees_20261028 b USING (id)
  WHERE c.slug NOT IN (SELECT slug FROM fee_map)
    AND (c.price IS DISTINCT FROM b.price OR c.duration <> b.duration OR c.mode <> b.mode OR c.title <> b.title);
  IF cnt <> 0 THEN RAISE EXCEPTION '% rows outside the fee map changed more than originalPrice', cnt; END IF;
END $$;

COMMIT;

-- ── STEP 3: verify (read-only) ───────────────────────────────────────────────────────────
-- Expected: 28 rows with the new fee, duration and mode; then 0 crossed-out prices.
SELECT slug, title, price, duration, mode, "updatedAt"
FROM "Course"
WHERE slug IN ('artificial-intelligence-ai-training-hyderabad', 'artificial-intelligence-training-institute-in-hyderabad', 'aws-devops-training-institute-in-hyderabad', 'azure-devops-training-in-hyderabad', 'linux-shell-scripting-training-hyderabad', 'linux-shell-scripting-training-in-hyderabad', 'data-science-training-institute-in-hyderabad', 'data-analytics-training-institute-in-hyderabad', 'cyber-security-training-institute-in-hyderabad', 'ethical-hacking-training-institute-in-hyderabad', 'ethical-hacking-ceh-training-hyderabad', 'ceh-certification-training-in-hyderabad', 'ethical-hacking-cyber-security-professional', 'digital-marketing-training-in-hyderabad', 'digital-marketing-training-institute-in-hyderabad', 'hr-recruitment', 'hr-recruitment-training-in-hyderabad', 'hr-operations-training-in-hyderabad', 'hr-management-training-in-hyderabad', 'hr-leadership-training-in-hyderabad', 'hr-learning-development-training-in-hyderabad', 'hr-business-partner-training-in-hyderabad', 'full-stack-python-training-in-hyderabad', 'full-stack-java-training-in-hyderabad', 'full-stack-java-developer-training-in-hyderabad', 'full-stack-java-developer-bootcamp', 'multi-cloud-architecture-training-in-hyderabad', 'devops-training-institute-in-hyderabad')
ORDER BY price DESC, slug;
SELECT count(*) AS courses_with_original_price_after FROM "Course" WHERE "originalPrice" IS NOT NULL;
