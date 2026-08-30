ALTER TABLE "Lead" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "Lead" ADD COLUMN "jobCompany" TEXT;
ALTER TABLE "Lead" ADD COLUMN "consentAt" TIMESTAMP(3);

CREATE INDEX "Lead_jobId_idx" ON "Lead"("jobId");
