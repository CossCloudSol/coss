/**
 * What a link preview shows: a page's <title>, meta description, og:title and
 * og:description. Facebook and LinkedIn print these under a shared link, so a
 * banned claim there goes out with our post even when the caption is clean.
 *
 * Dependency-free (unit-tested with mocked HTML in scripts/test/page-meta.test.mjs);
 * the claims checker is passed in (lib/social-captions findClaimMatches).
 */

export const LINK_PREVIEW_FIELDS = ['title', 'meta description', 'og:title', 'og:description'] as const;
export type LinkPreviewField = (typeof LINK_PREVIEW_FIELDS)[number];

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));

function metaContent(html: string, attr: 'name' | 'property', key: string): string {
  const a = html.match(new RegExp(`<meta[^>]*\\b${attr}=["']${key}["'][^>]*\\bcontent=["']([^"']*)["']`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\b${attr}=["']${key}["']`, 'i'));
  return decode((a ?? b)?.[1] ?? '');
}

export function linkPreviewFields(html: string): Record<LinkPreviewField, string> {
  return {
    title: decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim(),
    'meta description': metaContent(html, 'name', 'description'),
    'og:title': metaContent(html, 'property', 'og:title'),
    'og:description': metaContent(html, 'property', 'og:description'),
  };
}

type ClaimFinder = (text: string) => Array<{ phrase: string }>;

/** First banned claim in the page's link-preview fields, or null. */
export function linkPreviewViolation(html: string, findClaims: ClaimFinder): { phrase: string; field: LinkPreviewField } | null {
  const fields = linkPreviewFields(html);
  for (const field of LINK_PREVIEW_FIELDS) {
    const [hit] = findClaims(fields[field]);
    if (hit) return { phrase: hit.phrase, field };
  }
  return null;
}

export type LinkedPagesCheck =
  | { ok: true }
  /** A banned claim: don't send until the page is fixed. */
  | { ok: false; retryable: false; error: string }
  /** Couldn't check (network, non-200): don't send unchecked; try again later. */
  | { ok: false; retryable: true; error: string };

/**
 * Fetches each linked page and checks its preview fields. A banned claim
 * gives "Linked page metadata contains a banned claim: <phrase> (<field>)".
 */
export async function checkLinkedPages(
  urls: string[],
  deps: { fetch: typeof fetch; findClaims: ClaimFinder; timeoutMs?: number },
): Promise<LinkedPagesCheck> {
  for (const url of [...new Set(urls.filter(Boolean))]) {
    let html: string;
    try {
      const res = await deps.fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'facebookexternalhit/1.1 (coss-social-guard)' },
        signal: AbortSignal.timeout(deps.timeoutMs ?? 10_000),
      });
      if (!res.ok) return { ok: false, retryable: true, error: `Couldn't check the linked page's metadata (${url}: HTTP ${res.status}); not sent.` };
      html = await res.text();
    } catch (err) {
      return { ok: false, retryable: true, error: `Couldn't check the linked page's metadata (${url}: ${err instanceof Error ? err.message : String(err)}); not sent.` };
    }
    const hit = linkPreviewViolation(html, deps.findClaims);
    if (hit) return { ok: false, retryable: false, error: `Linked page metadata contains a banned claim: ${hit.phrase} (${hit.field})` };
  }
  return { ok: true };
}
