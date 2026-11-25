/* -------------------------------------------------------------------------- */
/*  WhatsApp ref codes. Every WhatsApp link opens with a prefilled message    */
/*  that ends in "(ref W-<COURSE>-<CH>)", so the counsellor sees which course */
/*  and which first-touch channel the chat came from. The code holds no       */
/*  personal data: a course code and one channel letter.                      */
/*                                                                            */
/*  REF_COURSES is the one course map (also used by /brochure/[code] and the  */
/*  admin legend). Dependency-light so it is unit-tested directly            */
/*  (scripts/test/wa-ref.test.mjs).                                           */
/* -------------------------------------------------------------------------- */

import { classifyPageType } from '@/lib/click-tracking';
import { getFirstTouch, type CampaignParams } from '@/lib/first-touch';

/** Course areas, in the confirmed order. */
export const REF_AREAS = [
  'Cloud & DevOps',
  'AI & Data',
  'Linux, Cyber Security, Digital Marketing',
] as const;

export interface RefCourse {
  code: string;
  /** Visible course name used in the message when the page gives no name of its own. */
  label: string;
  area: (typeof REF_AREAS)[number];
  /** Matched against the lower-case course slug / name. */
  match: RegExp;
  /** Shown beside the label in the admin legend when the code covers more than the label says. */
  note?: string;
}

/** The single code map, in the confirmed display order. */
export const REF_COURSES: ReadonlyArray<RefCourse> = [
  { code: 'AWSDEVOPS', label: 'AWS DevOps', area: REF_AREAS[0], match: /aws.{0,20}devops/ },
  { code: 'AZDEVOPS', label: 'Azure DevOps', area: REF_AREAS[0], match: /azure.{0,20}devops/ },
  {
    code: 'GENAI',
    label: 'Generative AI & LLM Engineering',
    area: REF_AREAS[1],
    note: 'also the Artificial Intelligence and AI Foundation courses',
    // generative-ai, genai, llm, agentic, prompt-engineering, and the Artificial Intelligence / AI Foundation courses.
    match: /generative|gen[\s-]?ai\b|\bllm\b|agentic|prompt[\s-]*engineering|artificial[\s-]*intelligence|\bai[\s-]*foundation/,
  },
  { code: 'DS', label: 'Data Science', area: REF_AREAS[1], match: /data[\s-]*science/ },
  { code: 'DA', label: 'Data Analytics', area: REF_AREAS[1], match: /data[\s-]*analy/ },
  { code: 'LINUX', label: 'Linux', area: REF_AREAS[2], match: /linux/ },
  { code: 'CYBER', label: 'Cyber Security', area: REF_AREAS[2], match: /cyber/ },
  { code: 'DM', label: 'Digital Marketing', area: REF_AREAS[2], match: /digital[\s-]*marketing/ },
];

/** Any course that is not in REF_COURSES. */
export const GENERIC_COURSE_CODE = 'GEN';

export type RefChannel = 'G' | 'A' | 'P' | 'S' | 'R' | 'D';

/** Channel letters in legend order. */
export const REF_CHANNELS: ReadonlyArray<{ code: RefChannel; label: string }> = [
  { code: 'G', label: 'Google organic' },
  { code: 'A', label: 'AI assistant' },
  { code: 'P', label: 'Paid' },
  { code: 'S', label: 'Social' },
  { code: 'R', label: 'Other referral' },
  { code: 'D', label: 'Direct' },
];

/** The course entry for a code (case-insensitive), or null. */
export function refCourseByCode(code: string): RefCourse | null {
  const c = code.trim().toUpperCase();
  return REF_COURSES.find((r) => r.code === c) ?? null;
}

/** The course entry matching any of the given slugs / names, or null. */
export function refCourseFor(...texts: Array<string | null | undefined>): RefCourse | null {
  const hay = texts.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return null;
  return REF_COURSES.find((r) => r.match.test(hay)) ?? null;
}

/* ------------------------------ channel ---------------------------------- */

const AI_HOSTS = ['chatgpt.com', 'chat.openai.com', 'claude.ai', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'copilot.com'];
const AI_SOURCE = /chatgpt|openai|claude|perplexity|gemini|copilot/;
const SOCIAL_HOSTS = [
  'facebook.com', 'instagram.com', 'linkedin.com', 'lnkd.in', 'youtube.com', 'youtu.be',
  't.co', 'twitter.com', 'x.com', 't.me', 'reddit.com', 'pinterest.com',
];
const SOCIAL_SOURCE = /facebook|instagram|linkedin|youtube|twitter|^x$|telegram|reddit|pinterest|^fb$|^ig$/;
const PAID_MEDIUM = /^(cpc|ppc|paid.*)$/;

function hostIs(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function hostOf(referrer: string | null | undefined): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).host.toLowerCase();
  } catch {
    return '';
  }
}

