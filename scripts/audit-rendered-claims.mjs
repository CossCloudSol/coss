#!/usr/bin/env node
/**
 * scripts/audit-rendered-claims.mjs
 *
 * Banned-claims sweep of the RENDERED site (what Google, Facebook and
 * LinkedIn actually read), not the database. For every URL in the live
 * sitemap.xml it fetches the HTML (cache-busting query string) and scans:
 *   - <title>, meta description, og:title, og:description,
 *     twitter:title, twitter:description, every JSON-LD "description"
 *   - the visible body text of /courses/* and flat course landing pages
 * with the same checker the social-post send uses (findClaimMatches in
 * src/lib/social-captions.ts).
 *
 * Read-only: plain HTTP GETs, no database, no credentials.
 *
 * URLs: the live sitemap.xml PLUS every course URL linked from /courses
 * (non-canonical course URLs, e.g. legacy /courses/<slug>, are left out of
 * the sitemap but still render, get shared and get crawled) plus --extra.
 *
 * Usage: node scripts/audit-rendered-claims.mjs [baseUrl] [--concurrency N] [--json out.json] [--extra /path,/path]
 * Default baseUrl https://www.cosscloudsol.com, concurrency 6.
 * Exit code 1 when any hit is found or any URL didn't return 200, so the
 * sweep can't report "clean" on a partial fetch.
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { findClaimMatches } from '../src/lib/social-captions.ts';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args.splice(i, 2)[1];
};
const CONCURRENCY = Number(opt('--concurrency') ?? 6);
const JSON_OUT = opt('--json');
const EXTRA = (opt('--extra') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const BASE = (args[0] ?? 'https://www.cosscloudsol.com').replace(/\/$/, '');
const RUN = Date.now().toString(36);
// Protected Vercel previews: the automation bypass header, from the environment, only
// for *.vercel.app hosts (never sent to production, never printed).
const HEADERS = { 'user-agent': 'Mozilla/5.0 (claims-audit)' };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET && /\.vercel\.app$/.test(new URL(BASE).hostname)) {
  HEADERS['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const decode = (s) =>
  (s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

function meta(html, attr, name) {
  const a = html.match(new RegExp(`<meta[^>]*\\b${attr}="${name}"[^>]*\\bcontent="([^"]*)"`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]*\\bcontent="([^"]*)"[^>]*\\b${attr}="${name}"`, 'i'));
  return decode((a ?? b)?.[1] ?? '');
}

/** Field name → text, for one page. */
export function pageFields(html, { body }) {
  const fields = {
    title: decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ''),
    'meta description': meta(html, 'name', 'description'),
    'meta keywords': meta(html, 'name', 'keywords'),
    'og:title': meta(html, 'property', 'og:title'),
    'og:description': meta(html, 'property', 'og:description'),
    'twitter:title': meta(html, 'name', 'twitter:title'),
    'twitter:description': meta(html, 'name', 'twitter:description'),
  };
  let n = 0;
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
          for (const [k, v] of Object.entries(o)) {
            if (k === 'description' && typeof v === 'string') fields[`JSON-LD ${[o['@type']].flat().join('/')} description #${++n}`] = v;
            else walk(v);
          }
        }
      };
      walk(JSON.parse(m[1]));
    } catch {
      fields[`JSON-LD unparsable #${++n}`] = '';
    }
  }
  if (body) {
    const main = html.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ');
    fields['body text'] = decode(main.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  }
  return fields;
}

function context(text, phrase) {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (i === -1) return text.slice(0, 160);
  return `${i > 60 ? '…' : ''}${text.slice(Math.max(0, i - 60), i + phrase.length + 60)}${i + phrase.length + 60 < text.length ? '…' : ''}`;
}

// /courses/* and flat course landing pages (one segment, a course-like slug) get a body scan.
const isCoursePage = (path) => path.startsWith('/courses/') || /^\/[a-z0-9-]*(training|course|institute|certification)[a-z0-9-]*$/.test(path);

