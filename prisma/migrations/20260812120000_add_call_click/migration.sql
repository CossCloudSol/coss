-- CreateTable
CREATE TABLE "CallClick" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "courseSlug" TEXT,
    "branchKey" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,

    CONSTRAINT "CallClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallClick_createdAt_idx" ON "CallClick"("createdAt");

-- CreateIndex
CREATE INDEX "CallClick_pageType_idx" ON "CallClick"("pageType");

-- CreateIndex
CREATE INDEX "CallClick_courseSlug_idx" ON "CallClick"("courseSlug");

-- CreateIndex
CREATE INDEX "CallClick_branchKey_idx" ON "CallClick"("branchKey");

-- CreateIndex
CREATE INDEX "CallClick_phoneNumber_idx" ON "CallClick"("phoneNumber");
