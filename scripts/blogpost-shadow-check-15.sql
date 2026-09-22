-- Read-only shadow check for the 15 content/posts/*.mdx files with real
-- claim violations being fixed in this pass. If any of these slugs has a
-- 'published' row in BlogPost, that DB row is what's actually live at
-- /blog/[slug] and needs its own follow-up fix -- the MDX edit alone is
-- not sufficient for that slug.
--
-- Run manually in the Supabase SQL Editor. Read-only (SELECT only).

SELECT id, slug, title, status, content, "updatedAt"
FROM "BlogPost"
WHERE slug IN (
  'data-science-training-institute-in-dilsukhnagar-coss-cloud-solutions',
  'digital-marketing-course-in-hyderabad',
  'grow-your-skills-with-cloud-computing-in-hyderabad-coss-cloud-solutions',
  'join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad',
  'soc-analyst-training-hyderabad',
  'best-cyber-security-institute-in-hyderabad-coss-cloud-solutions',
  'best-ethical-hacking-institute-in-hyderabad-coss-cloud-solutions',
  'best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions',
  'best-tally-institute-in-hyderabad-coss-cloud-solutions',
  'best-linux-training-institute-in-dilsukhnagarhyderabad',
  'coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad',
  'best-digital-marketing-course-in-dilsukhnagar-coss-cloud-solutions',
  'best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions-2',
  'best-ethical-hacking-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',
  'artificial-intelligence-training-in-dilsukhnagar-with-coss-cloud-solutions'
)
ORDER BY slug;
