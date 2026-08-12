-- CreateTable
CREATE TABLE "WhatsAppClick" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "ctaType" TEXT NOT NULL,
    "courseSlug" TEXT,
    "branchKey" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "hadPrefill" BOOLEAN NOT NULL,
    "deviceType" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,

    CONSTRAINT "WhatsAppClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppClick_createdAt_idx" ON "WhatsAppClick"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppClick_pageType_idx" ON "WhatsAppClick"("pageType");

-- CreateIndex
CREATE INDEX "WhatsAppClick_ctaType_idx" ON "WhatsAppClick"("ctaType");

-- CreateIndex
CREATE INDEX "WhatsAppClick_courseSlug_idx" ON "WhatsAppClick"("courseSlug");

-- CreateIndex
CREATE INDEX "WhatsAppClick_branchKey_idx" ON "WhatsAppClick"("branchKey");

-- CreateIndex
CREATE INDEX "WhatsAppClick_phoneNumber_idx" ON "WhatsAppClick"("phoneNumber");
