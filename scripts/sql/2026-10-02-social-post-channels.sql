-- 2026-10-02 SocialPost: Facebook + Instagram (feat/social-fb-ig). Run in the Supabase SQL Editor
-- BEFORE merging the PR (the new code selects these columns). Not run by Claude.
-- Additive only: three nullable columns, no data changes; existing LinkedIn posts are untouched.

BEGIN;

ALTER TABLE "SocialPost"
  ADD COLUMN IF NOT EXISTS "courseId" TEXT,
  ADD COLUMN IF NOT EXISTS "hook"     TEXT,
  ADD COLUMN IF NOT EXISTS "hashtags" TEXT;

COMMIT;

-- Check: expect 3 rows (courseId, hashtags, hook), all text / YES.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'SocialPost' AND column_name IN ('courseId', 'hook', 'hashtags')
ORDER BY column_name;

-- Check: existing posts unchanged (counts by status are the same as before).
SELECT status, count(*) FROM "SocialPost" GROUP BY status ORDER BY status;
