/**
 * src/lib/build-title.ts
 *
 * Single pipeline for every page title on the site. Strips any trailing
 * brand segment (however many times it was double/triple-appended by past
 * admin edits or hardcoded fallbacks) and appends the brand exactly once.
 */

const SEPARATOR = '[|\\-–—]';
// Brand variants: "Coss Cloud Solutions"/"Coss Cloud Solution" (singular),
// "COSS Cloud Solutions/Solution", and standalone "COSS" — all matched
// case-insensitively via the 'i' flag below.
const BRAND = '(?:coss\\s+cloud\\s+solutions?|coss)';
// A trailing brand mention may be introduced by a punctuation separator, a
// bare comma, or a connector word ("...Hyderabad with Coss Cloud
// Solutions", "...by COSS Cloud Solutions").
const CONNECTOR = '(?:with|by|at|from)';
// Read from a regex literal rather than typed inline as `\\b` in a template
// literal — the build pipeline's minifier was found to corrupt a
// template-literal-embedded `\b` word-boundary escape into a literal
// backspace control character in the deployed bundle (see SHORT_BRAND_RE
// below). `.source` on an already-constructed regex literal isn't cooked
// the same way, so it's safe to interpolate.
const WORD_BOUNDARY = /\b/.source;
const TRAILING_PREFIX = `(?:${SEPARATOR}|,|${WORD_BOUNDARY}${CONNECTOR}${WORD_BOUNDARY})`;
const TRAILING_BRAND_RE = new RegExp(`\\s*${TRAILING_PREFIX}\\s*${BRAND}(?:\\s+hyderabad)?\\s*$`, 'i');
// A trailing brand mention may also be wrapped in parentheses or brackets
// with no separator at all ("...Dilsukhnagar (Coss Cloud Solutions)").
// Open/close bracket types are matched as pairs, not mixed.
const PAREN_BRAND_RE = new RegExp(`\\s*\\(\\s*${BRAND}(?:\\s+hyderabad)?\\s*\\)\\s*$`, 'i');
const BRACKET_BRAND_RE = new RegExp(`\\s*\\[\\s*${BRAND}(?:\\s+hyderabad)?\\s*\\]\\s*$`, 'i');

// Some historical DB rows were seeded by truncating a title to a fixed
// character count with a trailing "…" *before* the brand suffix existed,
// which can cut the brand name itself mid-word (e.g. "… – Coss…"). Build an
// alternation of every non-empty prefix of "Coss Cloud Solutions" so those
// fragments are recognised as a (truncated) brand segment too.
const FULL_BRAND = 'Coss Cloud Solutions';
const BRAND_PREFIXES = Array.from({ length: FULL_BRAND.length }, (_, i) => FULL_BRAND.slice(0, i + 1))
  .filter((p) => !/\s$/.test(p))
  .sort((a, b) => b.length - a.length)
  .map((p) => p.replace(/\s+/g, '\\s+'));
const TRUNCATED_BRAND_RE = new RegExp(
  `\\s*${SEPARATOR}\\s*(?:${BRAND_PREFIXES.join('|')})\\s*…\\s*$`,
  'i',
);
const LEADING_BRAND_RE = new RegExp(`^\\s*${BRAND}(?:\\s+hyderabad)?\\s*${SEPARATOR}\\s*`, 'i');

/**
 * Strips any leading/trailing brand segment (including truncated "…"
 * fragments) from a raw title, however many times it was appended. Shared by
 * buildTitle() and anywhere else that needs a brand-free title, e.g. the
 * blog fallback description template, which appends its own tagline instead
 * of the " | Coss Cloud Solutions" suffix.
 *
 * Trailing-only: a brand mention is only stripped when it sits at the end of
 * the title, introduced by a separator/comma/connector word. Mid-title or
 * leading editorial mentions are left untouched.
 *
 *   stripBrandFragments('Spoken English Hyderabad with Coss Cloud Solutions')
 *     === 'Spoken English Hyderabad'
 *   stripBrandFragments('German Classes – Coss Cloud Solution')
 *     === 'German Classes'
 *   stripBrandFragments('About Coss Cloud Solutions')
 *     === 'About Coss Cloud Solutions'  // leading/mid mention, unchanged
 *   stripBrandFragments('IELTS Coaching | COSS | Coss Cloud Solutions')
 *     === 'IELTS Coaching'
 *   stripBrandFragments('AWS DevOps Course in Dilsukhnagar (Coss Cloud Solutions)')
 *     === 'AWS DevOps Course in Dilsukhnagar'
 */
export function stripBrandFragments(raw: string | null | undefined): string {
  let title = (raw ?? '').trim();

  let prev: string;
  do {
    prev = title;
    title = title.replace(TRAILING_BRAND_RE, '').trim();
    title = title.replace(PAREN_BRAND_RE, '').trim();
    title = title.replace(BRACKET_BRAND_RE, '').trim();
    title = title.replace(TRUNCATED_BRAND_RE, '').trim();
    title = title.replace(LEADING_BRAND_RE, '').trim();
  } while (title !== prev);

  return title;
}

export function buildTitle(raw: string | null | undefined): string {
  const title = stripBrandFragments(raw);
  return title ? `${title} | Coss Cloud Solutions` : 'Coss Cloud Solutions';
}

const FULL_BRAND_RE = new RegExp(FULL_BRAND.replace(/\s+/g, '\\s+'), 'gi');
// A regex *literal* (not `new RegExp` on a template string) — the build
// pipeline's minifier was found to corrupt a template-literal-constructed
// `\bCOSS\b` pattern (the `\b` word-boundary escape ends up as a literal
// backspace control character in the deployed bundle, silently making the
// regex never match), even though the same source evaluates correctly under
// plain Node. A literal regex isn't subject to that bug.
const SHORT_BRAND_RE = /\bCOSS\b/gi;

/**
 * Counts brand mentions in free text (title or prose), matching "Coss Cloud
 * Solutions"/"Coss Cloud Solution" as one mention each, plus any standalone
 * "COSS" not already part of one of those. Mirrors scripts/seo-audit.mjs's
 * countBrandOccurrences() so callers select exactly the rows/strings the
 * audit would flag as brand-repeated.
 */
export function countBrandOccurrences(text: string | null | undefined): number {
  if (!text) return 0;
  const fullMatches = text.match(FULL_BRAND_RE) ?? [];
  const withoutFull = text.replace(FULL_BRAND_RE, '');
  const shortMatches = withoutFull.match(SHORT_BRAND_RE) ?? [];
  return fullMatches.length + shortMatches.length;
}
