-- 2026-10-11  READ-ONLY. How many rows reference each retired duplicate ("alias") course.
-- Run in the Supabase SQL Editor. Changes nothing. Used to decide whether an alias row can ever be
-- unpublished or merged (it must not be while anything still points at it).
--
-- Columns: course.id/slug/status, then one count per referencing table:
--   batches_total / batches_upcoming : "Batch"."courseId" (the only real foreign key)
--   social_posts                     : "SocialPost"."courseId" (no FK: a deleted course would orphan these)
--   leads_by_title / leads_brochure  : "Lead"."course" holds the course NAME typed or chosen in a form;
--                                      leads_brochure counts the formType = 'brochure_request' ones
--   call_clicks / whatsapp_clicks / testimonials : the "courseSlug" column of each table

WITH alias(slug) AS (
  VALUES
    ('hr-recruitment'),
    ('linux-shell-scripting-training-hyderabad'),
    ('digital-marketing-training-institute-in-hyderabad'),
    ('artificial-intelligence-training-institute-in-hyderabad'),
    ('ethical-hacking-ceh-training-hyderabad'),
    ('ceh-certification-training-in-hyderabad'),
    ('interview-prep-resume-building-training-in-hyderabad'),
    ('leadership-management-training-in-hyderabad'),
    ('full-stack-java-developer-bootcamp'),
    ('full-stack-java-training-in-hyderabad'),
    ('aws-cloud-practitioner-training-in-hyderabad')
)
SELECT c.slug,
       c.id,
       c.status,
       c.title,
       (SELECT count(*) FROM "Batch" b WHERE b."courseId" = c.id)                                           AS batches_total,
       (SELECT count(*) FROM "Batch" b WHERE b."courseId" = c.id AND b.status IN ('upcoming','ongoing'))    AS batches_upcoming,
       (SELECT count(*) FROM "SocialPost" s WHERE s."courseId" = c.id)                                      AS social_posts,
       (SELECT count(*) FROM "Lead" l WHERE l.course = c.title)                                             AS leads_by_title,
       (SELECT count(*) FROM "Lead" l WHERE l.course = c.title AND l."formType" = 'brochure_request')       AS leads_brochure,
       (SELECT count(*) FROM "CallClick" k WHERE k."courseSlug" = c.slug)                                   AS call_clicks,
       (SELECT count(*) FROM "WhatsAppClick" w WHERE w."courseSlug" = c.slug)                               AS whatsapp_clicks,
       (SELECT count(*) FROM "Testimonial" t WHERE t."courseSlug" = c.slug)                                 AS testimonials
FROM "Course" c
JOIN alias a ON a.slug = c.slug
ORDER BY c.slug;

-- NOTE: leads_by_title is exact-match on the title. Two courses can share a title (the alias and the
-- course it points to), so a lead counted here may belong to either; treat it as an upper bound.
