/**
 * src/lib/build-title.ts
 *
 * Single pipeline for every page title on the site. Strips any trailing
 * brand segment (however many times it was double/triple-appended by past
 * admin edits or hardcoded fallbacks) and appends the brand exactly once.
 */

const SEPARATOR = '[|\\-–—]';
const BRAND = '(?:coss\\s+cloud\\s+solutions|coss)';
const TRAILING_BRAND_RE = new RegExp(`\\s*${SEPARATOR}\\s*${BRAND}(?:\\s+hyderabad)?\\s*$`, 'i');

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
 */
export function stripBrandFragments(raw: string | null | undefined): string {
  let title = (raw ?? '').trim();

  let prev: string;
  do {
    prev = title;
    title = title.replace(TRAILING_BRAND_RE, '').trim();
    title = title.replace(TRUNCATED_BRAND_RE, '').trim();
    title = title.replace(LEADING_BRAND_RE, '').trim();
  } while (title !== prev);

  return title;
}

export function buildTitle(raw: string | null | undefined): string {
  const title = stripBrandFragments(raw);
  return title ? `${title} | Coss Cloud Solutions` : 'Coss Cloud Solutions';
}