async function main() {
  const sitemap = await (await fetch(`${BASE}/sitemap.xml?cb=${RUN}`, { headers: HEADERS })).text();
  const fromSitemap = [...new Set([...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => new URL(decode(m[1])).pathname))];
  const coursesHtml = await (await fetch(`${BASE}/courses?cb=${RUN}`, { headers: HEADERS })).text();
  const fromCourses = [...new Set([...coursesHtml.matchAll(/href="(\/courses\/[a-z0-9/-]+)"/g)].map((m) => m[1]))];
  const paths = [...new Set([...fromSitemap, ...fromCourses, ...EXTRA])];
  const urls = paths.map((p) => `${BASE}${p}`);
  console.log(`URLs: ${urls.length} (sitemap.xml ${fromSitemap.length}, + ${paths.length - fromSitemap.length} more from /courses links and --extra); concurrency ${CONCURRENCY}`);
  if (fromSitemap.length === 0) {
    console.error('sitemap.xml returned no URLs: not a valid sweep');
    process.exitCode = 1;
    return;
  }

  const results = new Array(urls.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < urls.length) {
        const i = next++;
        const url = urls[i];
        const path = new URL(url).pathname;
        const target = `${BASE}${path}${path.includes('?') ? '&' : '?'}cb=${RUN}`;
        try {
          const res = await fetch(target, { redirect: 'follow', headers: HEADERS, signal: AbortSignal.timeout(30_000) });
          const html = await res.text();
          const fields = res.status === 200 ? pageFields(html, { body: isCoursePage(path) }) : {};
          const hits = [];
          for (const [field, text] of Object.entries(fields)) {
            for (const { phrase, why } of findClaimMatches(text)) hits.push({ field, phrase, why, context: context(text, phrase) });
          }
          results[i] = { url, path, status: res.status, finalUrl: res.url.replace(/[?&]cb=[^&]*/, ''), body: isCoursePage(path), hits };
        } catch (err) {
          results[i] = { url, path, status: 0, error: String(err), hits: [] };
        }
      }
    }),
  );

  const ok = results.filter((r) => r.status === 200);
  const notOk = results.filter((r) => r.status !== 200);
  const hits = results.flatMap((r) => r.hits.map((h) => ({ path: r.path, ...h })));
  console.log(`fetched: ${results.length}, HTTP 200: ${ok.length}, other: ${notOk.length}, body-scanned: ${ok.filter((r) => r.body).length}`);
  for (const r of notOk) console.log(`  NOT 200: ${r.status} ${r.path}${r.error ? ` (${r.error})` : ''}`);

  // Group identical text (shared defaults show up on many URLs).
  const groups = new Map();
  for (const h of hits) {
    const key = `${h.field.replace(/ #\d+$/, '')}\u0000${h.context}`;
    const g = groups.get(key) ?? { field: h.field.replace(/ #\d+$/, ''), phrases: new Set(), context: h.context, paths: new Set() };
    g.phrases.add(h.phrase);
    g.paths.add(h.path);
    groups.set(key, g);
  }
  console.log(`\nhits: ${hits.length} (URL × field × phrase) on ${new Set(hits.map((h) => h.path)).size} URLs, ${groups.size} distinct texts\n`);
  for (const g of [...groups.values()].sort((a, b) => b.paths.size - a.paths.size)) {
    const paths = [...g.paths];
    console.log(`[${paths.length} URL${paths.length === 1 ? '' : 's'}] ${g.field}: ${[...g.phrases].map((p) => `"${p}"`).join(', ')}`);
    console.log(`    ${g.context}`);
    console.log(`    ${paths.slice(0, 6).join('  ')}${paths.length > 6 ? `  … +${paths.length - 6}` : ''}`);
  }

  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 1));
  console.log(`\nSUMMARY fetched=${results.length} ok200=${ok.length} hits=${hits.length} urlsWithHits=${new Set(hits.map((h) => h.path)).size}`);
  if (hits.length > 0 || notOk.length > 0) process.exitCode = 1;
}

// Run only when executed directly (other scripts import pageFields).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