/** First-touch channel: P paid, A AI assistant, G Google organic, S social, R other referral, D direct. */
export function channelFromTouch(
  touch: (Pick<CampaignParams, 'utmSource' | 'utmMedium' | 'gclid' | 'fbclid'> & { referrer?: string | null }) | null | undefined,
  ownHost?: string,
): RefChannel {
  if (!touch) return 'D';
  const medium = (touch.utmMedium ?? '').trim().toLowerCase();
  const source = (touch.utmSource ?? '').trim().toLowerCase();
  let host = hostOf(touch.referrer);
  if (host && ownHost && host === ownHost.toLowerCase()) host = '';

  if (touch.gclid || PAID_MEDIUM.test(medium)) return 'P';
  if (AI_HOSTS.some((d) => hostIs(host, d)) || (source && AI_SOURCE.test(source))) return 'A';
  if (/(^|\.)google\.[a-z.]+$/.test(host) || (source === 'google' && (medium === '' || medium === 'organic'))) return 'G';
  if (touch.fbclid || SOCIAL_HOSTS.some((d) => hostIs(host, d)) || (source && SOCIAL_SOURCE.test(source))) return 'S';
  if (host || source) return 'R';
  return 'D';
}

/* ------------------------------ message ---------------------------------- */

export function refCode(courseCode: string | null | undefined, channel: RefChannel): string {
  return `W-${courseCode || GENERIC_COURSE_CODE}-${channel}`;
}

export interface WaRefContext {
  pathname?: string | null;
  /** Visible course name, when the link or the course page being viewed knows it. Always what the text names. */
  courseName?: string | null;
  courseSlug?: string | null;
  channel: RefChannel;
}

/**
 * The prefilled text: course form when a course name is known, else the general form.
 * The name is only ever a real one (the link's own, or the course page's, see lib/page-course);
 * the course code may also come from the path of a course page, so a code is never lost.
 */
export function buildWaText(ctx: WaRefContext): string {
  const path = ctx.pathname ?? '';
  const onCoursePage = path !== '' && classifyPageType(path) === 'course';
  const lastSegment = onCoursePage ? path.split('/').filter(Boolean).pop() : undefined;
  const entry = refCourseFor(ctx.courseSlug, ctx.courseName) ?? refCourseFor(lastSegment);
  const name = ctx.courseName?.trim() || null;
  const code = refCode(entry?.code, ctx.channel);
  return name
    ? `Hi, I'd like fees and next batch dates for ${name} (ref ${code})`
    : `Hi, I'd like to know about courses and batches (ref ${code})`;
}

const REF_IN_TEXT = /\(ref (W-[A-Z]+)-[A-Z]\)/;
const GENERAL_TEXT = /^Hi, I'd like to know about courses and batches/;

/** True for the general text (no course named). */
export function isGeneralWaText(text: string): boolean {
  return GENERAL_TEXT.test(text);
}

/** The same text with its channel letter replaced (server-rendered links start as D). */
export function swapRefChannel(text: string, channel: RefChannel): string {
  return text.replace(REF_IN_TEXT, `(ref $1-${channel})`);
}

/**
 * A wa.me href carrying the standard text for `ctx`. Existing standard text keeps the course it
 * names and only gets the channel; the one exception is the general text, which becomes the course
 * form when `ctx` names a course (a course page's site-wide links).
 */
export function waHrefWithRef(href: string, ctx: WaRefContext): string {
  const q = href.indexOf('?');
  const base = q === -1 ? href : href.slice(0, q);
  let text: string | null = null;
  if (q !== -1) {
    try {
      text = new URLSearchParams(href.slice(q + 1)).get('text');
    } catch {
      text = null;
    }
  }
  const hasRef = !!text && REF_IN_TEXT.test(text);
  const namesCourse = !!ctx.courseName?.trim();
  const out = hasRef && !(namesCourse && isGeneralWaText(text as string)) ? swapRefChannel(text as string, ctx.channel) : buildWaText(ctx);
  return `${base}?text=${encodeURIComponent(out)}`;
}

/** True for a link that opens a WhatsApp chat. */
export function isWaHref(href: string | null | undefined): boolean {
  return !!href && /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href);
}

/* ------------------------------ browser ---------------------------------- */

/** This visitor's first-touch channel (browser only; falls back to the current visit). */
export function currentRefChannel(): RefChannel {
  try {
    const first = getFirstTouch();
    if (first) return channelFromTouch(first, window.location.host);
    const p = new URLSearchParams(window.location.search);
    return channelFromTouch({
      utmSource: p.get('utm_source') ?? undefined,
      utmMedium: p.get('utm_medium') ?? undefined,
      gclid: p.get('gclid') ?? undefined,
      fbclid: p.get('fbclid') ?? undefined,
      referrer: document.referrer || null,
    }, window.location.host);
  } catch {
    return 'D';
  }
}
