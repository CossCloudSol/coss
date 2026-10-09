-- 2026-10-10 READ-ONLY check that item 5 is saving attribution and consent on real leads.
-- Run in the Supabase SQL Editor (production) after a few real enquiries have come in since the
-- item 5 release (10 Oct). It only reads; nothing changes. Not run by Claude.
-- No names, phone numbers or emails are shown: only flags and campaign values.
--
-- What to look for, one row per lead (newest first, last 25 leads + last 10 corporate leads):
--   consent_set      should be true on every lead created after the release
--   whatsapp_optin   true only where the visitor ticked the box; then optin_time_set is true too
--   utm_source / gclid_set / last_touch_set   filled when the visitor came from a campaign or
--                    another site (direct visits can be empty: that is expected)

SELECT 'lead' AS kind, l."createdAt", l."formType",
       l."consentAt" IS NOT NULL AS consent_set,
       l."whatsappOptIn" AS whatsapp_optin,
       l."whatsappOptInAt" IS NOT NULL AS optin_time_set,
       l."utmSource" AS utm_source, l."utmTerm" AS utm_term,
       l."gclid" IS NOT NULL AS gclid_set, l."fbclid" IS NOT NULL AS fbclid_set,
       l."lastUtmSource" AS last_utm_source, l."lastTouchAt" IS NOT NULL AS last_touch_set,
       l."landingPage" AS landing_page
FROM (SELECT * FROM "Lead" ORDER BY "createdAt" DESC LIMIT 25) l
UNION ALL
SELECT 'corporate', c."createdAt", 'corporate',
       c."consentAt" IS NOT NULL, NULL, NULL,
       c."utmSource", c."utmTerm",
       c."gclid" IS NOT NULL, c."fbclid" IS NOT NULL,
       NULL, NULL, c."landingPage"
FROM (SELECT * FROM "CorporateLead" ORDER BY "createdAt" DESC LIMIT 10) c
ORDER BY 1 DESC, 2 DESC;
