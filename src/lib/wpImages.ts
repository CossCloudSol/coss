// Original WordPress image URLs extracted from the migrated MDX content files.
// These are served directly from your WordPress media library.
// Next.js fetches them as <img src> at runtime — browsers can load them fine.

const WP = 'https://res.cloudinary.com/dfditihuw/image/upload/cosscloudsol/site-images/nextjs-cosscloudsol-com/wp-content/uploads';

export interface SubCourse {
  name: string;
  image: string;       // WP media URL
  href: string;
  alt: string;
}

export interface CategoryImages {
  hero: string;        // Banner / hero image for the category page
  icon: string;        // Small icon / category thumbnail
  subcourses: SubCourse[];
  companyLogos: string[];
  extraImages: string[];
}

export const wpImages: Record<string, CategoryImages> = {

  'data-analytics-bi': {
    hero:  `${WP}/2026/02/Data-Analytics-BI-1.png`,
    icon:  `${WP}/2026/02/Data-Analytics-BI.png`,
    subcourses: [
      { name: 'Data Analytics',          image: `${WP}/2026/02/Data-Analytics-570x321.jpg`,          href: '/data-analytics-training-institute-in-hyderabad/',           alt: 'Data Analytics Training Hyderabad' },
      { name: 'Data Science',            image: `${WP}/2025/08/Data-Science-1-570x321.jpg`,           href: '/data-science-training-institute-in-hyderabad/',             alt: 'Data Science Training Hyderabad' },
      { name: 'Big Data',                image: `${WP}/2026/02/big-data-570x321.jpg`,                 href: '/big-data-training-in-hyderabad/',                           alt: 'Big Data Training Hyderabad' },
      { name: 'Machine Learning',        image: `${WP}/2025/08/Machine-Learning-1.jpg`,               href: '/machine-learning-training-institute-in-hyderabad/',         alt: 'Machine Learning Training Hyderabad' },
      { name: 'Artificial Intelligence', image: `${WP}/2025/08/Artificial-intelligence-1-570x321.webp`, href: '/artificial-intelligence-ai-training-institute-in-hyderabad/', alt: 'AI Training Hyderabad' },
      { name: 'Full Stack Power BI',     image: `${WP}/2025/08/Full-Stack-Power-BI-1-570x321.jpeg`,  href: '/full-stack-power-bi-training-institute-in-hyderabad/',      alt: 'Power BI Training Hyderabad' },
      { name: 'SQL / MySQL / PostgreSQL',image: `${WP}/2025/08/SQL-MySQL-PostgreSQL-1-1.jpg`,         href: '/sql-mysql-postgresql-training-in-hyderabad/',               alt: 'SQL Training Hyderabad' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`, `${WP}/2021/12/oracle-jpg.webp`,
      `${WP}/2021/12/hcl-jpg.webp`,   `${WP}/2021/12/wipro-jpg.webp`, `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [`${WP}/2026/02/Data-Engineering-1.png`],
  },

  'cloud-computing': {
    hero: `${WP}/2026/02/Cloud-Computing-3.png`,
    icon: `${WP}/2026/02/Cloud-Computing-2.png`,
    subcourses: [
      { name: 'AWS Cloud Training',            image: `${WP}/2024/11/AWS-Cloud-Training-Institute.jpg`,             href: '/aws-cloud-training-in-hyderabad/',              alt: 'AWS Cloud Training Hyderabad' },
      { name: 'Microsoft Azure Training',      image: `${WP}/2024/11/Azure-Cloud-Training-Institute-image-banner.jpg`, href: '/azure-training-institute-in-hyderabad/',  alt: 'Azure Training Hyderabad' },
      { name: 'Google Cloud Training',         image: `${WP}/2025/01/Google-Cloud-Training-scaled.jpg`,             href: '/google-cloud-training-institute-in-hyderabad/', alt: 'Google Cloud Training' },
      { name: 'AWS DevOps',                    image: `${WP}/2024/11/AWS-DevOps-Training-in-Hyderabad.jpg`,          href: '/aws-devops-in-hyderabad/',                     alt: 'AWS DevOps Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`,   `${WP}/2021/12/oracle-jpg.webp`,
      `${WP}/2021/12/hcl-jpg.webp`,   `${WP}/2021/12/wipro-jpg.webp`, `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [
      `${WP}/2025/01/Cloud-Computing-Institute.webp`,
      `${WP}/2024/11/Cloud-Computing-Training-Institute-COSS.jpg`,
      `${WP}/2026/02/Cloud-Computing-4-256x190.png`,
    ],
  },

  'devops-multi-cloud': {
    hero: `${WP}/2026/02/DevOps-Multi-Cloud-Courses.png`,
    icon: `${WP}/2026/02/DevOps-and-Multi-Cloud.png`,
    subcourses: [
      { name: 'AWS DevOps',              image: `${WP}/2024/12/AWS-DevOps-Training-Image-Banner.jpg`,   href: '/aws-devops-course-in-hyderabad-by-coss-cloud-solutions/', alt: 'AWS DevOps Training' },
      { name: 'Azure DevOps',            image: `${WP}/2025/09/AzureDevops-Training-Hyderabad.png`,     href: '/azure-devops-courses-in-hyderabad-by-coss-cloud-solutions/', alt: 'Azure DevOps Training' },
      { name: 'Multi-Cloud with DevOps', image: `${WP}/2026/02/Multi-Cloud-with-DevOps.jpg`,            href: '/devops-training-institute-in-hyderabad/',           alt: 'Multi Cloud DevOps' },
      { name: 'Multi-Cloud Engineer',    image: `${WP}/2026/02/Multi-Cloud-Engineer.jpg`,               href: '/multi-cloud-engineer-training-in-hyderabad/',            alt: 'Multi Cloud Engineer' },
      { name: 'DevOps Training',         image: `${WP}/2024/11/DevOps-Training-Image-Banner.jpg`,       href: '/devops-training-in-hyderabad/',                          alt: 'DevOps Training Hyderabad' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`, `${WP}/2021/12/hcl-jpg.webp`,
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`, `${WP}/2021/12/tech_mahindra-jpg.webp`,
    ],
    extraImages: [
      `${WP}/2025/01/Devops-Institute-scaled.jpg`,
      `${WP}/2026/02/DevOps-Automation.png`,
    ],
  },

  'programming-full-stack': {
    hero: `${WP}/2026/02/Programming-Full-Stack-Development-2.png`,
    icon: `${WP}/2026/02/Programming-Full-Stack-Development.png`,
    subcourses: [
      { name: 'Python Full Stack',   image: `${WP}/2026/02/Python-Full-Stack.jpg`,                href: '/python-training-institute-in-hyderabad/',         alt: 'Python Full Stack Training' },
      { name: 'Java Full Stack',     image: `${WP}/2026/02/Java-Full-Stack.jpg`,                  href: '/java-training-institute-in-hyderabad/',           alt: 'Java Full Stack Training' },
      { name: 'Python Training',     image: `${WP}/2025/03/Python-Training-Institute-in-Dilsukhnagar-Hyderabad.jpg`, href: '/python-training-institute-in-hyderabad/', alt: 'Python Training' },
      { name: 'Java Training',       image: `${WP}/2025/02/Java.jpg`,                             href: '/java-training-institute-in-hyderabad/', alt: 'Java Training' },
      { name: 'Programming',         image: `${WP}/2026/02/Programming.png`,                      href: '/full-stack-developer-training-in-hyderabad/',                      alt: 'Programming Courses' },
    ],
    companyLogos: [
      `${WP}/2021/12/wipro-jpg.webp`, `${WP}/2021/12/tcs-jpg.webp`,  `${WP}/2021/12/ibm-jpg.webp`,
      `${WP}/2021/12/hcl-jpg.webp`,   `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/oracle-jpg.webp`,
    ],
    extraImages: [`${WP}/2026/02/Live-Projects.png`],
  },

  'data-engineering': {
    hero: `${WP}/2026/02/Data-Engineering-1.png`,
    icon: `${WP}/2026/02/Data-Engineering.png`,
    subcourses: [
      { name: 'Azure Data Engineer', image: `${WP}/2025/09/Azure-Data-Engineer-Training-in-Hyderabad.jpg`, href: '/azure-data-engineer-training-in-hyderabad/', alt: 'Azure Data Engineer Training Hyderabad' },
      { name: 'Cloud Data Engineer', image: `${WP}/2026/02/Cloud-Data-Engineer-570x321.jpg`,              href: '/cloud-data-engineer-training-in-hyderabad/', alt: 'Cloud Data Engineer Training' },
      { name: 'Data Engineering',    image: `${WP}/2026/02/Data-Engineering-2.png`,                        href: '/data-engineering-training-institute-in-hyderabad/',                  alt: 'Data Engineering Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/oracle-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`,
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [`${WP}/2026/02/Saas.png`],
  },

  'cyber-security': {
    hero: `${WP}/2026/02/Cyber-Security-Networking-1.png`,
    icon: `${WP}/2026/02/Cyber-Security-Networking.png`,
    subcourses: [
      { name: 'Ethical Hacking', image: `${WP}/2025/03/Best-Cyber-Security-Institute-in-Dilsukhnagar-Hyderabad.png`, href: '/ethical-hacking-in-hyderabad-coss-cloud-solutions/', alt: 'Ethical Hacking Training' },
      { name: 'CCNA Networking', image: `${WP}/2026/02/CCNA-Networking.jpg`,                                          href: '/ccna-networking-training-in-hyderabad/',             alt: 'CCNA Networking Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/ibm-jpg.webp`, `${WP}/2021/12/hcl-jpg.webp`, `${WP}/2021/12/wipro-jpg.webp`,
      `${WP}/2021/12/tcs-jpg.webp`, `${WP}/2021/12/google-jpg.webp`,
    ],
    extraImages: [`${WP}/2026/02/Cyber-Security-Networking.png`],
  },

  'erp-crm-enterprise-tools': {
    hero: `${WP}/2026/02/ERP-CRM-Enterprise-Tools-1.png`,
    icon: `${WP}/2026/02/ERP-CRM-Enterprise-Tools.png`,
    subcourses: [
      { name: 'SAP FICO',              image: `${WP}/2025/09/SAP-FICO-Training-at-COSS-Cloud-Solutions-1.jpg`, href: '/sap-fico-training-institute-in-hyderabad/',             alt: 'SAP FICO Training' },
      { name: 'Oracle Fusion Cloud HCM', image: `${WP}/2026/02/Oracle-Fusion-Cloud-HCM.jpg`,                  href: '/oracle-fusion-cloud-hcm-training-in-hyderabad/',        alt: 'Oracle Fusion HCM Training' },
      { name: 'Salesforce CRM',        image: `${WP}/2025/03/Coss-Cloud-Solutions-Salesforce-Training-Hyderabad.jpg`, href: '/salesforce-training-center-in-hyderabad/',        alt: 'Salesforce CRM Training' },
      { name: 'ERP & CRM Tools',       image: `${WP}/2026/02/ERP-CRM.png`,                                    href: '/erp-crm-training-institute-in-hyderabad/',                     alt: 'ERP CRM Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/oracle-jpg.webp`, `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`,
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [`${WP}/2026/02/Finance.png`, `${WP}/2026/02/Government.png`],
  },

  'software-testing-os': {
    hero: `${WP}/2026/02/Software-Testing-OS-1.png`,
    icon: `${WP}/2026/02/Software-Testing-OS.png`,
    subcourses: [
      { name: 'Linux Administration', image: `${WP}/2025/01/Linux-Institute-in-Hyderabad.jpg`, href: '/linux-training-in-hyderabad/',       alt: 'Linux Training Hyderabad' },
      { name: 'Testing Tools',        image: `${WP}/2026/02/Testing-Tools.jpg`,                href: '/software-testing-training-institute-in-hyderabad/',        alt: 'Software Testing Training' },
      { name: 'Red Hat Linux',        image: `${WP}/2025/08/BECOME-A-CERTIFIED-REDLINUX-ON-RED-HAT-ENTERPRISE-LINUX-1-800x800.jpg`, href: '/redhat-linux-certification-course-in-hyderabad/', alt: 'Red Hat Linux' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`, `${WP}/2021/12/hcl-jpg.webp`,
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [`${WP}/2024/03/Linux12.jpg`],
  },

  'digital-design': {
    hero: `${WP}/2026/02/Digital-Design-Courses.png`,
    icon: `${WP}/2026/02/Digital-Design.png`,
    subcourses: [
      { name: 'Digital Marketing', image: `${WP}/2025/03/Digital-Marketing.jpg`,                                    href: '/digital-marketing-course-in-hyderabad-by-coss-cloud-solutions/', alt: 'Digital Marketing Training' },
      { name: 'UI / UX Design',   image: `${WP}/2026/02/UI-UX-Design.jpg`,                                          href: '/ui-ux-design-training-in-hyderabad/',             alt: 'UI UX Design Training' },
      { name: 'SEO Training',     image: `${WP}/2025/04/Best-Digital-Marketing-Institute-in-Hyderabad.png`,          href: '/digital-marketing-training-institute-in-dilsukhnagar-hyderabad/', alt: 'SEO Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/ibm-jpg.webp`, `${WP}/2021/12/hcl-jpg.webp`,
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`,
    ],
    extraImages: [`${WP}/2025/07/Digital-Marketing-Training-in-Dilsukhnagar.png`],
  },

  'professional-soft-skills': {
    hero: `${WP}/2026/02/Professional-Soft-Skills-Courses.png`,
    icon: `${WP}/2026/02/Professional-Soft-Skills.png`,
    subcourses: [
      { name: 'Spoken English',       image: `${WP}/2025/08/Spoken-English-Institute-in-Hyderabad-COSS-Cloud-Solutions-scaled.jpg`, href: '/spoken-english-institute-in-hyderabad-coss-cloud-solutions/', alt: 'Spoken English Training' },
      { name: 'Communication Skills', image: `${WP}/2025/08/Best-Communication-Skills-Institute-in-Hyderabad-COSS-Cloud-Solutions-scaled.jpg`, href: '/communication-skills-training-in-hyderabad-coss-cloud-solutions/', alt: 'Communication Skills Training' },
      { name: 'MS Office',            image: `${WP}/2026/02/MS-Office.jpg`,                                                        href: '/ms-office-course-near-me-in-hyderabad-coss-cloud-solutions/', alt: 'MS Office Training' },
      { name: 'Tally ERP',            image: `${WP}/2025/04/Best-Tally-Institute-in-Dilsukhnagar-Hyderabad.jpg`,                  href: '/tally-classes-in-hyderabad/',                                  alt: 'Tally Training' },
    ],
    companyLogos: [
      `${WP}/2021/12/wipro-jpg.webp`,  `${WP}/2021/12/tcs-jpg.webp`,    `${WP}/2021/12/hcl-jpg.webp`,
      `${WP}/2021/12/google-jpg.webp`, `${WP}/2021/12/oracle-jpg.webp`,
    ],
    extraImages: [`${WP}/2024/12/MS-Office-Course-Near-Me-in-Hyderabad-Coss-Cloud-Solutions.jpg`],
  },
};

// Shared site-wide image URLs
export const siteImages = {
  logo:             '/logo.png',
  heroBgLandscape:  `${WP}/2026/01/Coss-Cloud-Solution-Intreo-Lndscape.webm`,
  heroBgVertical:   `${WP}/2026/01/Coss-Cloud-Solution-Intreo-Verticle.webm`,
  siteBg:           `${WP}/2026/01/Coss-Cloud-Solutions-Theme-Backgroud.jpg`,
  footerBg:         `${WP}/2026/02/footer-backgrounde.jpg`,
  footerContact:    `${WP}/2021/07/Footer-Contract-1-1.png`,
  corporateTraining:`${WP}/2026/02/Corporate-Training.jpg`,
  trainingBanner:   `${WP}/2026/02/Training-Built-Around-Career-Outcomes-Banner.jpg`,
  learnIcon:        `${WP}/2026/02/learn.png`,
  buildIcon:        `${WP}/2026/02/build.png`,
  getPlacedIcon:    `${WP}/2026/02/Get-Placed.png`,
  enrollIcon:       `${WP}/2026/01/enroll.png`,
  placementAssist:  `${WP}/2026/02/Placement-Assistance.png`,
  resumeBuilding:   `${WP}/2026/02/Resume-Building-1.jpg`,
  mockInterview:    `${WP}/2026/02/Mock-Inter.png`,
  jobReferrals:     `${WP}/2026/02/Job-Referrals-1.jpg`,
  itCertification:  `${WP}/2026/02/IT-certification-courses.png`,
  nextBatch:        `${WP}/2026/02/Next-Batch-Filling-Fast-1.png`,
  industryTrainers: `${WP}/2026/02/Industry-Expert-Trainers-2.png`,
  practicalTraining:`${WP}/2026/02/Practical-Training.png`,
  liveProjects:     `${WP}/2026/02/Live-Projects.png`,
  // Hiring company logos (real ones from WP)
  companies: {
    google:   `${WP}/2021/12/google-jpg.webp`,
    ibm:      `${WP}/2021/12/ibm-jpg.webp`,
    oracle:   `${WP}/2021/12/oracle-jpg.webp`,
    wipro:    `${WP}/2021/12/wipro-jpg.webp`,
    tcs:      `${WP}/2021/12/tcs-jpg.webp`,
    hcl:      `${WP}/2021/12/hcl-jpg.webp`,
    techM:    `${WP}/2021/12/tech_mahindra-jpg.webp`,
    airtel:   `${WP}/2021/12/airtel-jpg.webp`,
    genpact:  `${WP}/2021/12/genpact-jpg.webp`,
    synopsys: `${WP}/2021/12/synopsys-jpg.webp`,
    sonata:   `${WP}/2021/12/sonata-jpg.webp`,
    adp:      `${WP}/2021/12/adp-jpg.webp`,
    jpmorgan: `${WP}/2021/12/jpmorgan-chase-co-logo-200x80-jpg.webp`,
    wellsfargo:`${WP}/2021/12/wells_fargo-jpg.webp`,
    ericsson: `${WP}/2021/12/ericsson-jpg.webp`,
    hsbc:     `${WP}/2021/12/hsbc-jpg.webp`,
    bankofamerica:`${WP}/2021/12/bank_of_america-jpg.webp`,
  },
};
