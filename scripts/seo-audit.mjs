#!/usr/bin/env node
/**
 * scripts/seo-audit.mjs
 *
 * Read-only full-site SEO/GEO audit. Fetches every URL in the production
 * sitemap plus a handful of known non-sitemap public pages, extracts
 * metadata + JSON-LD from the raw HTML (no headless browser — metadata is
 * SSR'd), validates against a fixed rule set, and writes:
 *
 *   - seo-audit-report.csv   (one row per URL)
 *   - console summary        (severity counts, worst pages, dup descriptions)
 *
 * Makes ZERO writes to the site or DB. Safe to re-run any time.
 *
 * Usage:
 *   node scripts/seo-audit.mjs [--base-url https://www.cosscloudsol.com]
 */

import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE_URL = argVal('--base-url', 'https://www.cosscloudsol.com').replace(/\/$/, '');
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 200;
const OUT_CSV = 'seo-audit-report.csv';

// --local: fetch pages from BASE_URL (e.g. localhost) while the site's
// generated <link rel="canonical"> / og:url tags correctly still point at
// the real production domain (NEXT_PUBLIC_SITE_URL, baked in at build time).
// Sitemap <loc> entries are rewritten from the production host to BASE_URL
// so they resolve locally, and the self-referencing canonical check compares
// path only (host is expected to differ in this mode).
const LOCAL_MODE = args.includes('--local');

function rewriteHostToBase(url) {
  try {
    const u = new URL(url);
    const b = new URL(BASE_URL);
    u.protocol = b.protocol;
    u.host = b.host;
    return u.toString();
  } catch {
    return url;
  }
}

const BRAND_FULL = 'Coss Cloud Solutions';
const BRAND_SHORT = 'COSS';

const BRANCH_GEO = {
  dilsukhnagar: { lat: 17.367741, lng: 78.528543 },
  ameerpet: { lat: 17.436986, lng: 78.447128 },
};
const GEO_TOLERANCE = 0.0005;
const TYPE_B_LOCALITIES = ['kukatpally', 'madhapur-hitec-city'];

const EXTRA_URLS = [
  '/free-demo-class',
  '/__seo-audit-404-check__', // synthetic 404 probe
  '/locations/dilsukhnagar',
  '/locations/ameerpet',
  '/locations/kukatpally',
  '/locations/madhapur-hitec-city',
];

/* -------------------------------------------------------------------------- */
/*  Fetch helpers                                                             */
/* -------------------------------------------------------------------------- */

async function fetchText(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'coss-seo-audit/1.0 (+internal)' },
    });
    const text = await res.text();
    return { status: res.status, finalUrl: res.url, html: text, error: null };
  } catch (err) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return fetchText(url, attempt + 1);
    }
    return { status: 0, finalUrl: url, html: '', error: String(err?.message ?? err) };
  }
}

async function fetchSitemapUrls(baseUrl) {
  const { html: xml, status } = await fetchText(`${baseUrl}/sitemap.xml`);
  if (status !== 200) {
    throw new Error(`Failed to fetch sitemap.xml (status ${status})`);
  }
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) {
    // sitemap index — recurse one level
    const sitemapRefs = [...xml.matchAll(/<sitemap>\s*<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
    const nested = [];
    for (const ref of sitemapRefs) {
      const { html: nestedXml } = await fetchText(ref);
      nested.push(...[...nestedXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim()));
    }
    return nested;
  }
  return urls;
}

/* -------------------------------------------------------------------------- */
/*  HTML extraction (regex-based — SSR'd, no client hydration needed)        */
/* -------------------------------------------------------------------------- */

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractTag(html, re) {
  const m = html.match(re);
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractMetaContent(html, attrPattern) {
  // Matches <meta name="X" content="Y"> or <meta content="Y" name="X"> in either order
  const re1 = new RegExp(`<meta[^>]*(?:name|property)=["']${attrPattern}["'][^>]*content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${attrPattern}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractLinkHref(html, relPattern) {
  const re1 = new RegExp(`<link[^>]*rel=["']${relPattern}["'][^>]*href=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<link[^>]*href=["']([^"']*)["'][^>]*rel=["']${relPattern}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? decodeEntities(m[1].trim()) : null;
}

function extractAllH1(html) {
  const matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, '').trim()).replace(/\s+/g, ' '));
}

function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = [];
  const parseErrors = [];
  for (const b of blocks) {
    try {
      const val = JSON.parse(b[1].trim());
      parsed.push(val);
    } catch (e) {
      parseErrors.push(String(e?.message ?? e));
    }
  }
  return { parsed, parseErrors };
}

