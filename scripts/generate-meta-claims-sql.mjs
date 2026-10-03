#!/usr/bin/env node
/**
 * scripts/generate-meta-claims-sql.mjs
 *
 * Writes prisma/migrations/manual/2026-10-03-meta-claims.sql: the DB half of
 * the banned-claims fix (PageSeo overrides, Course copy, one BlogPost). The
 * code half is in the same branch (fix/meta-claims).
 *
 * The SQL defines a helper, public.coss_claims_fix_20261003(text) (dropped
 * again in the last step), applied to
 * every text column involved:
 *   1. the seeded blog meta suffix "— Expert IT training insights from Coss
 *      Cloud Solutions, Hyderabad's leading IT institute." (sometimes cut with
 *      "…") is dropped, and a short allowed suffix put back if it still fits
 *      in 158 characters;
 *   2. literal replace() pairs, longest first.
 * Literal replace only touches text that contains the exact phrase, so it's
 * safe to run over whole tables and to re-run.
 *
 * Before writing, it SIMULATES the SQL: the same transform is applied in JS
 * to every live page text from a sweep JSON and to the live Course/BlogPost
 * rows (public GET APIs), then re-checked with findClaimMatches. Read-only.
 *
 * Usage: node scripts/generate-meta-claims-sql.mjs <sweep.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { findClaimMatches } from '../src/lib/social-captions.ts';

const BASE = 'https://www.cosscloudsol.com';
const OUT = new URL('../prisma/migrations/manual/2026-10-03-meta-claims.sql', import.meta.url);
const SUFFIX_RE = /\s*—\s*Expert IT training insights from Coss Cloud Solutions, Hyderabad's leading IT.*$/i;
const SUFFIX_NEW = ' — Expert IT training insights, since 2010.';
const MAX_DESC = 158;

// Hand-written rewrites: only "since 2010", "5,000+ students trained",
// "50+ hiring partners" and "1-year LMS access" as claims.
const SENTENCES = [
  // PageSeo: course pages
  ["Get top Cyber Security Training in Hyderabad. Land high-paying jobs as Security Analyst or Ethical Hacker with Coss Cloud Solutions' placement support.", "Cyber Security Training in Hyderabad since 2010. Prepare for Security Analyst and Ethical Hacker roles with Coss Cloud Solutions' placement support."],
  ['Get full stack skills and placement support for top IT companies.', 'Get full stack skills and placement support with 50+ hiring partners.'],
  ["Get certified, analyze data, and land jobs in Hyderabad's top firms.", 'Get certified and analyze real business data.'],
  ['Get placed in top companies in HITEC City, Gachibowli, Madhapur.', 'Prepare for HITEC City & Gachibowli roles.'],
  ['Get placed at top companies with Coss Cloud Solutions.', 'Train with Coss Cloud Solutions, since 2010.'],
  ['Get placed in top IT companies after completing our practical, job-focused training.', 'Build job-ready skills with our practical, job-focused training.'],
  ['Get certified & land top jobs in Hyderabad.', 'Get certified in Hyderabad.'],
  ['Get expert training and strong placement assistance for top tech companies.', 'Get expert training and placement assistance with 50+ hiring partners.'],
  ['Our training helps secure placements in top companies.', 'Our training prepares you for technical and HR interviews.'],
  ['Get certified & land jobs with top firms.', 'Get certified.'],
  ['Start your dev career and get placed!', 'Start your dev career with real projects!'],
  ['Build ETL/ELT pipelines for top firms and boost your data engineering career.', 'Build ETL/ELT pipelines and boost your data engineering career.'],
  ['Get placed in top IT companies in HITEC City & Gachibowli.', 'Prepare for cloud roles in HITEC City & Gachibowli.'],
  ['Get placed as an SEO Analyst or Digital Marketer with Coss Cloud Solutions.', 'Prepare for SEO Analyst or Digital Marketer roles with Coss Cloud Solutions.'],
  ['High salaries, global demand, and CEH certification', 'Global demand and CEH certification'],
  // PageSeo: site pages (seeded from src/lib/seo-seed.ts)
  ['Best IT Training Institute in Hyderabad', 'IT Training Institute in Hyderabad Since 2010'],
  ['a leading IT training institute in Hyderabad since 2010', 'an IT training institute in Hyderabad since 2010'],
  ['Leading IT training institute in Hyderabad since 2010', 'IT training institute in Hyderabad since 2010'],
  ['Top IT training in Hyderabad.', 'IT training in Hyderabad since 2010.'],
  ['Discover why 5,000+ students chose Coss Cloud Solutions — ', '5,000+ students trained since 2010 — '],
  ['Discover why 5,000+ students chose Coss Cloud Solutions.', '5,000+ students trained since 2010.'],
  // Course rows
  ["Get certified for jobs in Hyderabad's top tech firms.", 'Get certified with hands-on Power BI projects.'],
  ['for hands-on Azure training in Hyderabad and land top cloud jobs.', 'for hands-on Azure training in Hyderabad.'],
  ["and deploy solutions for Hyderabad's top IT firms.", 'and deploy real data solutions.'],
  ['build a strong portfolio to land your first design job in Hyderabad.', 'build a strong design portfolio in Hyderabad.'],
  ["Prepare for Architect roles at Hyderabad's top IT companies, with placement support.", 'Prepare for Solutions Architect roles, with placement support from 50+ hiring partners.'],
  ["Prepare for Security Analyst roles in Hyderabad's top IT companies and startups.", "Prepare for Security Analyst roles in Hyderabad's IT companies and startups."],
  ['Ready to build something incredible from scratch and land a great job?', 'Ready to build something incredible from scratch?'],
  ['Get job-ready skills for the vibrant IT market in Hyderabad, including companies in HITEC City, Gachibowli, and Madhapur, just like our 5000+ placed students.', 'Get job-ready skills for the IT market in Hyderabad, including companies in HITEC City, Gachibowli, and Madhapur.'],
  ['Workforce planning frameworks used by HRBPs at top Hyderabad IT firms', 'Workforce planning frameworks used by HRBPs at Hyderabad IT firms'],
  ["Get certified, analyze data, and prepare for data roles at Hyderabad's top firms.", 'Get certified, analyze data, and prepare for data roles in Hyderabad.'],
  ['We focus on practical skills you can use from day one, helping you land a good job.', 'We focus on practical skills you can use from day one.'],
  ['This course is built for you to land a job quickly.', 'This course is built to make you job-ready.'],
  ['Our training prepares you for interviews at top companies.', 'Our training prepares you for technical and HR interviews.'],
  ["Get job-ready for finance roles in Hyderabad's top companies.", 'Get job-ready for SAP finance roles in Hyderabad.'],
  ["Placement assistance for Hyderabad's top companies", 'Placement assistance with 50+ hiring partners'],
  ["With our 15+ years of experience, we prepare you for the exam and the real-world demands of companies in HITEC City and Gachibowli, ensuring you're ready for placements.", 'Training IT professionals since 2010, we prepare you for the exam and the real-world demands of companies in HITEC City and Gachibowli.'],
  ['Our training focuses on practical projects, helping you secure great job opportunities with top companies.', 'Our training focuses on practical projects that prepare you for data engineering roles.'],
  ["you'll have a solid strategy to land that job and nail the negotiation.", "you'll have a solid strategy for interviews and salary negotiation."],
  ['Get ready for a high-paying career in cloud computing.', 'Get ready for a career in cloud computing.'],
  ['Coss Cloud Solutions has helped thousands of students get placed at leading IT firms for over 15 years.', 'Coss Cloud Solutions has trained 5,000+ students since 2010.'],
  ["With 15+ years of training experience, Coss Cloud Solutions helps you tap into the thriving IT job market in Hyderabad's HITEC City and Gachibowli.", "Training IT professionals since 2010, Coss Cloud Solutions helps you prepare for the IT job market in Hyderabad's HITEC City and Gachibowli."],
  // BlogPost cmr8e725r00035xxkaqoq6ylg
  ['This guide cuts through the noise, showing you how to build a high-paying career right here in Telangana.', 'This guide shows you how to build a cloud career in Telangana.'],
  ['Confused about choosing the best Data Science course in Hyderabad?', 'Confused about choosing a Data Science course in Hyderabad?'],
  ['Best Data Science Course in Hyderabad: How to Choose', 'Data Science Course in Hyderabad: How to Choose'],
  ['Explore the best Artificial Intelligence course in Hyderabad.', 'Explore our Artificial Intelligence course in Hyderabad.'],
  ['Best Artificial Intelligence Course in Hyderabad: Complete Career Guide', 'Artificial Intelligence Course in Hyderabad: Complete Career Guide'],
  ['with the exact tools you need to land your first DevOps job.', 'with the exact tools used in DevOps roles.'],
  // More Course copy
  ['Gain practical skills demanded by top companies in Hyderabad, including those in HITEC City, Gachibowli, and Madhapur.', 'Gain practical skills for cloud roles in Hyderabad, including HITEC City, Gachibowli, and Madhapur.'],
  ['Our 15+ years of experience and placement support through 50+ hiring partners mean you get quality training and support to land a great job.', 'Training since 2010 and placement support through 50+ hiring partners mean you get quality training and support.'],
  ['Placement support for Data Scientist, ML Engineer roles in top companies.', 'Placement support for Data Scientist and ML Engineer roles.'],
  ['Placement support for top companies.', 'Placement support with 50+ hiring partners.'],
  ['Coss Cloud Solutions has 15+ years of experience placing students in top IT companies.', 'Coss Cloud Solutions has trained IT professionals since 2010, with placement support through 50+ hiring partners.'],
  ['Get top Cyber Security Training in Hyderabad.', 'Cyber Security Training in Hyderabad since 2010.'],
  ['Best ethical hacking course in Hyderabad at COSS.', 'Ethical hacking course in Hyderabad at COSS.'],
  ['Craft ATS-friendly resumes, ace 3+ mock interviews, and land your dream job in Hyderabad.', 'Craft ATS-friendly resumes and ace 3+ mock interviews in Hyderabad.'],
];

// "Best Tally Institute" → "Tally Training", from every ranking phrase seen live.
const RANK = /\b(?:Best|Top[- ]?Rated|TopRated|Top|Industry[- ]Leading|Leading)\s+((?:[\w&/+-]+\s+){0,4}?)(?:Training\s+)?(Institutes?|Training|Course|Courses|Classes)\b/g;
function rankPairs(texts) {
  const pairs = new Map();
  for (const t of texts) {
    for (const m of t.matchAll(RANK)) {
      const words = m[1].trim();
      if (!words) continue;
      const noun = /^institutes?$/i.test(m[2]) ? 'Training' : m[2];
      pairs.set(m[0], `${words} ${noun}`);
    }
    for (const m of t.matchAll(/\bBest Institute for ([\w&/+-]+)/g)) pairs.set(m[0], `${m[1]} Training`);
  }
  return [...pairs];
}

function fixText(t, pairs) {
  if (t == null) return t;
  let s = t;
  if (SUFFIX_RE.test(s)) {
    s = s.replace(SUFFIX_RE, '');
    if (s.length + SUFFIX_NEW.length <= MAX_DESC) s += SUFFIX_NEW;
  }
  for (const [a, b] of pairs) s = s.split(a).join(b);
  return s;
}

// Live text that comes from code at HEAD is fixed by the code change, not this SQL.
const headCache = new Map();
function inHead(needle) {
  const n = needle.replace(/\s+/g, ' ').trim();
  if (n.length < 12) return false;
  if (!headCache.has(n)) {
    let found = false;
    try { execFileSync('git', ['grep', '-q', '-F', '-i', n, 'HEAD', '--', 'src', 'content']); found = true; } catch {}
    headCache.set(n, found);
  }
  return headCache.get(n);
}
/** Is this phrase, where it sits in the live text, copy from the code at HEAD? */
function codeSourced(text, phrase) {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (i === -1) return false;
  const after = text.slice(i, i + phrase.length + 25).replace(/\s+\S*$/, '');
  const before = text.slice(Math.max(0, i - 30), i + phrase.length).replace(/^\S*\s+/, '');
  return inHead(after) || inHead(before);
}

