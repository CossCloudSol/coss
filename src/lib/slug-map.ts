// Flat-legacy landing page slug → the DB course slug it renders. Dependency-free (no
// Prisma), so link and canonical helpers can use it anywhere; get-landing-page-data
// re-exports it. Tested in scripts/test/flat-url.test.mjs.
// Explicit map: landing page URL slug → DB course slug
export const SLUG_MAP: Record<string, string> = {
      // Already matched — keep working
      'artificial-intelligence-training-institute-in-hyderabad': 'artificial-intelligence-ai-training-hyderabad',
      'azure-devops-training-institute-in-hyderabad':           'azure-devops-training-in-hyderabad',
      'cyber-security-training-institute-in-hyderabad':         'cyber-security-training-institute-in-hyderabad',
      'devops-training-institute-in-hyderabad':                 'devops-training-institute-in-hyderabad',
      'digital-marketing-training-institute-in-hyderabad':      'digital-marketing-training-in-hyderabad',
      'ethical-hacking-training-institute-in-hyderabad':        'ethical-hacking-training-institute-in-hyderabad',
      'machine-learning-training-institute-in-hyderabad':       'machine-learning-training-institute-in-hyderabad',
      'power-bi-training-institute-in-hyderabad':               'power-bi-training-in-hyderabad',
      'software-testing-training-institute-in-hyderabad':       'software-testing-training-institute-in-hyderabad',
      'ui-ux-design-training-institute-in-hyderabad':           'ui-ux-design-training-institute-in-hyderabad',

      // Newly mapped — 16 slugs fixed
      'aws-training-institute-in-hyderabad':                    'aws-solutions-architect-training-in-hyderabad',
      'aws-devops-training-institute-in-hyderabad':             'aws-devops-training-institute-in-hyderabad', // 2026-10-05: the AWS DevOps record (was Kubernetes & Docker)
      'azure-training-institute-in-hyderabad':                  'azure-administrator-training-in-hyderabad',
      'big-data-training-institute-in-hyderabad':               'apache-spark-training-in-hyderabad',
      'communication-skills-training-in-hyderabad':             'business-communication-english-training-in-hyderabad',
      'data-engineering-training-institute-in-hyderabad':       'data-engineering-python-training-in-hyderabad',
      'google-cloud-training-institute-in-hyderabad':           'google-cloud-engineer-training-in-hyderabad',
      'java-training-institute-in-hyderabad':                   'full-stack-java-developer-training-in-hyderabad',
      'python-training-institute-in-hyderabad':                 'python-programming-training-in-hyderabad',
      'sql-training-institute-in-hyderabad':                    'sql-data-analytics-training-hyderabad',

      // Real slugs — seeded 2026-06-25
      'ms-office-training-institute-in-hyderabad':              'ms-office-advanced-excel',
      'soft-skills-training-institute-in-hyderabad':            'soft-skills-personality-development',
      'spoken-english-training-institute-in-hyderabad':         'spoken-english-communication',
      'tally-erp-training-institute-in-hyderabad':              'tally-erp-prime-accounting',

      // "-institute-" variants missing — GSC 404 remediation 2026-07-16
      'linux-administration-training-institute-in-hyderabad':  'linux-shell-scripting-training-in-hyderabad',
      'azure-data-engineer-training-institute-in-hyderabad':    'azure-data-factory-training-in-hyderabad',
      'ccna-training-institute-in-hyderabad':                   'network-security-training-in-hyderabad',

      // Orphaned sitemap URLs — SEO audit remediation 2026-07-17
      'python-full-stack-training-institute-in-hyderabad':      'full-stack-python-training-in-hyderabad',

      // Fallback-only slugs formalized — flat-legacy consolidation 2026-07-23
      'salesforce-training-institute-in-hyderabad':             'salesforce-admin-developer-training-in-hyderabad',
      'seo-training-institute-in-hyderabad':                    'seo-training-institute-in-hyderabad',
}