function flattenSchemas(parsed) {
  // Each JSON-LD block may be a single object or an @graph array
  const out = [];
  for (const block of parsed) {
    if (Array.isArray(block)) {
      out.push(...block);
    } else if (block && Array.isArray(block['@graph'])) {
      out.push(...block['@graph']);
    } else if (block) {
      out.push(block);
    }
  }
  return out;
}

function schemaTypes(flat) {
  const types = new Set();
  for (const s of flat) {
    const t = s['@type'];
    if (Array.isArray(t)) t.forEach((x) => types.add(x));
    else if (t) types.add(t);
  }
  return [...types];
}

function countBrandOccurrences(text) {
  if (!text) return 0;
  const fullRe = new RegExp(BRAND_FULL.replace(/\s+/g, '\\s+'), 'gi');
  const fullMatches = text.match(fullRe) ?? [];
  // Count standalone "COSS" segments not already part of a "Coss Cloud Solutions" match
  const withoutFull = text.replace(fullRe, '');
  const shortRe = new RegExp(`\\b${BRAND_SHORT}\\b`, 'gi');
  const shortMatches = withoutFull.match(shortRe) ?? [];
  return fullMatches.length + shortMatches.length;
}

/* -------------------------------------------------------------------------- */
/*  Per-page audit                                                            */
/* -------------------------------------------------------------------------- */

function normalizeUrlForCompare(u) {
  try {
    const url = new URL(u);
    url.search = '';
    url.pathname = url.pathname.replace(/\/$/, '') || '/';
    return url.origin + url.pathname;
  } catch {
    return u;
  }
}

function localitySlugFromUrl(url) {
  const m = url.match(/\/locations\/([a-z0-9-]+)\/?$/i);
  return m ? m[1] : null;
}

