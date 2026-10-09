-- 2026-10-09 Turn on Row Level Security for the two backup tables left by the 9 Oct run of
-- 2026-10-09-blog-claims.sql (that run committed its changes; the editor's own RLS lines, added
-- after the script's COMMIT, then failed on a temp table). Run ONLY if the status check
-- (2026-10-09-blog-claims-status.sql) showed both backup tables with exists = true, rls = false.
-- Not run by Claude.
--
-- What it changes: RLS on for coss_backup.blogpost_claims_20261009 and
-- coss_backup.pageseo_claims_20261009. No data changes. One transaction; it stops (nothing
-- changed) unless both tables exist with 5 and 1 rows. Safe to run twice.
-- If the editor asks about Row Level Security, click "Run without RLS".
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success: tell Claude Code 'RLS on'.

BEGIN;

DO $$
BEGIN
  IF to_regclass('coss_backup.blogpost_claims_20261009') IS NULL OR to_regclass('coss_backup.pageseo_claims_20261009') IS NULL THEN
    RAISE EXCEPTION 'a backup table is missing; paste this error to Claude Code';
  END IF;
  IF (SELECT count(*) FROM coss_backup.blogpost_claims_20261009) <> 5 OR (SELECT count(*) FROM coss_backup.pageseo_claims_20261009) <> 1 THEN
    RAISE EXCEPTION 'unexpected backup row counts; paste this error to Claude Code';
  END IF;
END $$;

ALTER TABLE coss_backup.blogpost_claims_20261009 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coss_backup.pageseo_claims_20261009 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'coss_backup' AND c.relname IN ('blogpost_claims_20261009', 'pageseo_claims_20261009')
        AND c.relrowsecurity) <> 2 THEN
    RAISE EXCEPTION 'RLS not on for both backup tables';
  END IF;
END $$;

COMMIT;
