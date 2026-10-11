/**
 * /faculty (Design v4, Faculty.dc.html): the pure helpers the page uses. A trainer's track, honorific,
 * initials and course links are all derived from what the admin stores (Trainer rows); nothing is
 * stored twice. Colour pairs and icons are the menu's, so the page, the menu and the course
 * cards stay one palette.
 */
import type { MenuIconKey } from './menu-icons';
import type { CatalogCourse } from './course-search';

export type TrackKey = 'cloud' | 'ai-data' | 'cyber' | 'linux' | 'marketing' | 'hr' | 'other';

export interface TrackInfo {
  key: TrackKey;
  /** Filter chip label. */
  label: string;
  /** Icon and colour pair come from the menu's (menu-icons.ts), resolved where the page renders. */
  icon: MenuIconKey;
}

export const TRACKS: readonly TrackInfo[] = [
  { key: 'cloud', label: 'Cloud & DevOps', icon: 'devops' },
  { key: 'ai-data', label: 'AI & Data', icon: 'ai' },
  { key: 'cyber', label: 'Cyber Security', icon: 'cyber' },
  { key: 'linux', label: 'Linux', icon: 'testing' },
  { key: 'marketing', label: 'Marketing', icon: 'digital' },
  { key: 'hr', label: 'HR & Placements', icon: 'hr' },
  { key: 'other', label: 'More', icon: 'special' },
];

/** The trainer's track, from the admin Category (then the title). First match wins, so order matters. */
export function trackOf(category: string | null | undefined, title: string | null | undefined): TrackKey {
  const text = `${category ?? ''} ${title ?? ''}`.toLowerCase();
  if (/cyber|security|hack/.test(text)) return 'cyber';
  // Cloud before Linux: a multi-cloud trainer who also teaches Linux is a Cloud & DevOps trainer.
  if (/cloud|devops|aws|azure|kubernetes/.test(text)) return 'cloud';
  if (/linux|red\s*hat|rhel/.test(text)) return 'linux';
  if (/\bai\b|artificial|data|analytic|machine|\bml\b/.test(text)) return 'ai-data';
  if (/market|seo|social media/.test(text)) return 'marketing';
  if (/\bhr\b|human|placement|recruit/.test(text)) return 'hr';
  return 'other';
}

const HONORIFIC_RE = /^(mr|mrs|ms|miss|dr|prof)\.?\s+/i;

/** "Mr. Tharun Kumar" -> { honorific: "Mr.", rest: "Tharun Kumar", first: "Tharun" }. The name is shown exactly as stored. */
export function parseName(name: string): { honorific: string | null; rest: string; first: string } {
  const trimmed = name.trim();
  const m = trimmed.match(HONORIFIC_RE);
  const honorific = m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}.` : null;
  const rest = m ? trimmed.slice(m[0].length).trim() : trimmed;
  const words = rest.split(/\s+/).filter(Boolean);
  // "K. Ramesh": an initial is not a first name.
  const first = words.find((w) => w.replace(/\./g, '').length > 1) ?? words[0] ?? rest;
  return { honorific, rest, first };
}

/** Button text: "Demo with Mr. Tharun" (or "Demo with Tharun" when the stored name has no honorific). */
export function demoLabel(name: string): string {
  const { honorific, first } = parseName(name);
  return `Demo with ${honorific ? `${honorific} ` : ''}${first}`;
}

export function initialsOf(name: string): string {
  const parts = parseName(name).rest.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const norm = (s: string): string => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Where a TEACHES chip points: the course page when the name matches a published course (exact
 * title first, then the shortest title that contains it), else the course search for that name.
 */
export function courseLinkFor(label: string, courses: readonly Pick<CatalogCourse, 'title' | 'url'>[]): string {
  const n = norm(label);
  if (n) {
    const exact = courses.find((c) => norm(c.title) === n);
    if (exact) return exact.url;
    const partial = courses.filter((c) => norm(c.title).includes(n)).sort((a, b) => a.title.length - b.title.length)[0];
    if (partial) return partial.url;
  }
  return `/courses?q=${encodeURIComponent(label)}`;
}

/** Trainers whose stored name has no honorific, for the client's list. */
export function withoutHonorific(trainers: readonly { name: string }[]): string[] {
  return trainers.filter((t) => parseName(t.name).honorific === null).map((t) => t.name);
}