async function auditUrl(requestedUrl) {
  const flags = [];
  const { status, finalUrl, html, error } = await fetchText(requestedUrl);

  const row = {
    url: requestedUrl,
    finalUrl,
    status,
    fetchError: error ?? '',
    title: '',
    title_brand_count: 0,
    title_len: 0,
    description: '',
    desc_len: 0,
    canonical: '',
    canonical_ok: '',
    robots_meta: '',
    og_title: '',
    og_description: '',
    og_url: '',
    og_image: '',
    twitter_title: '',
    twitter_card: '',
    h1_count: 0,
    h1_texts: '',
    schema_types: '',
    localBusiness_present: false,
    aggregateRating_present: false,
    org_count: 0,
    website_count: 0,
    jsonld_parse_errors: '',
    flags: '',
  };

  const isSyntheticNotFound = requestedUrl.includes('__seo-audit-404-check__');

  if (status === 0) {
    flags.push(`CRITICAL:fetch_failed(${error})`);
    row.flags = flags.join('; ');
    return row;
  }

  if (isSyntheticNotFound) {
    if (status !== 404) {
      flags.push(`WARNING:404_check_returned_${status}_expected_404`);
    }
    row.flags = flags.join('; ');
    return row;
  }

  if (status !== 200) {
    flags.push(`CRITICAL:non_200_status(${status})`);
    row.flags = flags.join('; ');
    return row;
  }

  const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = extractMetaContent(html, 'description');
  const canonical = extractLinkHref(html, 'canonical');
  const robotsMeta = extractMetaContent(html, 'robots');
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogDescription = extractMetaContent(html, 'og:description');
  const ogUrl = extractMetaContent(html, 'og:url');
  const ogImage = extractMetaContent(html, 'og:image');
  const twitterTitle = extractMetaContent(html, 'twitter:title');
  const twitterCard = extractMetaContent(html, 'twitter:card');
  const h1s = extractAllH1(html);
  const { parsed, parseErrors } = extractJsonLd(html);
  const flat = flattenSchemas(parsed);
  const types = schemaTypes(flat);

  row.title = title ?? '';
  row.title_len = title ? title.length : 0;
  row.title_brand_count = countBrandOccurrences(title ?? '');
  row.description = description ?? '';
  row.desc_len = description ? description.length : 0;
  row.canonical = canonical ?? '';
  row.robots_meta = robotsMeta ?? '';
  row.og_title = ogTitle ?? '';
  row.og_description = ogDescription ?? '';
  row.og_url = ogUrl ?? '';
  row.og_image = ogImage ?? '';
  row.twitter_title = twitterTitle ?? '';
  row.twitter_card = twitterCard ?? '';
  row.h1_count = h1s.length;
  row.h1_texts = h1s.join(' || ');
  row.schema_types = types.join(', ');
  row.jsonld_parse_errors = parseErrors.join(' || ');

  const localBusinessSchemas = flat.filter((s) => {
    const t = s['@type'];
    return t === 'LocalBusiness' || (Array.isArray(t) && t.includes('LocalBusiness'))
      || t === 'EducationalOrganization' && s.address && s.geo; // some sites tag branch schema this way
  });
  row.localBusiness_present = localBusinessSchemas.length > 0;
  row.aggregateRating_present = flat.some((s) => !!s.aggregateRating)
    || JSON.stringify(flat).includes('"aggregateRating"');
  row.org_count = flat.filter((s) => {
    const t = s['@type'];
    return t === 'Organization' || (Array.isArray(t) && t.includes('Organization'));
  }).length;
  row.website_count = flat.filter((s) => s['@type'] === 'WebSite').length;

  /* ---------------------------- CRITICAL checks ---------------------------- */

  if (row.title_brand_count > 1) {
    flags.push(`CRITICAL:brand_repeated_in_title(${row.title_brand_count}x)`);
  }
  if (!title || title.trim() === '') {
    flags.push('CRITICAL:title_missing');
  }
  if (!canonical) {
    flags.push('CRITICAL:canonical_missing');
  } else {
    try {
      const canonUrl = new URL(canonical);
      if (canonUrl.search) {
        flags.push('CRITICAL:canonical_has_query_params');
      }
      // In --local mode the request host is localhost but canonical tags
      // correctly point at the real production domain — compare path only.
      const reqNorm = LOCAL_MODE
        ? normalizeUrlForCompare(finalUrl || requestedUrl).replace(/^[a-z]+:\/\/[^/]+/, '')
        : normalizeUrlForCompare(finalUrl || requestedUrl);
      const canonNorm = LOCAL_MODE
        ? normalizeUrlForCompare(canonical).replace(/^[a-z]+:\/\/[^/]+/, '')
        : normalizeUrlForCompare(canonical);
      row.canonical_ok = reqNorm === canonNorm ? 'yes' : 'no';
      if (reqNorm !== canonNorm) {
        flags.push(`CRITICAL:canonical_not_self_referencing(${canonical})`);
      }
    } catch {
      flags.push('CRITICAL:canonical_invalid_url');
      row.canonical_ok = 'invalid';
    }
  }
  if (row.h1_count === 0) {
    flags.push('CRITICAL:zero_h1');
  } else if (row.h1_count > 1) {
    flags.push(`CRITICAL:multiple_h1(${row.h1_count})`);
  }
  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    flags.push('CRITICAL:noindex_on_sitemap_url');
  }
  if (row.org_count > 1) {
    flags.push(`CRITICAL:organization_schema_duplicated(${row.org_count}x)`);
  }
  if (row.website_count > 1) {
    flags.push(`CRITICAL:website_schema_duplicated(${row.website_count}x)`);
  }
  if (row.aggregateRating_present) {
    flags.push('CRITICAL:aggregateRating_present_anywhere');
  }

  const localitySlug = localitySlugFromUrl(finalUrl || requestedUrl);
  const isLocalityPage = !!localitySlug;
  const isBranchLocality = localitySlug && BRANCH_GEO[localitySlug];
  const isTypeBLocality = localitySlug && TYPE_B_LOCALITIES.includes(localitySlug);

  if (row.localBusiness_present && !isBranchLocality) {
    flags.push('CRITICAL:localBusiness_schema_on_non_locality_page');
  }
  if (isTypeBLocality && row.localBusiness_present) {
    flags.push('CRITICAL:localBusiness_schema_on_type_b_catchment_page');
  }

  /* ----------------------------- GEO checks --------------------------------- */

  if (isBranchLocality) {
    const lb = localBusinessSchemas[0];
    const expected = BRANCH_GEO[localitySlug];
    if (!lb) {
      flags.push('CRITICAL:branch_locality_missing_localBusiness_schema');
    } else {
      const geo = lb.geo || {};
      const lat = parseFloat(geo.latitude);
      const lng = parseFloat(geo.longitude);
      if (
        Number.isNaN(lat) || Number.isNaN(lng)
        || Math.abs(lat - expected.lat) > GEO_TOLERANCE
        || Math.abs(lng - expected.lng) > GEO_TOLERANCE
      ) {
        flags.push(`CRITICAL:branch_geo_mismatch(got ${geo.latitude},${geo.longitude} expected ${expected.lat},${expected.lng})`);
      }
      if (!lb.openingHours && !lb.openingHoursSpecification) {
        flags.push('WARNING:branch_missing_openingHours');
      }
      const addrStr = JSON.stringify(lb.address ?? '');
      if (!addrStr || addrStr === '""') {
        flags.push('CRITICAL:branch_missing_address');
      }
    }
  }

  /* ---------------------------- WARNING checks ------------------------------ */

  if (title) {
    if (title.length > 65) flags.push(`WARNING:title_too_long(${title.length})`);
    if (title.length < 25) flags.push(`WARNING:title_too_short(${title.length})`);
  }
  if (!description) {
    flags.push('WARNING:description_missing');
  } else {
    if (description.length > 165) flags.push(`WARNING:description_too_long(${description.length})`);
    if (description.length < 70) flags.push(`WARNING:description_too_short(${description.length})`);
    if (countBrandOccurrences(description) > 1) {
      flags.push(`WARNING:brand_repeated_in_description(${countBrandOccurrences(description)}x)`);
    }
  }
  if (!ogImage) flags.push('WARNING:og_image_missing');
  if (title && ogTitle) {
    const titleCore = title.replace(new RegExp(`\\s*[|–-]\\s*${BRAND_FULL}.*$`, 'i'), '').trim();
    const ogCore = ogTitle.replace(new RegExp(`\\s*[|–-]\\s*${BRAND_FULL}.*$`, 'i'), '').trim();
    if (titleCore && ogCore && titleCore !== ogCore) {
      // Two very different root causes render as the same symptom here, so
      // split them instead of flagging every disagreement identically:
      //  1. Either string carries a "…" truncation artifact -> stale PageSeo
      //     metaTitle/ogTitle seeded before the buildTitle pipeline existed
      //     (real data-quality bug, needs cleanup).
      //  2. Both strings are clean, just deliberately different wording ->
      //     an admin set PageSeo.ogTitle on purpose for social sharing, which
      //     is the pipeline working as designed (get-page-seo.ts always lets
      //     an explicit ogTitle override win). Not worth flagging as WARNING.
      const hasTruncationArtifact = /…/.test(title) || /…/.test(ogTitle);
      if (hasTruncationArtifact) {
        flags.push('WARNING:og_title_stale_truncated_data');
      } else {
        flags.push('INFO:og_title_customized_by_admin');
      }
    }
  }

  /* ------------------------------ INFO checks -------------------------------- */

  if (parseErrors.length > 0) {
    flags.push(`INFO:jsonld_parse_error(${parseErrors.length})`);
  }
  if (h1s.length === 1 && title && h1s[0] && Math.abs(h1s[0].length - title.length) > 40) {
    flags.push('INFO:h1_differs_significantly_from_title');
  }

  row.flags = flags.join('; ');
  return row;
}

