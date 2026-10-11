-- 2026-10-17  NOT TO BE RUN BEFORE 17 OCT 2026. Removes the one-off backup schema "coss_backup".
-- Run in the Supabase SQL Editor, block 1 first (read-only), block 2 only if block 1 looks as expected
-- and no rollback from any earlier change was needed (the backups are what a rollback restores from).
--
-- There is no -rollback file: a dropped schema cannot be re-created by script. If it is ever needed again,
-- restore from a Supabase point-in-time backup. Nothing outside coss_backup is touched by block 2 (block 1
-- lists anything outside it that would depend on it, which must be none).

/* ───────── BLOCK 1: PREVIEW (read-only) ─────────
   Expect: one row per backup table, kind = 'table', with its row count, and NO row with kind = 'DEPENDENT_OUTSIDE'. */
SELECT 'table' AS kind,
       t.table_name::text AS name,
       (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text AS value
FROM information_schema.tables t
WHERE t.table_schema = 'coss_backup'
UNION ALL
SELECT 'DEPENDENT_OUTSIDE',
       dn.nspname || '.' || dep.relname,
       'depends on coss_backup.' || src.relname
FROM pg_depend d
JOIN pg_rewrite r        ON r.oid = d.objid
JOIN pg_class dep        ON dep.oid = r.ev_class
JOIN pg_namespace dn     ON dn.oid = dep.relnamespace
JOIN pg_class src        ON src.oid = d.refobjid
JOIN pg_namespace sn     ON sn.oid = src.relnamespace
WHERE sn.nspname = 'coss_backup' AND dn.nspname <> 'coss_backup'
ORDER BY 1, 2;

/* ───────── BLOCK 2: DROP (run only after block 1) ─────────
   Expect the single result row: schemas_left = 0. An error rolls everything back; nothing is dropped. */
BEGIN;

DO $$
DECLARE
  outside int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'coss_backup') THEN
    RAISE EXCEPTION 'coss_backup does not exist: nothing to drop';
  END IF;
  SELECT count(*) INTO outside
  FROM pg_depend d
  JOIN pg_rewrite r    ON r.oid = d.objid
  JOIN pg_class dep    ON dep.oid = r.ev_class
  JOIN pg_namespace dn ON dn.oid = dep.relnamespace
  JOIN pg_class src    ON src.oid = d.refobjid
  JOIN pg_namespace sn ON sn.oid = src.relnamespace
  WHERE sn.nspname = 'coss_backup' AND dn.nspname <> 'coss_backup';
  IF outside <> 0 THEN
    RAISE EXCEPTION 'something outside coss_backup depends on it (% object(s)); CASCADE would drop it', outside;
  END IF;
END $$;

DROP SCHEMA coss_backup CASCADE;

COMMIT;

SELECT count(*) AS schemas_left FROM information_schema.schemata WHERE schema_name = 'coss_backup';
