-- CreateTable
-- AnnouncementBar singleton — stores the full-width bar config for the
-- public site. Only one row should exist at any time; the API uses
-- findFirst / upsert rather than a numeric primary key.
CREATE TABLE "AnnouncementBar" (
    "id"        TEXT         NOT NULL,
    "enabled"   BOOLEAN      NOT NULL DEFAULT false,
    "text"      TEXT         NOT NULL DEFAULT '🎓 New batch starting soon — Limited seats available!',
    "ctaLabel"  TEXT         NOT NULL DEFAULT 'Enroll Now',
    "ctaUrl"    TEXT         NOT NULL DEFAULT '/enroll-now-with-coss/',
    "bgColor"   TEXT         NOT NULL DEFAULT '#0f766e',
    "textColor" TEXT         NOT NULL DEFAULT '#ffffff',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementBar_pkey" PRIMARY KEY ("id")
);