/* -------------------------------------------------------------------------- */
/*  Concurrency-limited batch runner                                          */
/* -------------------------------------------------------------------------- */

async function runBatched(items, worker, concurrency, delayMs) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(worker));
    results.push(...batchResults);
    process.stdout.write(`\r  fetched ${Math.min(i + concurrency, items.length)}/${items.length}`);
    if (i + concurrency < items.length) await sleep(delayMs);
  }
  process.stdout.write('\n');
  return results;
}

/* -------------------------------------------------------------------------- */
/*  CSV output                                                                */
/* -------------------------------------------------------------------------- */

function toCsvValue(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(rows, path) {
  const cols = [
    'url', 'finalUrl', 'status', 'fetchError',
    'title', 'title_len', 'title_brand_count',
    'description', 'desc_len',
    'canonical', 'canonical_ok', 'robots_meta',
    'og_title', 'og_description', 'og_url', 'og_image',
    'twitter_title', 'twitter_card',
    'h1_count', 'h1_texts',
    'schema_types', 'localBusiness_present', 'aggregateRating_present',
    'org_count', 'website_count', 'jsonld_parse_errors',
    'flags',
  ];
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(cols.map((c) => toCsvValue(row[c])).join(','));
  }
  writeFileSync(path, lines.join('\n'), 'utf8');
}

/* -------------------------------------------------------------------------- */
/*  Console summary                                                           */
/* -------------------------------------------------------------------------- */

