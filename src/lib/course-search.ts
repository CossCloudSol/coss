/**
 * Course catalogue search, shared by the header search (client), the
 * /courses explorer (client) and the index builder (server). No server-only
 * imports here.
 *
 * Matching forgives spelling mistakes (Damerau-Levenshtein per word) and
 * understands short forms (aws, ml, ai, ceh, hacking, fullstack, k8s, …).
 * Every word of the query has to match something in the course.
 */

/** One published course as the search index and the /courses grid see it. */
export interface CatalogCourse {
  id: string;
  title: string;
  url: string;
  category: string;
  categorySlug: string | null;
  /** Tab on /courses (COURSE_TABS id, or "more"). */
  tab: string;
  /** Tools and other search-only words, lower case. */
  keywords: string[];
  duration: string;
  /** Duration in months, parsed from `duration`; null when it can't be read (e.g. "45 Hours"). */
  months: number | null;
  level: string;
  mode: string;
  /** Filter keys: "online", "dilsukhnagar", "ameerpet". */
  modes: string[];
  /** Earliest upcoming batch start (ISO date), if any. */
  nextBatch: string | null;
  featured: boolean;
  /** Admin sort order within the catalogue (lower first). */
  rank: number;
  /** Cloudinary thumbnail next/image can optimise, else null. */
  thumbnail: string | null;
  /** Admin badge, with placement/ranking claims removed. */
  badge: string | null;
  /** Brochure PDF or a WhatsApp syllabus request. */
  syllabusHref: string;
}

export interface CatalogCategory {
  slug: string;
  name: string;
  count: number;
}

export interface SearchIndex {
  courses: CatalogCourse[];
  categories: CatalogCategory[];
}

/** Query parameters that make /courses a filtered view (noindex, follow via the middleware). */
export const COURSE_FILTER_PARAMS = ['q', 'cat', 'mode', 'dur', 'level', 'batch', 'sort'] as const;

/** Category tabs on /courses; categories not listed fall under "more". */
export const COURSE_TABS = [
  { id: 'cloud-devops', label: 'Cloud & DevOps', slugs: ['cloud-computing', 'devops-multi-cloud', 'aws-devops'] },
  { id: 'ai-data', label: 'AI & Data', slugs: ['artificial-intelligence-training', 'data-analytics-bi', 'data-engineering', 'quantum-computing'] },
  { id: 'cyber-security', label: 'Cyber Security', slugs: ['cyber-security'] },
  { id: 'full-stack', label: 'Full Stack', slugs: ['programming-full-stack'] },
  { id: 'testing-os', label: 'Testing & OS', slugs: ['software-testing-os'] },
  { id: 'business', label: 'Business & HR', slugs: ['erp-crm-enterprise-tools', 'human-resource', 'medical-coding'] },
  { id: 'design-skills', label: 'Design & Skills', slugs: ['digital-design', 'professional-soft-skills'] },
] as const;

export const MORE_TAB = { id: 'more', label: 'More' } as const;

export function tabForCategory(slug: string | null): string {
  if (!slug) return MORE_TAB.id;
  return COURSE_TABS.find((t) => (t.slugs as readonly string[]).includes(slug))?.id ?? MORE_TAB.id;
}

