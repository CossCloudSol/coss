-- 2026-10-25 ROLLBACK for 2026-10-25-pageseo-organic-titles.sql. Run in the Supabase SQL Editor
-- only if that change has to be undone. Not run by Claude. This file creates no tables.
--
-- What it does: puts "metaTitle", "metaDescription" and "updatedAt" of the five PageSeo rows
-- (courses, about, student-reviews, contact, and the Linux Dilsukhnagar blog post) back to the
-- values saved in coss_backup.pageseo_organic_titles_20261025 (joined on id). Nothing else
-- changes. The backup table is kept. One transaction; it stops (nothing changed) unless the backup
-- holds exactly 5 rows, all 5 rows still hold the text the change file set (so a later admin edit
-- is never overwritten silently), and exactly 5 rows are restored.
-- Afterwards revalidate the five pages (Admin → SEO → open the page → Save), or the old text
-- shows only after the next deploy.
--
-- If you see ERROR: nothing changed; paste the error to Claude Code.
-- If you see Success (the last result shows all 5 rows back to their old text): tell Claude Code
-- 'rollback ran'.

BEGIN;
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM coss_backup.pageseo_organic_titles_20261025;
  IF cnt <> 5 THEN RAISE EXCEPTION 'backup holds % rows, expected 5; nothing changed', cnt; END IF;

  -- each row still holds exactly the (slug, title, description) the change file set
  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_organic_titles_20261025 b USING (id)
  WHERE (p."pageSlug", p."metaTitle", p."metaDescription") IN (
          ('courses',
           'IT Courses in Hyderabad: AI, Cloud & DevOps – Free Demo',
           'Coss Cloud Solutions IT courses in Hyderabad: AI, AWS, Azure, DevOps, Data Science, Cyber Security and Full Stack, classroom or online. Book a free demo.'),
          ('about',
           'About Us – IT Training Institute in Hyderabad Since 2010',
           'IT training in Hyderabad since 2010: 5,000+ students trained, 50+ hiring partners, branches in Dilsukhnagar and Ameerpet. Book a free demo class with Coss.'),
          ('student-reviews',
           'Student Reviews – IT Training Institute in Hyderabad',
           'Read Coss Cloud Solutions student reviews on Google for our Dilsukhnagar and Ameerpet branches, Hyderabad. 5,000+ students trained since 2010.'),
          ('contact',
           'Contact Us – Dilsukhnagar & Ameerpet Branches, Hyderabad',
           'Contact Coss Cloud Solutions in Dilsukhnagar or Ameerpet, Hyderabad: call or WhatsApp +91 88851 66007, get directions, or book a free demo class.'),
          ('blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad',
           'Linux Training in Dilsukhnagar, Hyderabad – Free Demo Class',
           'Linux training in Dilsukhnagar, Hyderabad: file management, permissions, shell scripting, networking and server management. 5,000+ students trained.'));
  IF cnt <> 5 THEN RAISE EXCEPTION 'the rows were edited after the change (% of 5 still hold its text); nothing changed', cnt; END IF;

  UPDATE "PageSeo" p SET
    "metaTitle" = b."metaTitle",
    "metaDescription" = b."metaDescription",
    "updatedAt" = b."updatedAt"
  FROM coss_backup.pageseo_organic_titles_20261025 b
  WHERE p.id = b.id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  IF cnt <> 5 THEN RAISE EXCEPTION 'expected 5 rows restored, got %', cnt; END IF;

  SELECT count(*) INTO cnt
  FROM "PageSeo" p JOIN coss_backup.pageseo_organic_titles_20261025 b ON b.id = p.id
  WHERE p."pageSlug" = b."pageSlug"
    AND p."metaTitle" IS NOT DISTINCT FROM b."metaTitle"
    AND p."metaDescription" IS NOT DISTINCT FROM b."metaDescription"
    AND p."updatedAt" IS NOT DISTINCT FROM b."updatedAt";
  IF cnt <> 5 THEN RAISE EXCEPTION 'restore check failed (% of 5 rows match the backup)', cnt; END IF;
END $$;

COMMIT;

SELECT p."pageSlug", p."metaTitle", p."metaDescription", p."updatedAt"
FROM "PageSeo" p JOIN coss_backup.pageseo_organic_titles_20261025 b ON b.id = p.id
ORDER BY p."pageSlug";
