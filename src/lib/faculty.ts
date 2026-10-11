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

/** A course title without "(AI)", "Training", "Course", "in Hyderabad" etc., so "Artificial Intelligence (AI) Course" matches "Artificial Intelligence". */
function coreTitle(title: string): string {
  return norm(title.replace(/\([^)]*\)/g, ' '))
    .replace(/\b(in hyderabad|institute|training|course|courses|program|programme|certification)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The published course a TEACHES chip names, or null. Exact match on the course's core title only:
 * a chip that is not a published course is a plain chip (no link, no arrow).
 */
export function matchCourse<T extends { title: string; url: string }>(label: string, courses: readonly T[]): T | null {
  const n = norm(label);
  if (!n) return null;
  return courses.find((c) => coreTitle(c.title) === n) ?? null;
}

/* ── TEACHES text ─────────────────────────────────────────────────────── */

/** Words that are padding in a list, not a topic. */
const FILLER = new Set(['etc', 'more', 'others', 'other', 'also', 'various', 'similar', 'and', 'or', 'tools', 'topics', 'skills', 'many', 'much']);
/** A chip is a short topic. Anything longer, with sentence punctuation or a sentence verb up front, is prose. */
const MAX_CHIP_WORDS = 10;
const MAX_CHIP_CHARS = 70;
const SENTENCE_START = /^(teaches|teach|covers|cover|provides|provide|introduces|includes|include|offers|helps|training includes)\b/i;

const stripMarkdown = (s: string): string => s.replace(/[*#_`]+/g, '').replace(/\s+/g, ' ').trim();

/** 'ok' with the topic, 'skip' for padding, 'prose' when the piece is a sentence fragment. */
function classifyTopic(raw: string): { kind: 'ok'; topic: string } | { kind: 'skip' | 'prose' } {
  let t = stripMarkdown(raw)
    .replace(/^(and|&)\s+/i, '') // "and MLOps" -> "MLOps"
    .replace(/[.\s]+$/g, '') // trailing full stops
    .trim();
  if (!t) return { kind: 'skip' };
  const words = t.split(/\s+/);
  if (words.length === 1 && FILLER.has(t.toLowerCase())) return { kind: 'skip' };
  if (words.length > MAX_CHIP_WORDS || t.length > MAX_CHIP_CHARS) return { kind: 'prose' };
  if (/[.!?]\s|:/.test(t) || SENTENCE_START.test(t)) return { kind: 'prose' };
  return { kind: 'ok', topic: t };
}

export interface TeachesParsed {
  /** Short topic names, de-duplicated, in the admin's order. */
  topics: string[];
  /** The "Teaching Approach" text (a short paragraph), or null. */
  approach: string | null;
}

/**
 * The admin's Teaches field is prose: "Teaches: A, B, and C.  Teaching Approach: Hands-on ...".
 * Drops the leading "Teaches:" label, splits off everything from "Teaching Approach:" as a
 * paragraph (never chips), then splits the rest on commas and semicolons into short topics.
 */
export function parseTeaches(raw: string | null | undefined): TeachesParsed {
  if (!raw || !raw.trim()) return { topics: [], approach: null };
  const marker = raw.search(/\**\s*teaching\s+approach\s*\**\s*:?\s*\**/i);
  const listPart = marker === -1 ? raw : raw.slice(0, marker);
  let approachPart = marker === -1 ? '' : raw.slice(marker).replace(/^\**\s*teaching\s+approach\s*\**\s*:?\s*\**/i, '');
  approachPart = stripMarkdown(approachPart);

  const list = stripMarkdown(listPart.replace(/^\s*[#*\s]*teaches\s*[#*\s]*:\s*/i, ''));
  const seen = new Set<string>();
  let topics: string[] = [];
  let prose = 0;
  for (const piece of list.split(/[,;\n]/)) {
    const c = classifyTopic(piece);
    if (c.kind === 'prose') prose++;
    if (c.kind !== 'ok') continue;
    const key = c.topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(c.topic);
  }
  // A description (markdown headings or bold, or many sentence fragments) is not a list: its commas
  // would cut sentences into noise ("EC2", "VPC", "S3"), so it gives no chips at all.
  const markdown = /\*\*|^\s*#{1,6}\s/m.test(listPart);
  if (markdown || (prose >= 3 && prose * 4 >= topics.length)) topics = [];
  return { topics, approach: approachPart || null };
}

/** Trainers whose stored name has no honorific, for the client's list. */
export function withoutHonorific(trainers: readonly { name: string }[]): string[] {
  return trainers.filter((t) => parseName(t.name).honorific === null).map((t) => t.name);
}
