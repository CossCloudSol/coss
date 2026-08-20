ALTER TABLE "Lead"
  ADD COLUMN "utmSource"   TEXT,
  ADD COLUMN "utmMedium"   TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "referrer"    TEXT,
  ADD COLUMN "landingPage" TEXT,
  ADD COLUMN "submitPath"  TEXT,
  ADD COLUMN "deviceType"  TEXT;

CREATE INDEX "Lead_formType_idx" ON "Lead"("formType");
CREATE INDEX "Lead_utmSource_idx" ON "Lead"("utmSource");
