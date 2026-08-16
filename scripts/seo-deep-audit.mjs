#!/usr/bin/env node
/**
 * scripts/seo-deep-audit.mjs
 *
 * Read-only companion to scripts/seo-audit.mjs. Covers checks that need the
 * full crawl graph rather than a single-page metadata pass:
 *
 *   - internal link graph (inlinks per course/category/blog/locality page,
 *     excluding header/nav/footer chrome)
 *   - orphan / near-orphan course detection (<=2 contextual inlinks)
 *   - leaked staging-host (nextjs.cosscloudsol.com) references found in the
 *     LIVE rendered HTML, with a breakdown of which pages link to it
 *
 * Makes ZERO writes to the site or DB. Safe to re-run any time.
 *
 * Usage:
 *   node scripts/seo-deep-audit.mjs [--base-url https://www.cosscloudsol.com]
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE_URL = argVal('--base-url', 'https://www.cosscloudsol.com').replace(/\/$/, '');
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 250;
// NOTE: must be regex-escaped — the unescaped dots in this hostname will
// otherwise also match Cloudinary's `nextjs-cosscloudsol-com` folder-naming
// convention (hyphens, a harmless self-hosted asset path), producing a
// large false-positive count.
const STAGING_HOST = 'nextjs.cosscloudsol.com';
const STAGING_HOST_RE_SRC = STAGING_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OUT_JSON = resolve(process.cwd(), 'scripts', '.output', 'seo-deep-audit-linkgraph.json');

async function fetchText(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'coss-seo-deep-audit/1.0 (+internal)' },
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
  if (status !== 200) throw new Error(`Failed to fetch sitemap.xml (status ${status})`);
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length > 0) return urls;
  const sitemapRefs = [...xml.matchAll(/<sitemap>\s*<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  const nested = [];
  for (const ref of sitemapRefs) {
    const { html: nestedXml } = await fetchText(ref);
    nested.push(...[...nestedXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim()));
  }
  return nested;
}

function normalizePath(u, base) {
  try {
    const url = new URL(u, base);
    let p = url.pathname.replace(/\/$/, '') || '/';
    return p;
  } catch {
    return null;
  }
}

function pageTypeOf(path) {
  if (path === '/') return 'home';
  if (path.startsWith('/locations/')) return 'locations';
  if (path.startsWith('/courses/')) return 'courses-nested';
  if (path.startsWith('/blog/')) return 'blog-post';
  if (path === '/blog') return 'blog-index';
  if (path.startsWith('/jobs/')) return 'jobs-detail';
  if (path === '/jobs') return 'jobs-index';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/courses')) return 'category';
  return 'flat-page'; // includes the 36 SEO course pages + dynamic [courseSlug] pages
}

// Strip chrome that repeats on every page (nav/header/footer/aside sidebar)
// so the link graph reflects CONTEXTUAL (body) links only, per brief C.3/C.4.
function stripChrome(html) {
  return html
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

function extractInternalLinks(html, pageUrl) {
  const hrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const out = [];
  for (const href of hrefs) {
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('http') && !href.includes(new URL(BASE_URL).host)) continue; // external
    const path = normalizePath(href, pageUrl);
    if (path) out.push(path);
  }
  return out;
}

function extractAnchorTextForLink(html, targetHrefFragment) {
  // Best-effort: grab first anchor text whose href contains the fragment.
  const re = new RegExp(`<a\\s[^>]*href=["'][^"']*${targetHrefFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i');
  const m = html.match(re);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

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

async function main() {
  console.log(`Deep SEO audit (link graph + staging-host leak) starting against ${BASE_URL}`);
  const sitemapUrls = await fetchSitemapUrls(BASE_URL);
  console.log(`  ${sitemapUrls.length} URLs in sitemap`);

  const pages = await runBatched(
    sitemapUrls,
    async (url) => {
      const { status, finalUrl, html } = await fetchText(url);
      return { url, status, finalUrl, html };
    },
    CONCURRENCY,
    BATCH_DELAY_MS,
  );

  const okPages = pages.filter((p) => p.status === 200);
  console.log(`  ${okPages.length}/${pages.length} pages fetched OK`);

  // ---- Internal link graph (contextual, chrome stripped) ----
  const inlinkCount = new Map(); // path -> count
  const inlinkSources = new Map(); // path -> Set(source path)
  const stagingHostPages = []; // pages whose rendered HTML references the staging host
  let stagingHostRefTotal = 0;
  let stagingHostImgTotal = 0;
  let stagingHostHrefTotal = 0;

  for (const page of okPages) {
    const path = normalizePath(page.finalUrl || page.url, BASE_URL);
    const bodyHtml = stripChrome(page.html);
    const links = extractInternalLinks(bodyHtml, BASE_URL);
    for (const l of links) {
      if (l === path) continue; // ignore self-links
      inlinkCount.set(l, (inlinkCount.get(l) ?? 0) + 1);
      if (!inlinkSources.has(l)) inlinkSources.set(l, new Set());
      inlinkSources.get(l).add(path);
    }

    const stagingMatches = page.html.match(new RegExp(STAGING_HOST_RE_SRC, 'g'));
    if (stagingMatches && stagingMatches.length > 0) {
      const imgMatches = page.html.match(new RegExp(`src=["'][^"']*${STAGING_HOST_RE_SRC}[^"']*["']`, 'gi')) ?? [];
      const hrefMatches = page.html.match(new RegExp(`href=["'][^"']*${STAGING_HOST_RE_SRC}[^"']*["']`, 'gi')) ?? [];
      stagingHostRefTotal += stagingMatches.length;
      stagingHostImgTotal += imgMatches.length;
      stagingHostHrefTotal += hrefMatches.length;
      stagingHostPages.push({ path, count: stagingMatches.length, imgCount: imgMatches.length, hrefCount: hrefMatches.length });
    }
  }

  // ---- Orphan / near-orphan detection for course-type pages ----
  const coursePagePaths = okPages
    .map((p) => normalizePath(p.finalUrl || p.url, BASE_URL))
    .filter((p) => {
      const t = pageTypeOf(p);
      return t === 'courses-nested' || t === 'flat-page';
    })
    .filter((p) => p !== '/'); // guard

  const orphanReport = coursePagePaths
    .map((p) => ({
      path: p,
      inlinks: inlinkCount.get(p) ?? 0,
      sources: [...(inlinkSources.get(p) ?? [])],
    }))
    .sort((a, b) => a.inlinks - b.inlinks);

  const nearOrphans = orphanReport.filter((r) => r.inlinks <= 2);

  console.log('\n========== INTERNAL LINK GRAPH SUMMARY ==========');
  console.log(`Course-type pages analyzed: ${coursePagePaths.length}`);
  console.log(`Near-orphaned (<=2 contextual inlinks): ${nearOrphans.length}`);
  console.log('\n-- Worst 25 (fewest contextual inlinks) --');
  for (const r of orphanReport.slice(0, 25)) {
    console.log(`  [${r.inlinks}] ${r.path}  <- ${r.sources.slice(0, 3).join(', ')}${r.sources.length > 3 ? ', …' : ''}`);
  }

  console.log('\n========== STAGING HOST LEAK (live rendered HTML) ==========');
  console.log(`Pages referencing ${STAGING_HOST}: ${stagingHostPages.length}/${okPages.length}`);
  console.log(`Total occurrences: ${stagingHostRefTotal}  (img src: ${stagingHostImgTotal}, href: ${stagingHostHrefTotal})`);
  console.log('-- Sample pages (up to 25) --');
  for (const p of stagingHostPages.slice(0, 25)) {
    console.log(`  [${p.count}x total, ${p.imgCount} img / ${p.hrefCount} href] ${p.path}`);
  }

  writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        totalPages: okPages.length,
        courseInlinkReport: orphanReport,
        nearOrphanCount: nearOrphans.length,
        stagingHostPages,
        stagingHostRefTotal,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\nFull link graph + leak data written to ${OUT_JSON}`);
}

main().catch((err) => {
  console.error('Deep audit failed:', err);
  process.exit(1);
});
