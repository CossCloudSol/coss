-- 2026-10-28 ROLLBACK for 2026-10-28-course-fees.sql. Run in the Supabase SQL Editor only if
-- that change has to be undone. Not run by Claude. This file creates no tables.
-- What it does: puts title, price, "originalPrice", duration, mode and "updatedAt" of every row in
-- coss_backup.course_fees_20261028 back to the saved values (joined on id). The backup table is
-- kept. One transaction; it stops (nothing changed) unless the backup exists and every backed-up
-- row still exists. Note: this brings the crossed-out prices back into the database; the code in
-- feat/course-fees still does not show them.
-- If you see ERROR: nothing changed; paste the error to Claude.

BEGIN;
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  backed int;
  cnt int;
BEGIN
  SELECT count(*) INTO backed FROM coss_backup.course_fees_20261028;
  IF backed < 28 THEN RAISE EXCEPTION 'backup holds % rows, expected at least 28; nothing changed', backed; END IF;

  UPDATE "Course" c SET
    title = b.title, price = b.price, "originalPrice" = b."originalPrice",
    duration = b.duration, mode = b.mode, "updatedAt" = b."updatedAt"
  FROM coss_backup.course_fees_20261028 b
  WHERE c.id = b.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> backed THEN RAISE EXCEPTION 'restored % of % rows; nothing changed', cnt, backed; END IF;
END $$;

COMMIT;

SELECT c.slug, c.title, c.price, c."originalPrice", c.duration, c.mode
FROM "Course" c JOIN coss_backup.course_fees_20261028 b USING (id)
ORDER BY c.slug;
