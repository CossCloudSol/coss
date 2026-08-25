ALTER TABLE "HomepageSettings" ALTER COLUMN "stat4Value" SET DEFAULT '50+';

UPDATE "HomepageSettings" SET "stat4Value" = '50+' WHERE id = 'main' AND "stat4Value" = '200+';
