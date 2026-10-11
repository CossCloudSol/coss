/**
 * Explore Courses menu: category slug → icon, colour pair, group and blurb.
 * The one place that maps a category to how it looks in the menu (desktop
 * panel and mobile drawer). Icon paths and colours are from the approved
 * design reference (24×24 viewBox, stroke icons).
 */

export type MenuIconKey =
  | 'cloud' | 'devops' | 'data' | 'ai' | 'dataeng' | 'prog' | 'cyber' | 'hack' | 'testing'
  | 'digital' | 'erp' | 'hr' | 'soft' | 'special' | 'popular';

export const MENU_ICON_PATHS: Record<MenuIconKey, string> = {
  cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
  devops: 'M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z',
  data: 'M3 3v18h18M7 16v-4M12 16V8M17 16v-7',
  ai: 'M12 3v3M12 18v3M3 12h3M18 12h3M7 7h10v10H7zM10 10h4v4h-4z',
  dataeng: 'M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3Zm0 0v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3',
  prog: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  cyber: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  hack: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-4',
  testing: 'M4 17l6-6-6-6M12 19h8',
  digital: 'M3 11l18-5v12L3 14v-3ZM11.6 16.8a3 3 0 1 1-5.8-1.6',
  erp: 'M2 7h20v14H2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  hr: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  soft: 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5Z',
  special: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.6-6.2 4.6 2.4-7.4L2 9.4h7.6z',
  popular: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
};

/** [light fill, dark ink]. Text on the light fill is the dark ink (all ≥ 4.5:1). */
export const MENU_ICON_COLORS: Record<MenuIconKey, readonly [string, string]> = {
  cloud: ['#e3f0fb', '#1d5f99'],
  devops: ['#e1f0f2', '#005663'],
  data: ['#e3f0fb', '#1d5f99'],
  ai: ['#efeafb', '#4a3290'],
  dataeng: ['#e2f3ef', '#11695a'],
  prog: ['#fdf0e8', '#a8471a'],
  cyber: ['#fbe9ec', '#8a2236'],
  hack: ['#fbe9ec', '#8a2236'],
  testing: ['#eaeef2', '#334a5c'],
  digital: ['#fdf3dc', '#86570a'],
  erp: ['#e8eefb', '#2f4f9e'],
  hr: ['#f8eaf4', '#8c2f6e'],
  soft: ['#e7f5ec', '#23703f'],
  special: ['#eeeeee', '#474747'],
  popular: ['#fdf0e8', '#b8531c'],
};

export type MenuGroup = 'tech' | 'business';

export const MENU_GROUP_TITLES: Record<MenuGroup, string> = {
  tech: 'Tech courses',
  business: 'Business & career',
};

interface CategoryMenuStyle {
  icon: MenuIconKey;
  group: MenuGroup;
  /** Position in the rail within its group (lower first). */
  order: number;
  blurb: string;
}

/** Keyed by CourseCategory.slug. A category not listed here gets FALLBACK. */
export const CATEGORY_MENU_STYLE: Record<string, CategoryMenuStyle> = {
  'cloud-computing': { icon: 'cloud', group: 'tech', order: 1, blurb: 'AWS, Azure and Google Cloud, from fundamentals to architect level.' },
  'devops-multi-cloud': { icon: 'devops', group: 'tech', order: 2, blurb: 'CI/CD, containers and infrastructure as code on AWS and Azure.' },
  'artificial-intelligence-training': { icon: 'ai', group: 'tech', order: 3, blurb: 'Generative AI, agents and prompt engineering, built hands-on.' },
  'data-analytics-bi': { icon: 'data', group: 'tech', order: 4, blurb: 'Analytics, BI dashboards and machine learning.' },
  'data-engineering': { icon: 'dataeng', group: 'tech', order: 5, blurb: 'Pipelines and big-data processing with Spark and Azure.' },
  'programming-full-stack': { icon: 'prog', group: 'tech', order: 6, blurb: 'Full stack Java, Python and JavaScript development.' },
  'cyber-security': { icon: 'cyber', group: 'tech', order: 7, blurb: 'Ethical hacking, security certifications and networking.' },
  'software-testing-os': { icon: 'testing', group: 'tech', order: 8, blurb: 'Linux administration, plus manual and automation testing.' },
  'quantum-computing': { icon: 'special', group: 'tech', order: 9, blurb: 'An introduction to quantum computing.' },
  'digital-design': { icon: 'digital', group: 'business', order: 1, blurb: 'Digital marketing, SEO, social media and UI/UX design.' },
  'human-resource': { icon: 'hr', group: 'business', order: 2, blurb: 'Recruitment, HR operations and people leadership.' },
  'erp-crm-enterprise-tools': { icon: 'erp', group: 'business', order: 3, blurb: 'Salesforce, SAP FICO and Tally for business roles.' },
  'professional-soft-skills': { icon: 'soft', group: 'business', order: 4, blurb: 'Spoken English, interviews and workplace skills.' },
  'medical-coding': { icon: 'special', group: 'business', order: 5, blurb: 'Medical coding certification training.' },
};

export const FALLBACK_CATEGORY_STYLE: CategoryMenuStyle = { icon: 'special', group: 'business', order: 99, blurb: '' };

export function categoryMenuStyle(slug: string | null | undefined): CategoryMenuStyle {
  return (slug && CATEGORY_MENU_STYLE[slug]) || FALLBACK_CATEGORY_STYLE;
}
