-- Manual migration (applied by hand via Supabase SQL Editor — see CLAUDE.md).
-- Data only, no schema change. Course, category, blog and the other content
-- admin pages now need the 'content:view' permission. Login copies each
-- user's stored AdminUser.permissions into the session, so the new role
-- presets in src/lib/permissions.ts do not reach existing users. This grants
-- 'content:view' to existing Admissions & Sales and Support / Helpdesk users
-- so they keep the course/blog page access they have today.
-- Idempotent: users who already have the key are skipped.
-- Signed-in users pick up the change at their next login.

-- Preview (run first; lists the rows the UPDATE will change)
SELECT id, email, role, permissions
FROM "AdminUser"
WHERE role IN ('ADMISSIONS_SALES', 'SUPPORT_HELPDESK')
  AND NOT ('content:view' = ANY (permissions));

-- Grant
UPDATE "AdminUser"
SET permissions = array_append(permissions, 'content:view'),
    "updatedAt" = now()
WHERE role IN ('ADMISSIONS_SALES', 'SUPPORT_HELPDESK')
  AND NOT ('content:view' = ANY (permissions));


-- ============================================================
-- ROLLBACK — run this to undo the above. Not run automatically.
-- Also removes 'content:view' from any of these users who had it
-- granted by hand before this file was run.
-- ============================================================

UPDATE "AdminUser"
SET permissions = array_remove(permissions, 'content:view'),
    "updatedAt" = now()
WHERE role IN ('ADMISSIONS_SALES', 'SUPPORT_HELPDESK')
  AND 'content:view' = ANY (permissions);
