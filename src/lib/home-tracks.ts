/**
 * Homepage "Explore by track" strip and "Find your course" finder (Design v4, Main.dc.html).
 * Pure config + resolvers over the live catalogue: a track whose category is not published is
 * skipped, never linked, and a suggestion whose course is not published falls back to the
 * category page.
 */
import type { SearchIndex } from '@/lib/course-search';
import type { MenuIconKey } from '@/lib/menu-icons';

export interface TrackEntry {
  label: string;
  /** Shorter label for the 3-column mobile grid. */
  short?: string;
  /** CourseCategory.slug the tile links to. */
  category: string;
  icon: MenuIconKey;
}

export const TRACKS: readonly TrackEntry[] = [
  { label: 'Cloud', category: 'cloud-computing', icon: 'cloud' },
  { label: 'DevOps', category: 'devops-multi-cloud', icon: 'devops' },
  { label: 'AI', category: 'artificial-intelligence-training', icon: 'ai' },
  { label: 'Data', category: 'data-analytics-bi', icon: 'data' },
  { label: 'Cyber Security', short: 'Cyber', category: 'cyber-security', icon: 'cyber' },
  { label: 'Full Stack', category: 'programming-full-stack', icon: 'prog' },
  { label: 'Linux', category: 'software-testing-os', icon: 'testing' },
  { label: 'Marketing', category: 'digital-design', icon: 'digital' },
  { label: 'HR', category: 'human-resource', icon: 'hr' },
];

export interface TrackLink {
  label: string;
  short?: string;
  href: string;
  icon: MenuIconKey;
}

export function resolveTracks(index: SearchIndex): TrackLink[] {
  const out: TrackLink[] = [];
  for (const t of TRACKS) {
    if (!index.categories.some((c) => c.slug === t.category)) continue;
    out.push({ label: t.label, short: t.short, href: `/courses/${t.category}`, icon: t.icon });
  }
  return out;
}

/* ── Course finder ───────────────────────────────────────────────────── */

export interface FinderQuestion {
  key: 'background' | 'interest' | 'mode';
  question: string;
  options: readonly string[];
}

export const FINDER_QUESTIONS: readonly FinderQuestion[] = [
  { key: 'background', question: 'What is your background?', options: ['Student / fresher', 'Working in IT', 'Non-IT, switching', 'Returning to work'] },
  { key: 'interest', question: 'What interests you most?', options: ['Cloud & DevOps', 'AI & Data', 'Cyber Security', 'Building apps', 'Marketing or HR'] },
  { key: 'mode', question: 'How would you like to learn?', options: ['Classroom', 'Live online', 'Either'] },
];

/** interest option → course slug (a published course) with its category as the fallback page. */
const INTEREST_COURSE: Record<string, { label: string; slug: string; category: string }> = {
  'Cloud & DevOps': { label: 'AWS DevOps', slug: 'aws-devops-training-institute-in-hyderabad', category: 'devops-multi-cloud' },
  'AI & Data': { label: 'Artificial Intelligence', slug: 'artificial-intelligence-ai-training-hyderabad', category: 'artificial-intelligence-training' },
  'Cyber Security': { label: 'Cyber Security', slug: 'cyber-security-training-institute-in-hyderabad', category: 'cyber-security' },
  'Building apps': { label: 'Python Full Stack', slug: 'full-stack-python-training-in-hyderabad', category: 'programming-full-stack' },
  'Marketing or HR': { label: 'Digital Marketing', slug: 'digital-marketing-training-in-hyderabad', category: 'digital-design' },
};

export interface FinderSuggestion {
  label: string;
  /** Course page when the course is published, else its category page, else null. */
  href: string | null;
}

export function suggestCourse(interest: string | undefined, index: SearchIndex): FinderSuggestion | null {
  const pick = interest ? INTEREST_COURSE[interest] : undefined;
  if (!pick) return null;
  const course = index.courses.find((c) => c.slug === pick.slug);
  if (course) return { label: pick.label, href: course.url };
  if (index.categories.some((c) => c.slug === pick.category)) return { label: pick.label, href: `/courses/${pick.category}` };
  return { label: pick.label, href: null };
}

/** Everything the client component needs, resolved on the server. */
export function finderSuggestions(index: SearchIndex): Record<string, FinderSuggestion> {
  const out: Record<string, FinderSuggestion> = {};
  for (const opt of Object.keys(INTEREST_COURSE)) {
    const s = suggestCourse(opt, index);
    if (s) out[opt] = s;
  }
  return out;
}
