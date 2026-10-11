-- 2026-10-11  ROLLBACK for 2026-10-11-alias-redirects.sql. Run once, in full, in the Supabase SQL Editor.
-- Not run by Claude. Restores the 10 "Redirect" rows from coss_backup.redirect_alias_20261011.
-- Expected: UPDATE 10, then the check returns 10 rows with restored = true. Any other count raises
-- and nothing is committed. Only "destination" is restored (and "updatedAt" set to now()).
-- If the backup table is missing the forward script was never run: nothing to roll back.

BEGIN;

UPDATE "Redirect" AS r
SET destination = b.destination,
    "updatedAt" = now()
FROM coss_backup.redirect_alias_20261011 AS b
WHERE r.id = b.id
RETURNING r.source, r.destination AS restored_destination;
-- Expected: UPDATE 10

DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM "Redirect" r
  JOIN coss_backup.redirect_alias_20261011 b ON b.id = r.id
  WHERE r.destination = b.destination;
  IF n <> 10 THEN
    RAISE EXCEPTION 'expected 10 restored rows, got %. Nothing was committed.', n;
  END IF;
END $$;

SELECT r.source, r.destination, (r.destination = b.destination) AS restored
FROM "Redirect" r
JOIN coss_backup.redirect_alias_20261011 b ON b.id = r.id
ORDER BY r.source;

COMMIT;