const sql = (s) => `'${String(s).replace(/'/g, "''")}'`;

async function main() {
  const sweepFile = process.argv[2];
  if (!sweepFile) throw new Error('usage: node scripts/generate-meta-claims-sql.mjs <sweep.json>');
  const { results } = JSON.parse(readFileSync(sweepFile, 'utf8'));
  const { pageFields } = await import('./audit-rendered-claims.mjs');

  // Live page texts (all fields) for pages with hits.
  const live = [];
  for (const r of results.filter((x) => x.hits.length)) {
    const path = new URL(r.finalUrl).pathname;
    const html = await (await fetch(`${BASE}${path}?cb=${Date.now()}`)).text();
    for (const [field, text] of Object.entries(pageFields(html, { body: r.body }))) live.push({ path, field, text });
  }
  // Live Course + BlogPost rows behind the DB hits.
  const rows = [];
  const courseSlugs = new Set(), blogSlugs = new Set();
  for (const r of results) {
    const segs = new URL(r.finalUrl).pathname.split('/').filter(Boolean);
    if (segs[0] === 'blog') blogSlugs.add(segs[1]);
    else if (segs.length) courseSlugs.add(segs[segs.length - 1]);
  }
  for (const s of courseSlugs) { const c = await (await fetch(`${BASE}/api/courses/${s}`)).json().catch(() => null); if (c?.id) rows.push({ table: 'Course', row: c }); }
  for (const s of blogSlugs) { const res = await fetch(`${BASE}/api/blog/${s}`); if (res.ok) rows.push({ table: 'BlogPost', row: await res.json() }); }

  const pairs = [...SENTENCES, ...rankPairs(live.filter((l) => l.field !== 'body text' && !l.field.startsWith('JSON-LD')).map((l) => l.text))]
    .filter(([a, b]) => a !== b)
    .sort((x, y) => y[0].length - x[0].length);

  // Simulate.
  const remaining = [];
  for (const l of live) {
    const after = fixText(l.text, pairs);
    // Copy from code at HEAD is fixed by the code half of this branch.
    for (const m of findClaimMatches(after)) if (!codeSourced(after, m.phrase)) remaining.push({ where: `${l.path} ${l.field}`, phrase: m.phrase, text: after });
    if (/description/.test(l.field) && after !== l.text && after.length > 160) remaining.push({ where: `${l.path} ${l.field}`, phrase: `LENGTH ${after.length}`, text: after });
  }
  const COLS = { Course: ['title', 'excerpt', 'description', 'seoTitle', 'seoDesc', 'highlights'], BlogPost: ['title', 'excerpt', 'seoTitle', 'seoDesc'] };
  let rowChanges = 0;
  const changedRows = { Course: new Set(), BlogPost: new Set() };
  for (const { table, row } of rows) {
    for (const c of COLS[table]) {
      const vals = Array.isArray(row[c]) ? row[c] : [row[c]];
      for (const v of vals) {
        if (typeof v !== 'string') continue;
        const after = fixText(v, pairs);
        if (after !== v) { rowChanges++; changedRows[table].add(row.id); }
        for (const m of findClaimMatches(after)) remaining.push({ where: `${table} ${row.id} (${row.slug}) ${c}`, phrase: m.phrase, text: after.slice(0, 160) });
      }
    }
  }

  const fn = `CREATE OR REPLACE FUNCTION public.coss_claims_fix_20261003(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  s text := t;
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  -- 1. Seeded blog suffix (also when cut short with "…").
  IF s ~* ${sql(SUFFIX_RE.source.replace(/\\s/g, '\\s'))} THEN
    s := regexp_replace(s, ${sql(SUFFIX_RE.source)}, '', 'i');
    IF length(s) + ${SUFFIX_NEW.length} <= ${MAX_DESC} THEN s := s || ${sql(SUFFIX_NEW)}; END IF;
  END IF;
  -- 2. Literal phrase pairs, longest first.
${pairs.map(([a, b]) => `  s := replace(s, ${sql(a)}, ${sql(b)});`).join('\n')}
  RETURN s;
END
$fn$;`;

  const arrFix = (col) => `ARRAY(SELECT public.coss_claims_fix_20261003(x) FROM unnest(${col}) WITH ORDINALITY AS u(x, i) ORDER BY i)`;
  const pageCols = ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription'];
  const changed = (cols, arr = []) =>
    [...cols.map((c) => `"${c}" IS DISTINCT FROM public.coss_claims_fix_20261003("${c}")`), ...arr.map((c) => `"${c}" IS DISTINCT FROM ${arrFix(`"${c}"`)}`)].join('\n   OR ');

  const out = `-- 2026-10-03 Banned claims in page metadata and course copy (fix/meta-claims).
-- Run in the Supabase SQL Editor, in order, AFTER the fix/meta-claims deploy is live.
-- Not run by Claude. Generated by scripts/generate-meta-claims-sql.mjs from the live
-- production sweep (scripts/audit-rendered-claims.mjs); simulated before writing:
--   ${live.length} live page texts + ${rows.length} Course/BlogPost rows checked; banned phrases left after
--   this SQL: ${remaining.length}, each copy from code (fixed by the deploy) or a truncated course card
--   whose Course row this SQL fixes:
${remaining.map((r) => `--     ${r.where}: "${r.phrase}"`).join('\n')}
-- Allowed claims only: since 2010, 5,000+ students trained, 50+ hiring partners, 1-year LMS access.
--
-- Run the steps in order: 0 → 1 → 2 → 3 → 4. Each can be run on its own (the
-- helper is a normal function, so it survives separate SQL Editor runs; step 4 drops it).
-- The SQL Editor shows only the last result: run each SELECT on its own to see it.

-- ── STEP 0: helper function (dropped in step 4) ────────────────────────────
${fn}

-- ── STEP 1: PREVIEW (read-only) — old and new text side by side ────────────
-- Expected: PageSeo rows for blog posts (seeded suffix, "Best … Institute" titles),
-- course pages (job-outcome sentences) and home/about/why-us (up to ~100 pages);
-- Course: ${changedRows.Course.size} rows (${[...changedRows.Course].join(', ')});
-- BlogPost: ${changedRows.BlogPost.size} rows (${[...changedRows.BlogPost].join(', ')}).
SELECT 'PageSeo' AS tbl, "pageSlug" AS key, col, old, public.coss_claims_fix_20261003(old) AS new
FROM "PageSeo", LATERAL (VALUES ('metaTitle', "metaTitle"), ('metaDescription', "metaDescription"), ('ogTitle', "ogTitle"), ('ogDescription', "ogDescription")) v(col, old)
WHERE old IS DISTINCT FROM public.coss_claims_fix_20261003(old)
UNION ALL
SELECT 'Course', id || ' ' || slug, col, old, public.coss_claims_fix_20261003(old)
FROM "Course", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('description', description), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, old)
WHERE old IS DISTINCT FROM public.coss_claims_fix_20261003(old)
UNION ALL
SELECT 'Course', id || ' ' || slug, 'highlights[' || i || ']', x, public.coss_claims_fix_20261003(x)
FROM "Course", unnest(highlights) WITH ORDINALITY AS u(x, i)
WHERE x IS DISTINCT FROM public.coss_claims_fix_20261003(x)
UNION ALL
SELECT 'BlogPost', id || ' ' || slug, col, old, public.coss_claims_fix_20261003(old)
FROM "BlogPost", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, old)
WHERE old IS DISTINCT FROM public.coss_claims_fix_20261003(old)
ORDER BY 1, 2, 3;

-- ── STEP 2: UPDATE … RETURNING (one transaction) ───────────────────────────
BEGIN;

UPDATE "PageSeo" SET
  ${pageCols.map((c) => `"${c}" = public.coss_claims_fix_20261003("${c}")`).join(',\n  ')},
  "updatedAt" = now()
WHERE ${changed(pageCols)}
RETURNING 'PageSeo' AS tbl, "pageSlug", ${pageCols.map((c) => `"${c}"`).join(', ')};

UPDATE "Course" SET
  title = public.coss_claims_fix_20261003(title),
  excerpt = public.coss_claims_fix_20261003(excerpt),
  description = public.coss_claims_fix_20261003(description),
  "seoTitle" = public.coss_claims_fix_20261003("seoTitle"),
  "seoDesc" = public.coss_claims_fix_20261003("seoDesc"),
  highlights = ${arrFix('highlights')},
  "updatedAt" = now()
WHERE ${changed(['title', 'excerpt', 'description', 'seoTitle', 'seoDesc'], ['highlights'])}
RETURNING 'Course' AS tbl, id, slug, "seoDesc", excerpt;

UPDATE "BlogPost" SET
  title = public.coss_claims_fix_20261003(title),
  excerpt = public.coss_claims_fix_20261003(excerpt),
  "seoTitle" = public.coss_claims_fix_20261003("seoTitle"),
  "seoDesc" = public.coss_claims_fix_20261003("seoDesc"),
  "updatedAt" = now()
WHERE ${changed(['title', 'excerpt', 'seoTitle', 'seoDesc'])}
RETURNING 'BlogPost' AS tbl, id, slug, "seoDesc", excerpt;

COMMIT;

-- ── STEP 3: VERIFY (read-only) ──────────────────────────────────────────────
-- Expected: 0 rows (nothing left that the fix would still change).
SELECT 'PageSeo' AS tbl, count(*) FROM "PageSeo" WHERE ${changed(pageCols)}
UNION ALL
SELECT 'Course', count(*) FROM "Course" WHERE ${changed(['title', 'excerpt', 'description', 'seoTitle', 'seoDesc'], ['highlights'])}
UNION ALL
SELECT 'BlogPost', count(*) FROM "BlogPost" WHERE ${changed(['title', 'excerpt', 'seoTitle', 'seoDesc'])};
-- Expected: tbl/count = PageSeo 0, Course 0, BlogPost 0.

-- Expected: 0 rows — no meta description over 160 characters among the rows touched.
SELECT "pageSlug", length("metaDescription") FROM "PageSeo"
WHERE length("metaDescription") > 160 AND "updatedAt" > now() - interval '1 hour';

-- ── STEP 4: drop the helper ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.coss_claims_fix_20261003(text);

-- Then tell Claude "SQL done": the full production sweep is re-run
-- (node scripts/audit-rendered-claims.mjs) and before/after counts reported.
`;
  mkdirSync(new URL('.', OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`pairs: ${pairs.length}; live texts: ${live.length}; rows: ${rows.length} (${rowChanges} values change)`);
  console.log(`simulated: banned phrases left after fix: ${remaining.length}`);
  for (const r of remaining) console.log(`  LEFT ${r.where}: "${r.phrase}" :: ${r.text.slice(0, 150)}`);
  console.log(`wrote ${OUT.pathname}`);
}

main();
