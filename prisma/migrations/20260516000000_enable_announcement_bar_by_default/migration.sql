-- Change the column default from false → true so new rows are enabled.
ALTER TABLE "AnnouncementBar" ALTER COLUMN "enabled" SET DEFAULT true;

-- Enable any existing row that still has the old false default.
-- This only affects rows where enabled has never been deliberately set to true.
UPDATE "AnnouncementBar" SET "enabled" = true WHERE "enabled" = false;
