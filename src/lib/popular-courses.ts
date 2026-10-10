import type { CatalogCourse, SearchIndex } from '@/lib/course-search';
import type { MenuIconKey } from '@/lib/menu-icons';

/**
 * The Popular courses list: the menu, the mobile drawer and (Stage 2) the
 * homepage Popular courses read this one list, in this order.
 *
 * Why a config and not the `featured` flag: the DB flag is a plain boolean
 * (24 courses carry it, including duplicates and no Python/Java Full Stack),
 * so it can't give an exact, ordered set of 12.
 *
 * Slugs below are DB course slugs. Where the catalogue holds more than one
 * course for the same name, the one used is live in the sitemap, returns 200
 * with a self-referencing canonical and is not a redirect source or noindex
 * (checked 11 Oct 2026). Re-check when redirects or SLUG_MAP change.
 * `kind: 'category'` is a category page, for an entry that is a whole track.
 */
export interface PopularEntry {
  label: string;
  kind: 'course' | 'category';
  slug: string;
  icon: MenuIconKey;
  /** Topic chips shown on the card (plain text, not links). */
  chips?: readonly string[];
}

export const POPULAR_COURSES: readonly PopularEntry[] = [
  { label: 'Artificial Intelligence', kind: 'course', slug: 'artificial-intelligence-ai-training-hyderabad', icon: 'ai', chips: ['Generative AI', 'Agentic AI', 'Prompt Engineering'] },
  { label: 'AWS DevOps', kind: 'course', slug: 'aws-devops-training-institute-in-hyderabad', icon: 'devops' },
  { label: 'Azure DevOps', kind: 'course', slug: 'azure-devops-training-in-hyderabad', icon: 'devops' },
  { label: 'Linux', kind: 'course', slug: 'linux-shell-scripting-training-in-hyderabad', icon: 'testing' },
  { label: 'Data Science', kind: 'course', slug: 'data-science-training-institute-in-hyderabad', icon: 'data' },
  { label: 'Data Analytics', kind: 'course', slug: 'data-analytics-training-institute-in-hyderabad', icon: 'data' },
  { label: 'Cyber Security', kind: 'course', slug: 'cyber-security-training-institute-in-hyderabad', icon: 'cyber' },
  { label: 'Ethical Hacking', kind: 'course', slug: 'ethical-hacking-cyber-security-professional', icon: 'hack' },
  { label: 'Digital Marketing', kind: 'course', slug: 'digital-marketing-training-in-hyderabad', icon: 'digital' },
  { label: 'HR (Human Resource)', kind: 'category', slug: 'human-resource', icon: 'hr' },
  { label: 'Python Full Stack', kind: 'course', slug: 'full-stack-python-training-in-hyderabad', icon: 'prog' },
  { label: 'Java Full Stack', kind: 'course', slug: 'full-stack-java-developer-training-in-hyderabad', icon: 'prog' },
];

export interface PopularItem {
  label: string;
  href: string;
  icon: MenuIconKey;
  /** Track line: the category name. Empty when the card shows chips instead. */
  track: string;
  chips: readonly string[];
  /** ISO start date of the next live batch, or null (then no batch chip). */
  nextBatch: string | null;
  /** Slug of the course (null for a category entry). */
  courseSlug: string | null;
}

export interface PopularResolved {
  items: PopularItem[];
  /** Config entries with no published course/category: reported, never rendered. */
  unmatched: PopularEntry[];
}

/** Resolves the config against the live catalogue. A slug that isn't published is skipped. */
export function resolvePopular(index: SearchIndex): PopularResolved {
  const items: PopularItem[] = [];
  const unmatched: PopularEntry[] = [];
  for (const entry of POPULAR_COURSES) {
    if (entry.kind === 'category') {
      const cat = index.categories.find((c) => c.slug === entry.slug);
      if (!cat) {
        unmatched.push(entry);
        continue;
      }
      items.push({ label: entry.label, href: `/courses/${cat.slug}`, icon: entry.icon, track: cat.name, chips: entry.chips ?? [], nextBatch: null, courseSlug: null });
      continue;
    }
    const course: CatalogCourse | undefined = index.courses.find((c) => c.slug === entry.slug);
    if (!course) {
      unmatched.push(entry);
      continue;
    }
    items.push({
      label: entry.label,
      href: course.url,
      icon: entry.icon,
      track: entry.chips?.length ? '' : course.category,
      chips: entry.chips ?? [],
      nextBatch: course.nextBatch,
      courseSlug: course.slug,
    });
  }
  return { items, unmatched };
}
