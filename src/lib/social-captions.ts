/**
 * Per-channel captions and rules for social posts (LinkedIn, Facebook,
 * Instagram via Buffer). Pure and dependency-free: the admin form (live
 * previews and counters), the approve endpoint and the cron all use it, and
 * `node --test` imports it directly (scripts/test/social-captions.test.mjs).
 *
 *   LinkedIn  : the post text as written; its own image OR link (Buffer
 *               allows one), the link gets UTM tags.
 *   Facebook  : link post to the course page (or the post's link) with UTM
 *               tags; Facebook shows the page's og:image (the course banner).
 *   Instagram : must have an image (the course's portrait banner, or the
 *               post's image); no clickable links, so URLs are removed from
 *               the caption, which ends "Link in bio / DM us" + up to 10 hashtags.
 */

export type SocialChannel = 'linkedin' | 'facebook' | 'instagram';
export const SOCIAL_CHANNELS: readonly SocialChannel[] = ['linkedin', 'facebook', 'instagram'];
export const CHANNEL_LABEL: Record<SocialChannel, string> = { linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram' };

/** Caption length limits per network. */
export const CAPTION_LIMIT: Record<SocialChannel, number> = { linkedin: 3000, facebook: 63206, instagram: 2200 };
export const IG_MAX_HASHTAGS = 10;
export const IG_CTA = 'Link in bio / DM us';
export const HOOK_MAX = 80;

const SITE_HOST = /(^|\.)cosscloudsol\.com$/i;

export function parseChannels(raw: string | null | undefined): SocialChannel[] {
  const set = new Set((raw ?? '').split(',').map((c) => c.trim().toLowerCase()));
  return SOCIAL_CHANNELS.filter((c) => set.has(c));
}

/** "#AWS, devops  #DevOps cloud-computing" → ["#AWS", "#devops", "#cloudcomputing"] (deduped, case-insensitive). */
export function normalizeHashtags(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of (raw ?? '').split(/[\s,]+/)) {
    const word = part.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
    if (!word || seen.has(word.toLowerCase())) continue;
    seen.add(word.toLowerCase());
    tags.push(`#${word}`);
  }
  return tags;
}

/**
 * Adds utm_source/utm_medium=social/utm_campaign to links on our own site
 * (other sites' links are returned unchanged). Existing UTM values are replaced.
 */
export function withUtm(url: string, source: SocialChannel, campaign: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (!SITE_HOST.test(u.hostname)) return url;
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}

/** utm_campaign: the course slug, else the link's last path segment, else "social". */
export function utmCampaign(courseSlug: string | null | undefined, linkUrl?: string | null): string {
  if (courseSlug) return courseSlug;
  try {
    const last = new URL(linkUrl ?? '').pathname.split('/').filter(Boolean).pop();
    if (last) return last.toLowerCase();
  } catch {
    // not a URL
  }
  return 'social';
}

// Stops at ")" / "]" so "(link: https://…)" leaves "()" to tidy up.
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s)\]]+/gi;

/**
 * A label that only introduces the link right after it ("Details:", "Link:",
 * "Visit:", "Register here:", "Book a free demo class:", "👉"), possibly on
 * the line above. Removed with the link so the caption doesn't end mid-thought.
 */
const LABEL = String.raw`(?:more\s+)?(?:details|info(?:rmation)?|link|links|visit(?:\s+us)?|website|url|register|registration|apply|enrol{1,2}|enrolment|enrollment|sign\s*up|learn\s+more|read\s+more|know\s+more|click\s+here|check\s+it\s+out|syllabus|brochure|book(?:\s+(?:your\s+seat|a\s+(?:free\s+)?demo(?:\s+class)?|now))?)(?:\s+(?:here|now|today|at|on|below))*`;
const BEFORE_LINK = String.raw`\s*(?=(?:https?:\/\/|www\.))`;
// A label word is only dropped when it plainly introduces the link: it ends
// in ":" / "-" / "→", or starts its line, or is an arrow emoji. "We share the
// syllabus https://…" keeps "syllabus".
const LINK_LABEL_RE = new RegExp(
  String.raw`(?:\b${LABEL}\s*[:\-–—→]+|^[ \t]*${LABEL}|[👉➡→⬇👇]️?)${BEFORE_LINK}`,
  'gimu',
);

