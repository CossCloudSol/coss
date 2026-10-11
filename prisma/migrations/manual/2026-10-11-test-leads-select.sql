-- 2026-10-11  READ-ONLY. Find the two test leads made during the pipeline check, so they can be
-- confirmed (and, only if Subodh decides, closed or deleted later in a separate guarded file).
-- Run in the Supabase SQL Editor. Changes nothing. Not run by Claude.
--
-- Expect: 1 row from the first query ("TEST Subodh - ignore", utm_campaign = pipeline-check) and
-- 1 row from the second (the corporate test lead). More than 1 row means look before doing anything.

-- 1) Consumer lead
SELECT id, name, phone, email, course, branch, "formType", status,
       "utmSource", "utmMedium", "utmCampaign", "landingPage", "submitPath",
       "consentAt", "whatsappOptIn", "createdAt"
FROM "Lead"
WHERE "utmCampaign" = 'pipeline-check'
   OR name ILIKE 'TEST Subodh%'
ORDER BY "createdAt" DESC;

-- 2) Corporate lead
SELECT id, "companyName", "contactPerson", phone, email, "trainingDomain", "employeeCount",
       status, "utmSource", "utmMedium", "utmCampaign", "landingPage", "consentAt", "createdAt"
FROM "CorporateLead"
WHERE "utmCampaign" = 'pipeline-check'
   OR "companyName" ILIKE '%test%'
   OR "contactPerson" ILIKE 'TEST Subodh%'
ORDER BY "createdAt" DESC;
