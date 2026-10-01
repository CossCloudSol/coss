/**
 * Generated course banners (src/app/course-banner/[slug]/route.tsx) for
 * courses without an admin thumbnail. Shared by the route, the search index
 * and page metadata, so no server-only imports here.
 *
 * URLs are built (and signed) server-side in course-banner-sign.ts.
 */

export type BannerIcon =
  | 'cloud' | 'infinity' | 'brain' | 'chart' | 'database' | 'shield' | 'code' | 'terminal'
  | 'building' | 'pen' | 'message' | 'users' | 'atom' | 'stethoscope' | 'cap';

interface CategoryStyle {
  /** Accent hue for the glow, pattern, icon and chip border. */
  accent: string;
  icon: BannerIcon;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'cloud-computing': { accent: '#38bdf8', icon: 'cloud' },
  'devops-multi-cloud': { accent: '#2dd4bf', icon: 'infinity' },
  'aws-devops': { accent: '#2dd4bf', icon: 'infinity' },
  'artificial-intelligence-training': { accent: '#a78bfa', icon: 'brain' },
  'data-analytics-bi': { accent: '#fbbf24', icon: 'chart' },
  'data-engineering': { accent: '#60a5fa', icon: 'database' },
  'cyber-security': { accent: '#34d399', icon: 'shield' },
  'programming-full-stack': { accent: '#f472b6', icon: 'code' },
  'software-testing-os': { accent: '#fb923c', icon: 'terminal' },
  'erp-crm-enterprise-tools': { accent: '#f87171', icon: 'building' },
  'digital-design': { accent: '#e879f9', icon: 'pen' },
  'professional-soft-skills': { accent: '#facc15', icon: 'message' },
  'human-resource': { accent: '#fda4af', icon: 'users' },
  'quantum-computing': { accent: '#c4b5fd', icon: 'atom' },
  'medical-coding': { accent: '#86efac', icon: 'stethoscope' },
};

const DEFAULT_STYLE: CategoryStyle = { accent: '#5ef0c8', icon: 'cap' };

export function categoryStyle(categorySlug: string | null): CategoryStyle {
  return (categorySlug && CATEGORY_STYLES[categorySlug]) || DEFAULT_STYLE;
}

/** "Microsoft Azure Administrator Training" → "Microsoft Azure Administrator". */
export function shortCourseTitle(title: string): string {
  const short = title
    .trim()
    .replace(/\s*\(\s*[A-Z]{1,6}\s*\)\s*/g, ' ') // "(AI)"
    .replace(/\s+(training|course|program(me)?)(\s+in\s+hyderabad)?$/i, '')
    .replace(/\s+in\s+hyderabad$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return short || title.trim();
}

/** The square variant of a wide banner URL. */
export function squareBannerPath(widePath: string): string {
  return widePath.includes('?') ? `${widePath}&s=sq` : `${widePath}?s=sq`;
}

export const BANNER_WIDE = { width: 800, height: 400 } as const;
export const BANNER_SQUARE = { width: 256, height: 256 } as const;
