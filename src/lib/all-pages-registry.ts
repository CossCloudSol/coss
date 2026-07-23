/**
 * src/lib/all-pages-registry.ts
 *
 * Single source of truth for EVERY public page on the site.
 * Used by: sitemap.ts, generateMetadata helpers, schema injection.
 *
 * HOW TO ADD A NEW PAGE:
 *   1. Add an entry to COURSE_PAGES (course pages) or STATIC_PAGES (everything else).
 *   2. That's it — sitemap, metadata and schema all pick it up automatically.
 */

export interface CoursePage {
  /** URL slug — no leading slash, e.g. "big-data-training-institute-in-hyderabad" */
  slug: string;
  /** Full H1 / page title */
  title: string;
  /** ~155-char meta description */
  metaDescription: string;
  /** Comma-separated keyword string */
  keywords: string;
  /** Primary keyword for schema "name" field */
  primaryKeyword: string;
  /** Category label shown in breadcrumb / schema */
  category: string;
  /** Sitemap priority 0.0–1.0 */
  priority?: number;
}

export interface StaticPage {
  slug: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  27 SEO Course Pages (from your 3-session execution plan)                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export const COURSE_PAGES: ReadonlyArray<CoursePage> = [
  // ── Session 1: Data, Analytics & BI ──────────────────────────────────────
  {
    slug: 'big-data-training-institute-in-hyderabad',
    title: 'Best Big Data Training Institute in Hyderabad',
    metaDescription:
      'Join the best big data training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'big data training in Hyderabad, big data course Hyderabad, Hadoop training, big data analytics certification',
    primaryKeyword: 'Big Data Training in Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.9,
  },
  {
    slug: 'machine-learning-training-institute-in-hyderabad',
    title: 'Best Machine Learning Training Institute in Hyderabad',
    metaDescription:
      'Join the best machine learning training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'machine learning training in Hyderabad, ML course Hyderabad, machine learning certification, AI ML training Hyderabad',
    primaryKeyword: 'Machine Learning Training in Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.9,
  },
  {
    slug: 'artificial-intelligence-training-institute-in-hyderabad',
    title: 'Best Artificial Intelligence Training Institute in Hyderabad',
    metaDescription:
      'Join the best artificial intelligence training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'artificial intelligence training in Hyderabad, AI course Hyderabad, AI training institute, AI ML certification Hyderabad',
    primaryKeyword: 'Artificial Intelligence Training in Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.9,
  },
  {
    slug: 'power-bi-training-institute-in-hyderabad',
    title: 'Best Full Stack Power BI Training Institute in Hyderabad',
    metaDescription:
      'Join the best Power BI training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Power BI training in Hyderabad, Microsoft Power BI course, Power BI certification, BI developer training Hyderabad',
    primaryKeyword: 'Power BI Training in Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.9,
  },
  {
    slug: 'sql-training-institute-in-hyderabad',
    title: 'Best SQL / MySQL / PostgreSQL Training Institute in Hyderabad',
    metaDescription:
      'Join the best SQL training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'SQL training in Hyderabad, MySQL training Hyderabad, PostgreSQL course, database training Hyderabad',
    primaryKeyword: 'SQL Training in Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.85,
  },
  {
    slug: 'azure-training-institute-in-hyderabad',
    title: 'Best Microsoft Azure Training Institute in Hyderabad',
    metaDescription:
      'Join the best Microsoft Azure training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'Microsoft Azure training in Hyderabad, Azure certification Hyderabad, Azure cloud course, Azure administrator training',
    primaryKeyword: 'Microsoft Azure Training in Hyderabad',
    category: 'Cloud Computing',
    priority: 0.9,
  },
  {
    slug: 'google-cloud-training-institute-in-hyderabad',
    title: 'Best Google Cloud Training Institute in Hyderabad',
    metaDescription:
      'Join the best Google Cloud training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'Google Cloud training in Hyderabad, GCP course Hyderabad, Google Cloud Platform certification, cloud engineer training',
    primaryKeyword: 'Google Cloud Training in Hyderabad',
    category: 'Cloud Computing',
    priority: 0.9,
  },

  // ── Session 1: DevOps & Multi-Cloud ──────────────────────────────────────
  {
    slug: 'devops-training-institute-in-hyderabad',
    title: 'Best DevOps Training Institute in Hyderabad',
    metaDescription:
      'Join the best DevOps training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'DevOps training in Hyderabad, DevOps course Hyderabad, CI CD training, DevOps certification institute Hyderabad',
    primaryKeyword: 'DevOps Training in Hyderabad',
    category: 'DevOps & Multi-Cloud',
    priority: 0.9,
  },
  {
    slug: 'aws-devops-training-institute-in-hyderabad',
    title: 'Best AWS DevOps Training Institute in Hyderabad',
    metaDescription:
      'Join the best AWS DevOps training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'AWS DevOps training in Hyderabad, AWS DevOps course Hyderabad, cloud DevOps training, AWS pipeline certification',
    primaryKeyword: 'AWS DevOps Training in Hyderabad',
    category: 'DevOps & Multi-Cloud',
    priority: 0.85,
  },
  {
    slug: 'azure-devops-training-institute-in-hyderabad',
    title: 'Best Azure DevOps Training Institute in Hyderabad',
    metaDescription:
      'Join the best Azure DevOps training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'Azure DevOps training in Hyderabad, Azure DevOps course Hyderabad, Azure pipelines training, Microsoft DevOps certification',
    primaryKeyword: 'Azure DevOps Training in Hyderabad',
    category: 'DevOps & Multi-Cloud',
    priority: 0.9,
  },

  // ── Session 2: Programming & Full Stack ──────────────────────────────────
  {
    slug: 'python-training-institute-in-hyderabad',
    title: 'Best Python Training Institute in Hyderabad',
    metaDescription:
      'Join the best Python training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Python training in Hyderabad, Python course Hyderabad, Python programming certification, Python developer training',
    primaryKeyword: 'Python Training in Hyderabad',
    category: 'Programming & Full Stack',
    priority: 0.9,
  },
  {
    slug: 'java-training-institute-in-hyderabad',
    title: 'Best Java Training Institute in Hyderabad',
    metaDescription:
      'Join the best Java training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Java training in Hyderabad, Java course Hyderabad, Core Java certification, Java programming institute Hyderabad',
    primaryKeyword: 'Java Training in Hyderabad',
    category: 'Programming & Full Stack',
    priority: 0.9,
  },
  {
    slug: 'python-full-stack-training-institute-in-hyderabad',
    title: 'Best Python Full Stack Training Institute in Hyderabad',
    metaDescription:
      'Join the best Python Full Stack training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'Python Full Stack training in Hyderabad, Python full stack developer course, Django Flask training Hyderabad',
    primaryKeyword: 'Python Full Stack Training in Hyderabad',
    category: 'Programming & Full Stack',
    priority: 0.9,
  },

  // ── Session 2: Data Engineering ──────────────────────────────────────────
  {
    slug: 'data-engineering-training-institute-in-hyderabad',
    title: 'Best Data Engineering Training Institute in Hyderabad',
    metaDescription:
      'Join the best data engineering training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'data engineering training in Hyderabad, data engineer course Hyderabad, ETL training, data pipeline certification Hyderabad',
    primaryKeyword: 'Data Engineering Training in Hyderabad',
    category: 'Data Engineering',
    priority: 0.9,
  },
  {
    slug: 'azure-data-engineer-training-institute-in-hyderabad',
    title: 'Best Azure Data Engineer Training Institute in Hyderabad',
    metaDescription:
      'Join the best Azure Data Engineer training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'Azure Data Engineer training in Hyderabad, Azure data engineering course, DP-203 certification Hyderabad, Azure data factory',
    primaryKeyword: 'Azure Data Engineer Training in Hyderabad',
    category: 'Data Engineering',
    priority: 0.9,
  },

  // ── Session 2: Cyber Security ─────────────────────────────────────────────
  {
    slug: 'cyber-security-training-institute-in-hyderabad',
    title: 'Best Cyber Security Training Institute in Hyderabad',
    metaDescription:
      'Join the best cyber security training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'cyber security training in Hyderabad, cyber security course Hyderabad, information security certification, cybersecurity',
    primaryKeyword: 'Cyber Security Training in Hyderabad',
    category: 'Cyber Security',
    priority: 0.9,
  },
  {
    slug: 'ethical-hacking-training-institute-in-hyderabad',
    title: 'Best Ethical Hacking Training Institute in Hyderabad',
    metaDescription:
      'Join the best ethical hacking training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'ethical hacking training in Hyderabad, ethical hacking course Hyderabad, CEH certification, penetration testing Hyderabad',
    primaryKeyword: 'Ethical Hacking Training in Hyderabad',
    category: 'Cyber Security',
    priority: 0.9,
  },
  {
    slug: 'ccna-training-institute-in-hyderabad',
    title: 'Best CCNA Networking Training Institute in Hyderabad',
    metaDescription:
      'Join the best CCNA training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'CCNA training in Hyderabad, CCNA certification Hyderabad, networking course, Cisco training institute Hyderabad',
    primaryKeyword: 'CCNA Training in Hyderabad',
    category: 'Cyber Security',
    priority: 0.85,
  },
  {
    slug: 'salesforce-training-institute-in-hyderabad',
    title: 'Best Salesforce CRM Training Institute in Hyderabad',
    metaDescription:
      'Join the best Salesforce training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Salesforce training in Hyderabad, Salesforce CRM course Hyderabad, Salesforce admin certification, Salesforce developer',
    primaryKeyword: 'Salesforce Training in Hyderabad',
    category: 'ERP, CRM & Enterprise',
    priority: 0.9,
  },
  {
    slug: 'tally-erp-training-institute-in-hyderabad',
    title: 'Best Tally ERP Training Institute in Hyderabad',
    metaDescription:
      'Join the best Tally ERP training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Tally ERP training in Hyderabad, Tally course Hyderabad, Tally Prime certification, accounting software training',
    primaryKeyword: 'Tally ERP Training in Hyderabad',
    category: 'ERP, CRM & Enterprise',
    priority: 0.85,
  },

  // ── Session 3: Software Testing & OS ─────────────────────────────────────
  {
    slug: 'linux-administration-training-institute-in-hyderabad',
    title: 'Best Linux Administration Training Institute in Hyderabad',
    metaDescription:
      'Join the best Linux training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'Linux training in Hyderabad, Linux administration course Hyderabad, RHEL certification, Linux system admin',
    primaryKeyword: 'Linux Administration Training in Hyderabad',
    category: 'Software Testing & OS',
    priority: 0.85,
  },
  {
    slug: 'software-testing-training-institute-in-hyderabad',
    title: 'Best Software Testing Training Institute in Hyderabad',
    metaDescription:
      'Join the best software testing training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'software testing training in Hyderabad, testing tools course Hyderabad, QA training, Selenium testing certification',
    primaryKeyword: 'Software Testing Training in Hyderabad',
    category: 'Software Testing & OS',
    priority: 0.9,
  },

  // ── Session 3: Digital & Design ───────────────────────────────────────────
  {
    slug: 'digital-marketing-training-institute-in-hyderabad',
    title: 'Best Digital Marketing Training Institute in Hyderabad',
    metaDescription:
      'Join the best digital marketing training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'digital marketing training in Hyderabad, digital marketing course Hyderabad, SEO SEM training, online marketing certification',
    primaryKeyword: 'Digital Marketing Training in Hyderabad',
    category: 'Digital & Design',
    priority: 0.9,
  },
  {
    slug: 'ui-ux-design-training-institute-in-hyderabad',
    title: 'Best UI/UX Design Training Institute in Hyderabad',
    metaDescription:
      'Join the best UI UX design training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'UI UX design training in Hyderabad, UI UX course Hyderabad, user experience design, Figma Adobe XD certification',
    primaryKeyword: 'UI/UX Design Training in Hyderabad',
    category: 'Digital & Design',
    priority: 0.85,
  },
  {
    slug: 'seo-training-institute-in-hyderabad',
    title: 'Best SEO Training Institute in Hyderabad',
    metaDescription:
      'Join the best SEO training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'SEO training in Hyderabad, SEO course Hyderabad, search engine optimization certification, on-page off-page SEO',
    primaryKeyword: 'SEO Training in Hyderabad',
    category: 'Digital & Design',
    priority: 0.85,
  },

  // ── Session 3: Professional & Soft Skills ─────────────────────────────────
  {
    slug: 'spoken-english-training-institute-in-hyderabad',
    title: 'Best Spoken English Training Institute in Hyderabad',
    metaDescription:
      'Join the best spoken English training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now!',
    keywords: 'spoken English training in Hyderabad, English speaking course Hyderabad, spoken English classes, communication training',
    primaryKeyword: 'Spoken English Training in Hyderabad',
    category: 'Professional & Soft Skills',
    priority: 0.8,
  },
  {
    slug: 'ms-office-training-institute-in-hyderabad',
    title: 'Best MS Office Training Institute in Hyderabad',
    metaDescription:
      'Join the best MS Office training in Hyderabad. Expert trainers, live projects, placement support & certification. Enroll now at COSS Cloud Solutions!',
    keywords: 'MS Office training in Hyderabad, Microsoft Office course Hyderabad, Excel Word PowerPoint training, MS Office cert',
    primaryKeyword: 'MS Office Training in Hyderabad',
    category: 'Professional & Soft Skills',
    priority: 0.8,
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Static / non-course pages                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Category overview pages  (e.g. /courses/cloud-computing, /data-analytics-bi) */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface CategoryPage {
  /** URL slug — no leading slash */
  slug: string;
  /** courseData key used in CourseCategoryPage — matches src/lib/courseData.ts */
  courseDataKey: string;
  /** Full page title */
  title: string;
  /** ~155-char meta description */
  metaDescription: string;
  /** Keywords string */
  keywords: string;
  /** Category label for schema breadcrumb */
  category: string;
  /** Sitemap priority */
  priority?: number;
}

export const CATEGORY_PAGES: ReadonlyArray<CategoryPage> = [
  {
    slug: 'courses/cloud-computing',
    courseDataKey: 'cloud-computing',
    title: 'Cloud Computing Training in Hyderabad',
    metaDescription:
      'AWS, Azure & Google Cloud training in Hyderabad. Hands-on labs, certification prep & placement support at Coss Cloud Solutions.',
    keywords:
      'cloud computing training in Hyderabad, cloud computing course Hyderabad, AWS Azure GCP training, cloud certification Hyderabad',
    category: 'Cloud Computing',
    priority: 0.85,
  },
  {
    slug: 'courses/cyber-security',
    courseDataKey: 'cyber-security-networking',
    title: 'Cyber Security Training in Hyderabad',
    metaDescription:
      'Ethical Hacking, Cyber Security & Networking courses in Hyderabad. CEH exam prep & placement at Coss Cloud Solutions.',
    keywords:
      'cyber security training in Hyderabad, networking course Hyderabad, ethical hacking training, CCNA certification Hyderabad',
    category: 'Cyber Security & Networking',
    priority: 0.85,
  },
  {
    slug: 'courses/data-engineering',
    courseDataKey: 'data-engineering',
    title: 'Data Engineering Training in Hyderabad',
    metaDescription:
      'Data Engineering with Spark, Kafka, Airflow & cloud pipelines in Hyderabad. Job-ready training at Coss Cloud Solutions.',
    keywords:
      'data engineering training in Hyderabad, data pipeline course Hyderabad, Azure data engineer training, big data engineering certification',
    category: 'Data Engineering',
    priority: 0.85,
  },
  {
    slug: 'courses/devops-multi-cloud',
    courseDataKey: 'devops-multi-cloud',
    title: 'DevOps & Multi-Cloud Training in Hyderabad',
    metaDescription:
      'Master CI/CD, Docker, Kubernetes & multi-cloud DevOps in Hyderabad. Industry trainers, live projects at Coss Cloud Solutions.',
    keywords:
      'DevOps training in Hyderabad, multi-cloud course Hyderabad, Docker Kubernetes training, CI/CD certification Hyderabad',
    category: 'DevOps & Multi-Cloud',
    priority: 0.85,
  },
  {
    slug: 'courses/digital-design',
    courseDataKey: 'digital-design',
    title: 'Digital Marketing & Design Training in Hyderabad',
    metaDescription:
      'Digital Marketing, UI/UX & Design courses in Hyderabad. Practical, placement-focused at Coss Cloud Solutions.',
    keywords:
      'digital marketing training in Hyderabad, design course Hyderabad, UI UX training, graphic design certification Hyderabad',
    category: 'Digital & Design',
    priority: 0.8,
  },
  {
    slug: 'courses/erp-crm-enterprise-tools',
    courseDataKey: 'erp-crm-enterprise-tools',
    title: 'SAP & ERP Training in Hyderabad',
    metaDescription:
      'SAP FICO, Oracle HCM & Salesforce training in Hyderabad. Consultant-level ERP courses at Coss Cloud Solutions.',
    keywords:
      'ERP training in Hyderabad, SAP course Hyderabad, Salesforce CRM training, Oracle Fusion certification Hyderabad',
    category: 'ERP, CRM & Enterprise Tools',
    priority: 0.8,
  },
  {
    slug: 'courses/professional-soft-skills',
    courseDataKey: 'professional-soft-skills',
    title: 'Professional Skills Training in Hyderabad',
    metaDescription:
      'Communication, leadership & soft skills courses in Hyderabad for IT professionals. Enroll at Coss Cloud Solutions.',
    keywords:
      'soft skills training in Hyderabad, MS Office course Hyderabad, spoken English training, communication skills certification Hyderabad',
    category: 'Professional & Soft Skills',
    priority: 0.75,
  },
  {
    slug: 'courses/programming-full-stack',
    courseDataKey: 'programming-full-stack-development',
    title: 'Full Stack Development Training in Hyderabad',
    metaDescription:
      'Learn Full Stack, Java, Python & web development in Hyderabad. Build real projects with expert guidance at Coss Cloud Solutions.',
    keywords:
      'programming training in Hyderabad, full stack development course Hyderabad, Java Python training, web development certification Hyderabad',
    category: 'Programming & Full Stack',
    priority: 0.85,
  },
  {
    slug: 'courses/data-analytics-bi',
    courseDataKey: 'data-analytics-bi',
    title: 'Data Analytics & BI Training in Hyderabad',
    metaDescription:
      'Join Data Analytics & Business Intelligence training in Hyderabad at Coss Cloud Solutions. Learn Power BI, Tableau, SQL, Python & ML with expert trainers, live projects, and 100% placement support.',
    keywords:
      'data analytics training in Hyderabad, BI training Hyderabad, Power BI course, data science certification Hyderabad',
    category: 'Data, Analytics & BI',
    priority: 0.85,
  },
  {
    slug: 'courses/software-testing-os',
    courseDataKey: 'software-testing-os',
    title: 'Software Testing Training in Hyderabad',
    metaDescription:
      'Manual & Automation Testing, Selenium & QA courses in Hyderabad. Job-ready training at Coss Cloud Solutions.',
    keywords:
      'software testing training in Hyderabad, QA course Hyderabad, Selenium automation training, Linux OS certification Hyderabad',
    category: 'Software Testing & OS',
    priority: 0.85,
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Static / non-course pages                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export const STATIC_PAGES: ReadonlyArray<StaticPage> = [
  { slug: '',                    priority: 1.0, changeFrequency: 'weekly'  },
  { slug: 'courses',             priority: 0.9, changeFrequency: 'weekly'  },
  { slug: 'about-us',            priority: 0.8, changeFrequency: 'monthly' },
  { slug: 'why-us',              priority: 0.7, changeFrequency: 'monthly' },
  { slug: 'contact-us',          priority: 0.8, changeFrequency: 'monthly' },
  { slug: 'blog',                priority: 0.8, changeFrequency: 'daily'   },
  { slug: 'certification',       priority: 0.7, changeFrequency: 'monthly' },
  { slug: 'corporate-training',  priority: 0.8, changeFrequency: 'monthly' },
  { slug: 'placements',          priority: 0.7, changeFrequency: 'monthly' },
  { slug: 'student-reviews',     priority: 0.7, changeFrequency: 'monthly' },
  { slug: 'enroll-now-with-coss',priority: 0.8, changeFrequency: 'weekly'  },
  { slug: 'free-demo-class',     priority: 0.8, changeFrequency: 'weekly'  },
  { slug: 'privacy-policy',      priority: 0.3, changeFrequency: 'yearly'  },
  { slug: 'terms-conditions',    priority: 0.3, changeFrequency: 'yearly'  },
  { slug: 'locations/dilsukhnagar',       priority: 0.75, changeFrequency: 'monthly' },
  { slug: 'locations/ameerpet',           priority: 0.75, changeFrequency: 'monthly' },
  { slug: 'locations/kukatpally',         priority: 0.7,  changeFrequency: 'monthly' },
  { slug: 'locations/madhapur-hitec-city',priority: 0.7,  changeFrequency: 'monthly' },
];