/** Removes URLs (Instagram captions can't link), their dangling labels, and the whitespace left behind. */
export function stripLinks(text: string): string {
  return text
    .replace(LINK_LABEL_RE, '')
    // A link alone on its line goes with its line break.
    .replace(/^[ \t]*(?:https?:\/\/|www\.)\S+[ \t]*(?:\n|$)/gim, '')
    .replace(URL_RE, '')
    .replace(/\(\s*\)|\[\s*\]/g, '')
    .replace(/[ \t]+([.,;!?])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildCaption(channel: SocialChannel, post: { content: string; hashtags?: string | null }): string {
  const text = post.content.trim();
  if (channel !== 'instagram') return text;
  const tags = normalizeHashtags(post.hashtags).slice(0, IG_MAX_HASHTAGS);
  return [stripLinks(text), IG_CTA, tags.join(' ')].filter(Boolean).join('\n\n');
}

// ── Claims ───────────────────────────────────────────────────────────────
// Only these may appear (CCPA): since 2010, 5,000+ students trained,
// 50+ hiring partners, 1-year LMS access. They're removed before the checks
// below, so any number/claim left over is not an approved one.
const APPROVED_CLAIMS = [
  /\bsince\s+2010\b/gi,
  /\b5,?000\+\s*students\s+trained\b/gi,
  /\btrained\s+5,?000\+\s*students\b/gi,
  /\b5,?000\+\s*students\s+who\s+(?:have\s+)?trained\b/gi,
  /\b50\+\s*hiring\s+partners\b/gi,
  /\b1[-\s]year\s+LMS\s+access\b/gi,
  // Disclaimers say the opposite of a claim: "Placement is not guaranteed."
  // Facts that aren't claims: "Fortune 500 companies", "Maximum 20 students per batch".
  /\bfortune\s+500\b/gi,
  /\bREST\s+Assured\b/g, // the API-testing library
  /\b\d+\s*[–-]\s*\d+\s+students\b/gi, // batch-size ranges ("10–20 students")
  // A learner's experience, not ours: "with 2–3 years of experience you can…".
  /\b(?:with|have|having|need|needs|requires?|required)\s+[1-9]\d*(?:\s*[–-]\s*\d+)?\+?\s*years?\s+of\s+experience\b/gi,
  /\b(?:max(?:imum)?|up\s+to|only)\s+\d+\s+students\s+(?:per|in\s+(?:a|each))\s+batch\b/gi,
  // Data-security disclaimer (privacy policy): "No method of transmitting or storing data can be guaranteed …".
  /\bno\s+method\s+of\s+[^.]{0,80}?\bcan\s+be\s+guaranteed\b/gi,
  /\b(?:is|are)\s+not\s+guaranteed\b|\bno\s+(?:job\s+|placement\s+)?guarantees?\b|\b(?:do|does|can|will)(?:\s+not|n['’]t)\s+(?:\w+\s+)?guarantee\b|\bnot\s+(?!only\b|just\b)(?:\w+\s+){0,3}?guarantees?\b|\bcannot\s+guarantee\b|\bwithout\s+(?:any\s+)?guarantees?\b/gi,
];

const BANNED: Array<[RegExp, string]> = [
  [/guarant/i, 'no guarantees (e.g. "placement guaranteed", "job guarantee")'],
  [/\bassured\b/i, 'no "assured" placement or job claims'],
  // No \b: hashtags run words together ("#100percentplacement").
  [/\d\s*%|per\s*cent/i, 'no percentages'],
  [/\b(?:ranked|ranks?|ranking)\s+(?:as\s+|among\s+(?:the\s+)?)?(?:#|no\.?\s*\d|number\b|first\b|1st\b|top\b|best\b|highest\b|the\s+(?:best|top)\b)|#\s*1\b|\bno\.?\s*1\b|\bnumber\s+one\b|\btop[-\s]?(rated|ranked)\b|\bbest\s+(institute|training|course|in\b)|\b(leading|largest)\s+(institute|training)/i, 'no rankings ("#1", "best institute", "top-rated")'],
  [/life\s*-?\s*time/i,'no "lifetime" (LMS access is 1 year)'],
  [/\bsince\s+(19|20)\d{2}\b/i, 'the only founding year allowed is "since 2010"'],
  // [1-9]: not step numbers like "03 Placement Support".
  [/\b[1-9](?:[\d,.]*\d)?\s*(\+|k\b)?\s*(students?|learners?|alumni|graduates|placements|placed|hires|hiring\s+partners?|partners?|companies|recruiters?|years?\s+of\s+(experience|excellence|training|trust))\b/i, 'numbers other than "5,000+ students trained" and "50+ hiring partners"'],
  // Reworded headcounts ("5,000+ employees trained"); a verb makes it a claim, so
  // a form's team-size options ("1–5 employees", "50+ employees") are not.
  [/\b[1-9](?:[\d,.]*\d)?\s*(\+|k\b)?\s*(employees|professionals)\s+(trained|upskilled|taught|certified|placed|skilled)\b/i, 'numbers other than "5,000+ students trained" and "50+ hiring partners"'],
  // The institute's own experience: "our 15+ years of experience".
  [/\bour\s+[1-9]\d*\+?\s*(?:\w+\s+)?years?\b/i, 'no years-of-experience claims (only "since 2010")'],
  // "Best IT training institute", "a leading IT training institute", "Best SAP FICO Training",
  // "Best SQL/MySQL/PostgreSQL Training", "the best programming and full stack development training".
  [/\b(best|leading|premier|largest|top|no\.?\s*1)\s+(?!practices?\b)(?:[\w&/.+-]+\s+){0,5}?(institutes?|academy|academies|training|courses?|classes|coaching)\b/i, 'no rankings ("best/leading/top … institute/training")'],
  [/\bhigh[-\s]?pay(ing|ed)?\b|\bhigh[-\s]salar(y|ies|ied)\b/i, 'no salary claims ("high-paying")'],
  [/\bland(s|ing)?\s+(?:[\w-]+\s+){0,4}?(jobs?|roles?|positions?|offers?)\b/i, 'no job-outcome claims ("land … jobs")'],
  [/\bget(s|ting)?\s+placed\b/i, 'no job-outcome claims ("get placed")'],
  [/\bplacement\s+(rates?|records?|percentages?|ratios?|statistics|stats)\b/i, 'no placement rates or records'],
  [/\bpass(ing)?\s+rates?\b/i, 'no pass rates'],
  [/\b(top|leading)\s+(?:[\w-]+\s+){0,2}?(companies|mncs?|firms|recruiters|employers|brands)\b/i, 'no "top/leading companies" claims'],
  // About the institute only: "Hyderabad's most trusted IT training institute". "One of the most
  // trusted accounting software" describes the software, so the rule needs an institute/training noun.
  [/\bmost\s+trusted\s+(?:[\w&/.+-]+\s+){0,4}?(institutes?|institutions?|academy|academies|training|courses?|classes|coaching|centres?|centers?|providers?|names?|brands?)\b/i, 'no rankings ("most trusted … institute")'],
  // Job outcomes: "for top IT jobs", "secure top cybersecurity roles". Not careers: "the top IT career move" is advice.
  [/\btop\s+(?:[\w/.+-]+\s+){0,2}?(jobs?|roles?|positions?)\b/i, 'no job-outcome claims ("top jobs")'],
];

// Every rule as a global regex: every occurrence is reported, not just the first.
const BANNED_ALL: ReadonlyArray<readonly [RegExp, string]> = BANNED.map(([re, why]) => [new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`), why] as const);

/**
 * Every banned claim in the text: all rules, all occurrences, in text order
 * (empty when it's fine). One phrase can match more than one rule, e.g.
 * "Land high-paying jobs" is both a salary and a job-outcome claim.
 */
export function findClaimMatches(text: string | null | undefined): Array<{ phrase: string; why: string; index: number }> {
  // Approved claims and disclaimers are blanked with spaces of the same length,
  // so the reported index points into the original text.
  let rest = text ?? '';
  for (const re of APPROVED_CLAIMS) rest = rest.replace(re, (m) => ' '.repeat(m.length));
  const out: Array<{ phrase: string; why: string; index: number }> = [];
  for (const [re, why] of BANNED_ALL) {
    for (const m of rest.matchAll(re)) {
      const phrase = m[0].trim();
      if (phrase) out.push({ phrase, why, index: m.index ?? 0 });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Reasons the text breaks the allowed-claims rule (empty when it's fine), each once. */
export function findClaimViolations(text: string | null | undefined): string[] {
  return [...new Set(findClaimMatches(text).map((m) => m.why))];
}

// ── Channel rules ────────────────────────────────────────────────────────
export type SocialPostDraft = {
  content: string;
  channels: SocialChannel[];
  /** A course is linked: Facebook links to its page, Instagram uses its portrait banner. */
  hasCourse: boolean;
  hook?: string | null;
  hashtags?: string | null;
  imageUrl?: string | null;
  imageAltText?: string | null;
  linkUrl?: string | null;
};

export type RuleReport = { general: string[]; channels: Record<SocialChannel, string[]> };

export function checkPost(post: SocialPostDraft): RuleReport {
  const general: string[] = [];
  const channels: Record<SocialChannel, string[]> = { linkedin: [], facebook: [], instagram: [] };
  const on = new Set(post.channels);

  if (!post.content.trim()) general.push('Post text is required.');
  if (on.size === 0) general.push('Select at least one channel.');
  for (const [field, value] of [['Post text', post.content], ['Hook', post.hook], ['Hashtags', post.hashtags], ['Alt text', post.imageAltText]] as const) {
    for (const why of findClaimViolations(value)) general.push(`${field}: ${why}.`);
  }

  if (on.has('linkedin')) {
    if (post.imageUrl && post.linkUrl) channels.linkedin.push('An image and a link can’t both be set (Buffer allows one).');
    if (post.imageUrl && !post.imageAltText?.trim()) channels.linkedin.push('Alt text is required when an image is set.');
  }

  if (on.has('facebook') && !post.hasCourse && !post.linkUrl) {
    channels.facebook.push('Choose a course (or set a link): Facebook posts link to the course page.');
  }

  if (on.has('instagram')) {
    if (post.hasCourse) {
      const hook = post.hook?.trim() ?? '';
      if (!hook) channels.instagram.push('Add a hook line for the Instagram image.');
      else if (hook.length > HOOK_MAX) channels.instagram.push(`Hook line is ${hook.length} characters; keep it to ${HOOK_MAX}.`);
    } else if (!post.imageUrl) {
      channels.instagram.push('Instagram needs an image: choose a course (portrait banner) or set an image.');
    } else if (!post.imageAltText?.trim()) {
      channels.instagram.push('Alt text is required when an image is set.');
    }
    const tags = normalizeHashtags(post.hashtags);
    if (tags.length > IG_MAX_HASHTAGS) channels.instagram.push(`${tags.length} hashtags; Instagram posts here use at most ${IG_MAX_HASHTAGS}.`);
  }

  for (const c of SOCIAL_CHANNELS) {
    if (!on.has(c)) continue;
    const length = buildCaption(c, post).length;
    if (length > CAPTION_LIMIT[c]) channels[c].push(`Caption is ${length.toLocaleString('en-IN')} characters; the ${CHANNEL_LABEL[c]} limit is ${CAPTION_LIMIT[c].toLocaleString('en-IN')}.`);
  }

  return { general, channels };
}

export function ruleErrors(report: RuleReport): string[] {
  return [...report.general, ...SOCIAL_CHANNELS.flatMap((c) => report.channels[c].map((e) => `${CHANNEL_LABEL[c]}: ${e}`))];
}

// ── What gets sent ───────────────────────────────────────────────────────
/** Course-derived inputs, resolved server-side (lib/social-post-course). */
export type ChannelContext = {
  courseSlug?: string | null;
  courseTitle?: string | null;
  /** Absolute course page URL (no UTM yet). */
  courseUrl?: string | null;
  /** Absolute URL of the course's Instagram portrait banner. */
  igImageUrl?: string | null;
};

export type ChannelPayload = { text: string; imageUrl?: string; imageAltText?: string; linkUrl?: string };

/** The Buffer post for one channel: caption plus its image or link. */
export function channelPayload(channel: SocialChannel, post: SocialPostDraft, ctx: ChannelContext = {}): ChannelPayload {
  const text = buildCaption(channel, post);
  if (channel === 'instagram') {
    if (ctx.igImageUrl) {
      const hook = post.hook?.trim();
      return { text, imageUrl: ctx.igImageUrl, imageAltText: `${ctx.courseTitle ?? 'Course'} at Coss Cloud Solutions${hook ? `: ${hook}` : ''}` };
    }
    return { text, imageUrl: post.imageUrl ?? undefined, imageAltText: post.imageAltText ?? undefined };
  }
  if (channel === 'facebook') {
    const link = ctx.courseUrl ?? post.linkUrl ?? null;
    return { text, ...(link ? { linkUrl: withUtm(link, 'facebook', utmCampaign(ctx.courseSlug, link)) } : {}) };
  }
  // LinkedIn: as before, plus UTM tags on the link.
  return {
    text,
    ...(post.imageUrl ? { imageUrl: post.imageUrl, imageAltText: post.imageAltText ?? undefined } : {}),
    ...(post.linkUrl ? { linkUrl: withUtm(post.linkUrl, 'linkedin', utmCampaign(ctx.courseSlug, post.linkUrl)) } : {}),
  };
}

/**
 * JPEG delivery URL for an image in our Cloudinary library: Instagram only
 * takes JPEG, and Buffer passes the file through. f_jpg + a .jpg extension
 * (the format Cloudinary serves), q_auto, and at most 1080px wide.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryJpegUrl(url: string): string {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+?)(?:\.[a-z0-9]+)?$/i);
  if (!m) return url;
  const rest = m[2].replace(/^(?:[a-z]_[^/]*\/)+(?=v\d+\/|[^/]+\/)/i, ''); // drop existing transformations
  return `${m[1]}f_jpg,q_auto,c_limit,w_1080/${rest}.jpg`;
}