function printSummary(rows) {
  const bySeverity = { CRITICAL: 0, WARNING: 0, INFO: 0 };
  const issueTypeCounts = new Map();
  const pageTypeIssues = new Map(); // page-type prefix -> Set(issueType)

  function pageTypeOf(url) {
    const path = url.replace(BASE_URL, '').split('?')[0];
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/locations/')) return 'locations';
    if (path.startsWith('/courses/')) return 'courses-nested';
    if (path.startsWith('/blog/')) return 'blog-post';
    if (path === '/blog') return 'blog-index';
    if (path.startsWith('/jobs/')) return 'jobs-detail';
    if (path === '/jobs') return 'jobs-index';
    if (path.startsWith('/admin')) return 'admin';
    // flat course/legacy pages under /[courseSlug]
    return 'flat-page';
  }

  for (const row of rows) {
    if (!row.flags) continue;
    const items = row.flags.split('; ').filter(Boolean);
    const ptype = pageTypeOf(row.url);
    for (const item of items) {
      const [sev, rest] = item.split(/:(.+)/s);
      if (bySeverity[sev] !== undefined) bySeverity[sev]++;
      const issueKey = (rest ?? item).replace(/\([^)]*\)$/, '').trim();
      issueTypeCounts.set(issueKey, (issueTypeCounts.get(issueKey) ?? 0) + 1);
      if (!pageTypeIssues.has(ptype)) pageTypeIssues.set(ptype, new Map());
      const m = pageTypeIssues.get(ptype);
      m.set(issueKey, (m.get(issueKey) ?? 0) + 1);
    }
  }

  console.log('\n========== SEO AUDIT SUMMARY ==========');
  console.log(`Total URLs audited: ${rows.length}`);
  console.log(`CRITICAL: ${bySeverity.CRITICAL}   WARNING: ${bySeverity.WARNING}   INFO: ${bySeverity.INFO}`);

  console.log('\n-- Issue counts by type --');
  const sortedIssues = [...issueTypeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [issue, count] of sortedIssues) {
    console.log(`  ${String(count).padStart(4)}  ${issue}`);
  }

  console.log('\n-- Broken-page-type matrix --');
  for (const [ptype, issueMap] of pageTypeIssues.entries()) {
    console.log(`  [${ptype}]`);
    for (const [issue, count] of [...issueMap.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${String(count).padStart(4)}  ${issue}`);
    }
  }

  console.log('\n-- Top 10 worst pages (by flag count) --');
  const worst = [...rows]
    .map((r) => ({ url: r.url, count: r.flags ? r.flags.split('; ').length : 0, flags: r.flags }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  for (const w of worst) {
    console.log(`  [${w.count}] ${w.url}`);
    console.log(`        ${w.flags}`);
  }

  console.log('\n-- Top duplicated descriptions --');
  const descCounts = new Map();
  for (const row of rows) {
    if (!row.description) continue;
    descCounts.set(row.description, (descCounts.get(row.description) ?? []));
    descCounts.get(row.description).push(row.url);
  }
  const dupDescs = [...descCounts.entries()].filter(([, urls]) => urls.length > 1).sort((a, b) => b[1].length - a[1].length);
  for (const [desc, urls] of dupDescs.slice(0, 10)) {
    console.log(`  [${urls.length}x] "${desc.slice(0, 80)}${desc.length > 80 ? '…' : ''}"`);
  }
  if (dupDescs.length === 0) console.log('  (none)');

  console.log(`\nFull report written to ${OUT_CSV}`);
  console.log('========================================\n');
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log(`SEO audit starting against ${BASE_URL}`);
  console.log('Fetching sitemap.xml...');
  const rawSitemapUrls = await fetchSitemapUrls(BASE_URL);
  const sitemapUrls = LOCAL_MODE ? rawSitemapUrls.map(rewriteHostToBase) : rawSitemapUrls;
  console.log(`  ${sitemapUrls.length} URLs found in sitemap${LOCAL_MODE ? ' (rewritten to --base-url host)' : ''}`);

  const extraFullUrls = EXTRA_URLS.map((p) => (p.startsWith('http') ? p : `${BASE_URL}${p}`));
  const sitemapSet = new Set(sitemapUrls.map(normalizeUrlForCompare));
  const toAppend = extraFullUrls.filter((u) => u.includes('__seo-audit-404-check__') || !sitemapSet.has(normalizeUrlForCompare(u)));

  const allUrls = [...sitemapUrls, ...toAppend];
  console.log(`  + ${toAppend.length} extra non-sitemap pages appended`);
  console.log(`Auditing ${allUrls.length} URLs total (concurrency=${CONCURRENCY})...\n`);

  const rows = await runBatched(allUrls, auditUrl, CONCURRENCY, BATCH_DELAY_MS);

  writeCsv(rows, OUT_CSV);
  printSummary(rows);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
