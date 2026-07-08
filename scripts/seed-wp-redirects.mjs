/**
 * scripts/seed-wp-redirects.mjs
 *
 * Seeds all 348 old WordPress URL redirects into the Redirect table.
 * Sources are stored WITHOUT trailing slashes — trailingSlash:false in next.config.mjs
 * normalises incoming slash variants before config redirects fire.
 *
 * After running: npm run build → then verify with curl (see verification step in plan).
 *
 * Usage: node scripts/seed-wp-redirects.mjs
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ── GROUP A: Blog post redirects ─────────────────────────────────────────────
// Old WordPress posts lived at /{slug}/. New site serves them at /blog/{slug}.
const BLOG_REDIRECTS = [
  ['/digital-marketing-course-dilsukhnagar',                                                        '/blog/digital-marketing-course-dilsukhnagar'],
  ['/best-spoken-english-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                 '/blog/best-spoken-english-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/best-certification-course-institute-in-ameerpet-hyderabad-coss-cloud-solutions',               '/blog/best-certification-course-institute-in-ameerpet-hyderabad-coss-cloud-solutions'],
  ['/digital-marketing-training-in-dilsukhnagar',                                                   '/blog/digital-marketing-training-in-dilsukhnagar'],
  ['/best-communication-skills-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',           '/blog/best-communication-skills-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/cloud-computing-training-institute-in-dilsukhnagar-hyderabad',                                 '/blog/cloud-computing-training-institute-in-dilsukhnagar-hyderabad'],
  ['/data-science-training-dilsukhnagar-hyderabad',                                                 '/blog/data-science-training-dilsukhnagar-hyderabad'],
  ['/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad',                              '/blog/top-rated-digital-marketing-institute-in-dilsukhnagar-hyderabad'],
  ['/full-stack-power-bi-training-in-dilsukhnagar-hyderabad',                                       '/blog/full-stack-power-bi-training-in-dilsukhnagar-hyderabad'],
  ['/azure-data-engineer-training-in-dilsukhnagar-hyderabad',                                       '/blog/azure-data-engineer-training-in-dilsukhnagar-hyderabad'],
  ['/best-cyber-security-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                 '/blog/best-cyber-security-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/machine-learning-training-in-dilsukhnagar-hyderabad',                                          '/blog/machine-learning-training-in-dilsukhnagar-hyderabad'],
  ['/data-science-training-institute-in-dilsukhnagar-coss-cloud-solutions',                         '/blog/data-science-training-institute-in-dilsukhnagar-coss-cloud-solutions'],
  ['/best-tally-institute-in-hyderabad-coss-cloud-solutions',                                       '/blog/best-tally-institute-in-hyderabad-coss-cloud-solutions'],
  ['/digital-marketing-course-in-hyderabad',                                                        '/blog/digital-marketing-course-in-hyderabad'],
  ['/best-ethical-hacking-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                '/blog/best-ethical-hacking-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/best-java-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution',                            '/blog/best-java-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'],
  ['/learn-azure-devops-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions',                       '/blog/learn-azure-devops-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions'],
  ['/artificial-intelligence-training-in-dilsukhnagar-with-coss-cloud-solutions',                   '/blog/artificial-intelligence-training-in-dilsukhnagar-with-coss-cloud-solutions'],
  ['/best-python-institute-in-hyderabad-coss-cloud-solutions',                                      '/blog/best-python-institute-in-hyderabad-coss-cloud-solutions'],
  ['/full-stack-power-bi-training-in-hyderabad',                                                    '/blog/full-stack-power-bi-training-in-hyderabad'],
  ['/digital-marketing-course-training-dilsukhnagar-hyderabad',                                     '/blog/digital-marketing-course-training-dilsukhnagar-hyderabad'],
  ['/best-communication-skills-institute-in-hyderabad-coss-cloud-solutions',                        '/blog/best-communication-skills-institute-in-hyderabad-coss-cloud-solutions'],
  ['/learn-ms-office-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions',                            '/blog/learn-ms-office-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions'],
  ['/data-science-training-in-hyderabad',                                                           '/blog/data-science-training-in-hyderabad'],
  ['/best-python-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                         '/blog/best-python-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/best-certification-course-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',           '/blog/best-certification-course-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions',                           '/blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions'],
  ['/aws-devops-multi-cloud-course-dilsukhnagar',                                                   '/blog/aws-devops-multi-cloud-course-dilsukhnagar'],
  ['/devops-training-in-dilsukhnagar',                                                              '/blog/devops-training-in-dilsukhnagar'],
  ['/best-linux-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution',                           '/blog/best-linux-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'],
  ['/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions',             '/blog/best-certification-course-institute-in-kukatpally-hyderabad-coss-cloud-solutions'],
  ['/best-linux-training-institute-in-dilsukhnagarhyderabad',                                       '/blog/best-linux-training-institute-in-dilsukhnagarhyderabad'],
  ['/job-opportunities-for-devops-professionals-in-hyderabad',                                      '/blog/job-opportunities-for-devops-professionals-in-hyderabad'],
  ['/digital-marketing-training-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions',               '/blog/digital-marketing-training-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions'],
  ['/learn-azure-cloud-with-coss-cloud-solutions-in-hyderabad',                                     '/blog/learn-azure-cloud-with-coss-cloud-solutions-in-hyderabad'],
  ['/best-azure-devops-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution',                    '/blog/best-azure-devops-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'],
  ['/data-analytics-training-in-hyderabad',                                                         '/blog/data-analytics-training-in-hyderabad'],
  ['/best-full-stack-java-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',       '/blog/best-full-stack-java-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/learn-aws-devops-from-industry-experts-at-coss-cloud-solutions-hyderabad',                     '/blog/learn-aws-devops-from-industry-experts-at-coss-cloud-solutions-hyderabad'],
  ['/best-ms-office-institute-in-hyderabad-coss-cloud-solutions',                                   '/blog/best-ms-office-institute-in-hyderabad-coss-cloud-solutions'],
  ['/join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad',                      '/blog/join-our-industry-leading-aws-cloud-institute-in-dilsukhnagar-hyderabad'],
  ['/cloud-computing-classes-with-coss-cloud-solutions-in-hyderabad',                               '/blog/cloud-computing-classes-with-coss-cloud-solutions-in-hyderabad'],
  ['/advance-your-career-at-the-top-devops-institute-in-dilsukhnagar-coss-cloud-solutions',         '/blog/advance-your-career-at-the-top-devops-institute-in-dilsukhnagar-coss-cloud-solutions'],
  ['/cloud-computing-training-in-hyderabad-the-best-career-move-in-2025',                           '/blog/cloud-computing-training-in-hyderabad-the-best-career-move-in-2025'],
  ['/get-placed-with-coss-cloud-solutions-corporate-training-in-hyderabad',                         '/blog/get-placed-with-coss-cloud-solutions-corporate-training-in-hyderabad'],
  ['/best-google-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution',                    '/blog/best-google-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'],
  ['/best-ms-office-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                      '/blog/best-ms-office-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/devops-training-in-hyderabad-with-coss-cloud-solutions',                                       '/blog/devops-training-in-hyderabad-with-coss-cloud-solutions'],
  ['/best-ethical-hacking-institute-in-hyderabad-coss-cloud-solutions',                             '/blog/best-ethical-hacking-institute-in-hyderabad-coss-cloud-solutions'],
  ['/sap-fico-training-in-hyderabad',                                                               '/blog/sap-fico-training-in-hyderabad'],
  ['/soc-analyst-training-hyderabad',                                                               '/blog/soc-analyst-training-hyderabad'],
  ['/best-microsoft-office-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',      '/blog/best-microsoft-office-training-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/sql-mysql-postgresql-training-in-dilsukhnagar-hyderabad',                                      '/blog/sql-mysql-postgresql-training-in-dilsukhnagar-hyderabad'],
  ['/artificial-intelligence-training-in-hyderabad',                                                '/blog/artificial-intelligence-training-in-hyderabad'],
  ['/azure-devops-training-dilsukhnagar-hyderabad',                                                 '/blog/azure-devops-training-dilsukhnagar-hyderabad'],
  ['/best-azure-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution',                     '/blog/best-azure-cloud-institute-in-dilsukhnagar-hyderabad-coss-cloud-solution'],
  ['/cyber-security-training-dilsukhnagar-hyderabad',                                               '/blog/cyber-security-training-dilsukhnagar-hyderabad'],
  ['/machine-learning-training-in-hyderabad',                                                       '/blog/machine-learning-training-in-hyderabad'],
  ['/best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions',                        '/blog/best-salesforce-institute-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/digital-marketing-classes-in-hyderabad',                                                       '/blog/digital-marketing-classes-in-hyderabad'],
  ['/best-tally-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',                          '/blog/best-tally-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions',                     '/blog/digital-marketing-institute-in-kukatpally-hyderabad-coss-cloud-solutions'],
  ['/data-analytics-institute-in-dilsukhnagar-hyderabad',                                           '/blog/data-analytics-institute-in-dilsukhnagar-hyderabad'],
  ['/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions',                  '/blog/best-digital-marketing-institute-in-ameerpet-hyderabad-coss-cloud-solutions'],
  ['/best-aws-institutes-in-hyderabad-coss-cloud-solutions',                                        '/blog/best-aws-institutes-in-hyderabad-coss-cloud-solutions'],
  ['/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions-2',                         '/blog/best-digital-marketing-institute-in-hyderabad-coss-cloud-solutions-2'],
  ['/best-cyber-security-institute-in-hyderabad-coss-cloud-solutions',                              '/blog/best-cyber-security-institute-in-hyderabad-coss-cloud-solutions'],
  ['/aws-cloud-course-training-in-hyderabad-with-coss-cloud-solutions',                             '/blog/aws-cloud-course-training-in-hyderabad-with-coss-cloud-solutions'],
  ['/learn-ethical-hacking-in-hyderabad-with-coss-cloud-solutions',                                 '/blog/learn-ethical-hacking-in-hyderabad-with-coss-cloud-solutions'],
  ['/learn-aws-devops-in-hyderabad-with-coss-cloud-solutions',                                      '/blog/learn-aws-devops-in-hyderabad-with-coss-cloud-solutions'],
  ['/cloud-computing-future-in-hyderabad-with-coss-cloud-solutions',                                '/blog/cloud-computing-future-in-hyderabad-with-coss-cloud-solutions'],
  ['/grow-your-skills-with-cloud-computing-in-hyderabad-coss-cloud-solutions',                      '/blog/grow-your-skills-with-cloud-computing-in-hyderabad-coss-cloud-solutions'],
  ['/learn-digital-marketing-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions',                  '/blog/learn-digital-marketing-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions'],
  ['/learn-tally-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions',                                '/blog/learn-tally-in-dilsukhnagar-hyderabad-by-coss-cloud-solutions'],
  ['/devops-institute-in-dilsukhnagar-hyderabad',                                                   '/blog/devops-institute-in-dilsukhnagar-hyderabad'],
  ['/data-engineer-course-training-hyderabad',                                                      '/blog/data-engineer-course-training-hyderabad'],
  ['/learn-linux-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad',                              '/blog/learn-linux-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad'],
  ['/best-certification-course-institute-in-hyderabad-coss-cloud-solutions',                        '/blog/best-certification-course-institute-in-hyderabad-coss-cloud-solutions'],
  ['/best-institute-for-devops-in-hyderabad-coss-cloud-solutions',                                  '/blog/best-institute-for-devops-in-hyderabad-coss-cloud-solutions'],
  ['/best-digital-marketing-course-in-dilsukhnagar-coss-cloud-solutions',                           '/blog/best-digital-marketing-course-in-dilsukhnagar-coss-cloud-solutions'],
  ['/best-digital-marketing-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions',              '/blog/best-digital-marketing-institute-in-dilsukhnagar-hyderabad-coss-cloud-solutions'],
  ['/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad',                 '/blog/coss-cloud-solutions-best-linux-training-institute-in-dilsukhnagar-hyderabad'],
  ['/how-to-learn-aws-cloud-for-beginners',                                                         '/blog/how-to-learn-aws-cloud-for-beginners'],
  ['/aws-cloud-training-advantages-with-coss-cloud-solutions-in-hyderabad',                         '/blog/aws-cloud-training-advantages-with-coss-cloud-solutions-in-hyderabad'],
  ['/learning-tally-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad',                           '/blog/learning-tally-with-coss-cloud-solutions-in-dilsukhnagar-hyderabad'],
  ['/azure-data-engineer-training-in-hyderabad',                                                    '/blog/azure-data-engineer-training-in-hyderabad'],
]

// ── GROUP B: Location-specific training pages → canonical course SEO pages ──
const COURSE_REDIRECTS = [
  // Cloud
  ['/cloud-computing-training-institute-in-ameerpet-hyderabad',    '/courses/cloud-computing'],
  ['/cloud-computing-classes-in-hyderabad',                         '/courses/cloud-computing'],
  ['/cloud-computing-training-in-madhapur-hyderabad',               '/courses/cloud-computing'],
  ['/cloud-computing-training-institute-in-kukatpally-hyderabad',   '/courses/cloud-computing'],
  ['/cloud-computing',                                               '/courses/cloud-computing'],
  ['/cloud-technology-course-in-hyderabad',                         '/courses/cloud-computing'],
  ['/aws-cloud-training-institute-in-ameerpet-hyderabad',           '/aws-cloud-training-institute-in-hyderabad'],
  ['/aws-cloud-training-institute-in-dilsukhnagar-hyderabad',       '/aws-cloud-training-institute-in-hyderabad'],
  ['/aws-cloud-training-institute-in-madhapur-hyderabad',           '/aws-cloud-training-institute-in-hyderabad'],
  ['/aws-course-in-hyderabad',                                       '/aws-cloud-training-institute-in-hyderabad'],
  ['/aws-cloud-institute-in-hyderabad',                              '/aws-cloud-training-institute-in-hyderabad'],
  ['/azure-cloud-training-institute-in-dilsukhnagar-hyderabad',     '/azure-training-institute-in-hyderabad'],
  ['/microsoft-azure-training-in-hyderabad',                         '/azure-training-institute-in-hyderabad'],
  // DevOps
  ['/devops-training-institute-in-ameerpet-hyderabad',              '/devops-training-institute-in-hyderabad'],
  ['/devops-training-institute-in-madhapur-hyderabad',              '/devops-training-institute-in-hyderabad'],
  ['/devops-training-institute-in-dilsukhnagar-hyderabad',          '/devops-training-institute-in-hyderabad'],
  ['/devops-training-institute-in-kukatpally-hyderabad',            '/devops-training-institute-in-hyderabad'],
  ['/aws-devops-training-in-hyderabad',                              '/aws-devops-training-institute-in-hyderabad'],
  ['/master-aws-devops-in-hyderabad-with-coss-cloud-solutions',     '/aws-devops-training-institute-in-hyderabad'],
  ['/devops-with-aws-training-in-hyderabad-by-coss-cloud-solutions','/courses/devops-multi-cloud'],
  ['/azure-devops-in-hyderabad-coss-cloud-solutions',                '/azure-devops-training-institute-in-hyderabad'],
  // Linux
  ['/linux-training-institute-in-kukatpally-hyderabad',             '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-training-institute-in-ameerpet-hyderabad',               '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-training-institute-in-dilsukhnagar-hyderabad',           '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-training-institute-in-madhapur-hyderabad',               '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-administration-training-in-hyderabad',                    '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-operating-system-training-in-hyderabad-by-coss-cloud-solutions','/linux-administration-training-institute-in-hyderabad'],
  ['/linux-classes-near-me-in-hyderabad-coss-cloud-solutions',      '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-institutes-near-me-in-hyderabad-coss-cloud-solutions',   '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-course-in-hyderabad-by-coss-cloud-solutions',            '/linux-administration-training-institute-in-hyderabad'],
  ['/linux-training-in-hyderabad-by-coss-cloud-solutions',          '/linux-administration-training-institute-in-hyderabad'],
  // Python / Java / Full Stack
  ['/python-training-institute-in-dilsukhnagar-hyderabad',          '/python-training-institute-in-hyderabad'],
  ['/python-institute-in-hyderabad-by-coss-cloud-solutions',        '/python-training-institute-in-hyderabad'],
  ['/java-full-stack-developer-course-in-hyderabad-with-coss-cloud-solutions','/java-full-stack-training-institute-in-hyderabad'],
  ['/java-language-course-in-hyderabad',                             '/java-training-institute-in-hyderabad'],
  ['/java-course-near-me-in-hyderabad-coss-cloud-solutions',        '/java-training-institute-in-hyderabad'],
  ['/full-stack-developer-training-in-hyderabad',                    '/courses/programming-full-stack'],
  // Data / Analytics
  ['/best-azure-data-engineer-training-in-hyderabad',               '/azure-data-engineer-training-institute-in-hyderabad'],
  ['/data-science-training-institute-in-hyderabad',                  '/courses/data-analytics-bi'],
  ['/data-analytics-training-institute-in-hyderabad',               '/courses/data-analytics-bi'],
  ['/machine-learning-ml-training-institute-in-hyderabad',          '/machine-learning-training-institute-in-hyderabad'],
  // Digital Marketing
  ['/digital-marketing-institute-in-dilsukhnagar-hyderabad',        '/digital-marketing-training-institute-in-hyderabad'],
  ['/digital-marketing-classes-in-hyderabad-by-coss-cloud-solutions','/digital-marketing-training-institute-in-hyderabad'],
  ['/digital-marketing-course-near-me-in-hyderabad',                '/digital-marketing-training-institute-in-hyderabad'],
  ['/register-digital-marketing-classes-in-hyderabad-with-coss-cloud-solutions','/digital-marketing-training-institute-in-hyderabad'],
  ['/digital-marketing-coaching-centre-near-me-in-hyderabad',       '/digital-marketing-training-institute-in-hyderabad'],
  ['/enroll-for-digital-marketing-course-in-hyderabad-with-coss-cloud-solutions','/digital-marketing-training-institute-in-hyderabad'],
  // Tally / ERP
  ['/tally-training-institute-in-dilsukhnagar-hyderabad',           '/tally-erp-training-institute-in-hyderabad'],
  ['/tally-courses-in-hyderabad-by-coss-cloud-solutions',           '/tally-erp-training-institute-in-hyderabad'],
  ['/tally-courses-in-hyderabad-with-coss-cloud-solutions',         '/tally-erp-training-institute-in-hyderabad'],
  ['/tally-classes-near-me-in-hyderabad-by-coss-cloud-solutions',   '/tally-erp-training-institute-in-hyderabad'],
  // MS Office
  ['/ms-office-training-institute-in-dilsukhnagar-hyderabad',       '/ms-office-training-institute-in-hyderabad'],
  // Misc courses
  ['/ms-office-course-near-me-in-hyderabad-coss-cloud-solutions',   '/ms-office-training-institute-in-hyderabad'],
  ['/certification-in-hyderabad',                                    '/certification'],
  ['/sql-training-in-hyderabad',                                     '/sql-training-institute-in-hyderabad'],
  ['/learn-spoken-english-in-hyderabad-with-coss-cloud-solution',   '/spoken-english-training-institute-in-hyderabad'],
  ['/computer-classes-near-me-in-hyderabad-coss-cloud-solutions',   '/courses'],
  ['/computer-training-near-me-in-hyderabad-coss-cloud-solutions',  '/courses'],
  ['/computer-institutes-near-me-in-hyderabad-coss-cloud-solutions','/courses'],
  ['/it-training-institute-dilsukhnagar',                            '/courses'],
]

// ── GROUP C: Chain-breakers ──────────────────────────────────────────────────
// These paths have existing redirect page files. Adding them to DB makes the
// config-level redirect fire first, collapsing the 2-hop chain to 1 hop.
const CHAIN_BREAKERS = [
  ['/communication-skills-training-in-hyderabad-coss-cloud-solutions', '/communication-skills-training-in-hyderabad'],
  ['/spoken-english-institute-in-hyderabad-coss-cloud-solutions',      '/spoken-english-training-institute-in-hyderabad'],
  ['/ethical-hacking-in-hyderabad-coss-cloud-solutions',               '/ethical-hacking-training-institute-in-hyderabad'],
  ['/redhat-linux-certification-course-in-hyderabad',                  '/linux-administration-training-institute-in-hyderabad'],
  ['/full-stack-power-bi-training-institute-in-hyderabad',             '/power-bi-training-institute-in-hyderabad'],
  ['/sap-fico-training-institute-in-hyderabad',                        '/courses/erp-crm-enterprise-tools/sap-fico-training-institute-in-hyderabad'],
  ['/aws-devops-in-hyderabad',                                          '/aws-devops-training-institute-in-hyderabad'],
  ['/artificial-intelligence-ai-training-institute-in-hyderabad',      '/artificial-intelligence-training-institute-in-hyderabad'],
  ['/azure-devops-courses-in-hyderabad-by-coss-cloud-solutions',       '/azure-devops-training-institute-in-hyderabad'],
  ['/aws-devops-course-in-hyderabad-by-coss-cloud-solutions',          '/aws-devops-training-institute-in-hyderabad'],
  ['/aws-cloud-training-in-hyderabad',                                  '/aws-cloud-training-institute-in-hyderabad'],
  ['/digital-marketing-training-institute-in-dilsukhnagar-hyderabad',  '/digital-marketing-training-institute-in-hyderabad'],
  ['/ccna-networking-training-in-hyderabad',                            '/ccna-training-institute-in-hyderabad'],
  ['/sql-mysql-postgresql-training-in-hyderabad',                       '/sql-training-institute-in-hyderabad'],
  ['/tally-classes-in-hyderabad',                                       '/tally-erp-training-institute-in-hyderabad'],
  ['/ui-ux-design-training-in-hyderabad',                               '/ui-ux-design-training-institute-in-hyderabad'],
  ['/linux-training-in-hyderabad',                                      '/linux-administration-training-institute-in-hyderabad'],
  ['/devops-training-in-hyderabad',                                     '/devops-training-institute-in-hyderabad'],
  ['/digital-marketing-course-in-hyderabad-by-coss-cloud-solutions',   '/digital-marketing-training-institute-in-hyderabad'],
  ['/oracle-fusion-cloud-hcm-training-in-hyderabad',                   '/oracle-fusion-hcm-training-institute-in-hyderabad'],
  ['/salesforce-training-center-in-hyderabad',                         '/salesforce-training-institute-in-hyderabad'],
  ['/big-data-training-in-hyderabad',                                   '/big-data-training-institute-in-hyderabad'],
]

// ── GROUP D: WP structural pages with no equivalent ─────────────────────────
const STRUCTURAL_REDIRECTS = [
  ['/branches',                    '/contact-us'],
  ['/gallery',                     '/about-us'],
  ['/our-team',                    '/about-us'],
  ['/results',                     '/student-reviews'],
  ['/downloads',                   '/'],
  ['/app',                         '/'],
  ['/1-home',                      '/'],
  ['/book-a-free-demo-class',      '/free-demo-class'],
  ['/sap-fico-training-institute-in-hyderabad-coss-cloud-solutions', '/courses/erp-crm-enterprise-tools/sap-fico-training-institute-in-hyderabad'],
  ['/data-analytics-bi',           '/courses/data-analytics-bi'],
]

// ── GROUP E: Nested WP location/hub paths not covered by patterns ────────────
// (Patterns /training-institutes-in-hyderabad/:path* etc. are in next.config.mjs;
//  these are specific paths that also need exact DB entries for admin visibility.)
const LOCATION_HUB_REDIRECTS = [
  ['/training-institutes-in-hyderabad/dilsukhnagar',                                              '/courses'],
  ['/training-institutes-in-hyderabad/kukatpally',                                                '/courses'],
  ['/training-institutes-in-hyderabad/madhapur',                                                  '/courses'],
  ['/training-institutes-in-hyderabad/dilsukhnagar/devops-training-dilsukhnagar-hyderabad',       '/devops-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/ameerpet/linux-training-ameerpet-hyderabad',                '/linux-administration-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/ameerpet/cloud-computing-training-ameerpet-hyderabad',      '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/ameerpet/devops-training-ameerpet-hyderabad',               '/devops-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/ameerpet/aws-cloud-training-ameerpet-hyderabad',            '/aws-cloud-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/dilsukhnagar/cloud-computing-training-dilsukhnagar-hyderabad','/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/madhapur/cloud-computing-training-madhapur-hyderabad',      '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/madhapur/aws-cloud-training-madhapur-hyderabad',            '/aws-cloud-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/madhapur/devops-training-madhapur-hyderabad',               '/devops-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/kukatpally/linux-training-kukatpally-hyderabad',            '/linux-administration-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/kukatpally/cloud-computing-training-kukatpally-hyderabad',  '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/dilsukhnagar/linux-training-dilsukhnagar-hyderabad',        '/linux-administration-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/dilsukhnagar/aws-cloud-training-dilsukhnagar-hyderabad',    '/aws-cloud-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/dilsukhnagar/azure-cloud-training-dilsukhnagar-hyderabad',  '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/madhapur/azure-cloud-training-madhapur-hyderabad',          '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/kukatpally/azure-cloud-training-kukatpally-hyderabad',      '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/ameerpet/azure-cloud-training-ameerpet-hyderabad',          '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/aws-training-institute-in-hyderabad',                       '/aws-cloud-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/devops-training-in-hyderabad',                              '/devops-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/linux-training-institute-in-hyderabad',                     '/linux-administration-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/linux-training-in-hyderabad',                               '/linux-administration-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/cloud-computing-training-in-hyderabad',                     '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/cloud-computing-institute-in-hyderabad',                    '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/cloud-computing-training-institute-in-hyderabad',           '/courses/cloud-computing'],
  ['/training-institutes-in-hyderabad/azure-training-institute-in-hyderabad',                     '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/azure-cloud-training-in-hyderabad',                         '/azure-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/kukatpally/devops-training-kukatpally-hyderabad',           '/devops-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/kukatpally/aws-cloud-training-kukatpally-hyderabad',        '/aws-cloud-training-institute-in-hyderabad'],
  ['/training-institutes-in-hyderabad/ameerpet',                                                   '/courses'],
  ['/coaching-centres-in-hyderabad/cloud-computing-coaching-in-hyderabad',                        '/courses/cloud-computing'],
  ['/coaching-centres-in-hyderabad/azure-cloud-coaching-in-hyderabad',                            '/azure-training-institute-in-hyderabad'],
  ['/coaching-centres-in-hyderabad/devops-coaching-in-hyderabad',                                 '/devops-training-institute-in-hyderabad'],
  ['/coaching-centres-in-hyderabad/aws-cloud-coaching-in-hyderabad',                              '/aws-cloud-training-institute-in-hyderabad'],
  ['/coaching-centres-in-hyderabad/linux-coaching-in-hyderabad',                                  '/linux-administration-training-institute-in-hyderabad'],
  ['/branches/java-training-institute-in-dilsukhnagar-hyderabad',                                 '/java-training-institute-in-hyderabad'],
  ['/sql/mysql/postgresql-training-in-hyderabad',                                                  '/sql-training-institute-in-hyderabad'],
  ['/sql/mysql/postgresql-training-institute-in-hyderabad',                                        '/sql-training-institute-in-hyderabad'],
]

const ALL_REDIRECTS = [
  ...BLOG_REDIRECTS,
  ...COURSE_REDIRECTS,
  ...CHAIN_BREAKERS,
  ...STRUCTURAL_REDIRECTS,
  ...LOCATION_HUB_REDIRECTS,
]

async function main() {
  const seen = new Set()
  let created = 0
  let skipped = 0
  let dupeInScript = 0

  for (const [source, destination] of ALL_REDIRECTS) {
    if (seen.has(source)) {
      console.log(`  DUPE  ${source} (appears twice in script — keeping first)`)
      dupeInScript++
      continue
    }
    seen.add(source)

    const existing = await db.redirect.findUnique({ where: { source } })
    if (existing) {
      if (existing.destination !== destination) {
        console.log(`  SKIP  ${source} → already → ${existing.destination} (wanted ${destination})`)
      } else {
        console.log(`  skip  ${source} (already correct)`)
      }
      skipped++
    } else {
      await db.redirect.create({
        data: { source, destination, statusCode: 301, isActive: true },
      })
      console.log(`  create ${source} → ${destination}`)
      created++
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Script dupes: ${dupeInScript}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