/** "3 Months" → 3, "90 Days" → 3, "4 to 5 Months" → 4.5, "60 Days (Approx. 2.5 Months)" → 2.5. */
export function parseMonths(duration: string): number | null {
  const s = duration.toLowerCase();
  const approx = s.match(/approx\.?\s*([\d.]+)\s*month/);
  if (approx) return Number(approx[1]);
  const range = s.match(/([\d.]+)\s*(?:to|-|–)\s*([\d.]+)\s*month/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const months = s.match(/([\d.]+)\s*month/);
  if (months) return Number(months[1]);
  const weeks = s.match(/([\d.]+)\s*week/);
  if (weeks) return Math.round((Number(weeks[1]) / 4.3) * 10) / 10;
  const days = s.match(/([\d.]+)\s*day/);
  if (days) return Math.round((Number(days[1]) / 30) * 10) / 10;
  return null;
}

/** Slug words that say nothing about the course ("…-training-institute-in-hyderabad"). */
const SLUG_STOPWORDS = new Set([
  'a', 'and', 'by', 'center', 'centre', 'class', 'classes', 'course', 'courses', 'for', 'hyderabad', 'in', 'institute',
  'me', 'near', 'of', 'online', 'the', 'training', 'with', 'dilsukhnagar', 'ameerpet', 'kukatpally', 'madhapur',
]);

/** Search words from a course slug, without the brand and filler words. */
export function slugKeywords(slug: string): string[] {
  return slug
    .toLowerCase()
    .replace(/coss-cloud-solutions?/g, '')
    .split('-')
    .filter((w) => w && !SLUG_STOPWORDS.has(w));
}

/* ── Matching ─────────────────────────────────────────────────────────── */

/** Short forms and common words → what they mean in course titles. */
const SYNONYMS: Record<string, string[]> = {
  aws: ['aws', 'amazon web services'],
  amazon: ['aws'],
  ml: ['machine learning'],
  ai: ['ai', 'artificial intelligence'],
  genai: ['generative ai', 'artificial intelligence'],
  llm: ['generative ai', 'artificial intelligence'],
  ceh: ['ceh', 'ethical hacking'],
  hacking: ['hacking', 'ethical hacking', 'cyber security'],
  hacker: ['ethical hacking'],
  cybersecurity: ['cyber security'],
  fullstack: ['full stack'],
  k8s: ['kubernetes'],
  kube: ['kubernetes'],
  js: ['javascript'],
  ts: ['typescript'],
  py: ['python'],
  gcp: ['google cloud'],
  bi: ['power bi', 'business intelligence'],
  powerbi: ['power bi'],
  sfdc: ['salesforce'],
  hr: ['hr', 'human resource'],
  qa: ['testing'],
  ds: ['data science'],
  dm: ['digital marketing'],
  seo: ['seo', 'digital marketing'],
  rhce: ['red hat', 'linux'],
  rhcsa: ['red hat', 'linux'],
  ccna: ['ccna', 'networking'],
  mern: ['mern', 'react'],
  dsa: ['data structures'],
  ui: ['ui', 'design'],
  ux: ['ux', 'design'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

/** Damerau-Levenshtein (optimal string alignment), capped: returns max+1 once it can't be ≤ max. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

interface Field {
  words: string[];
  text: string;
  compact: string;
  weight: number;
}

/** How well one query term matches one field (0 = no match). */
function termScore(term: string, field: Field): number {
  if (term.includes(' ')) {
    // Multi-word expansion ("machine learning"): phrase match only.
    return ` ${field.text} `.includes(` ${term} `) ? 10 : field.text.includes(term) ? 7 : 0;
  }
  let best = 0;
  const tol = tolerance(term.length);
  for (const w of field.words) {
    if (w === term) return 10;
    if (term.length >= 2 && w.startsWith(term)) best = Math.max(best, 7);
    else if (tol > 0) {
      if (editDistance(term, w, tol) <= tol) best = Math.max(best, 4);
      else if (w.length > term.length && editDistance(term, w.slice(0, term.length), tol) <= tol) best = Math.max(best, 3);
    }
  }
  // "cybersecurity" in "cyber security", "fullstack" in "full stack"
  if (best < 6 && term.length >= 5 && field.compact.includes(term)) best = 6;
  return best;
}

interface Prepared {
  course: CatalogCourse;
  title: Field;
  rest: Field;
}

const preparedCache = new WeakMap<CatalogCourse[], Prepared[]>();

function prepare(courses: CatalogCourse[]): Prepared[] {
  const hit = preparedCache.get(courses);
  if (hit) return hit;
  const make = (s: string, weight: number): Field => {
    const text = normalize(s);
    return { words: text.split(' ').filter(Boolean), text, compact: text.replace(/ /g, ''), weight };
  };
  const prepared = courses.map((course) => ({
    course,
    title: make(course.title, 2),
    rest: make([course.category, ...course.keywords].join(' '), 1),
  }));
  preparedCache.set(courses, prepared);
  return prepared;
}

/** Query words, each with the terms it can stand for. */
function queryTerms(query: string): string[][] {
  return words(query).map((w) => {
    const bare = w.replace(/[.]+$/, '');
    return Array.from(new Set([bare, ...(SYNONYMS[bare] ?? []).map(normalize)]));
  });
}

export interface SearchHit {
  course: CatalogCourse;
  score: number;
  /** Character range in the title to highlight. */
  highlight: [number, number] | null;
}

function highlightRange(title: string, terms: string[][]): [number, number] | null {
  const lower = title.toLowerCase();
  for (const group of terms) {
    for (const term of group) {
      const at = lower.indexOf(term);
      if (at !== -1 && term.length >= 2) return [at, at + term.length];
    }
  }
  // Fuzzy match: highlight the closest title word.
  for (const group of terms) {
    const term = group[0];
    const tol = tolerance(term.length);
    if (tol === 0) continue;
    const re = /[A-Za-z0-9+#]+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(title)) !== null) {
      const w = m[0].toLowerCase();
      if (editDistance(term, w, tol) <= tol || (w.length > term.length && editDistance(term, w.slice(0, term.length), tol) <= tol)) {
        return [m.index, m.index + m[0].length];
      }
    }
  }
  return null;
}

/** Courses matching every word of the query, best first. An empty query matches nothing. */
export function searchCourses(courses: CatalogCourse[], query: string): SearchHit[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const p of prepare(courses)) {
    let total = 0;
    let matchedAll = true;
    for (const group of terms) {
      let best = 0;
      for (const term of group) {
        best = Math.max(best, termScore(term, p.title) * p.title.weight, termScore(term, p.rest) * p.rest.weight);
      }
      if (best === 0) {
        matchedAll = false;
        break;
      }
      total += best;
    }
    if (matchedAll) hits.push({ course: p.course, score: total + (p.course.featured ? 1 : 0), highlight: highlightRange(p.course.title, terms) });
  }
  return hits.sort((a, b) => b.score - a.score || a.course.rank - b.course.rank || a.course.title.localeCompare(b.course.title));
}

/** Up to `limit` categories with the most matching courses. */
export function topCategories(hits: SearchHit[], categories: CatalogCategory[], limit: number): CatalogCategory[] {
  const counts = new Map<string, number>();
  for (const h of hits) {
    if (h.course.categorySlug) counts.set(h.course.categorySlug, (counts.get(h.course.categorySlug) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => categories.find((c) => c.slug === slug))
    .filter((c): c is CatalogCategory => c != null)
    .slice(0, limit);
}

/** "5 Oct" for a card or suggestion line. */
export function formatNextBatch(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

/* ── Client loader ────────────────────────────────────────────────────── */

export const SEARCH_INDEX_URL = '/api/search-index';

let indexPromise: Promise<SearchIndex> | null = null;

/** Fetches the index once per page load (first search focus); a failed load can be retried. */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    indexPromise = fetch(SEARCH_INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`search index ${r.status}`);
        return r.json() as Promise<SearchIndex>;
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}
