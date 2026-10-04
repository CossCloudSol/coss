#!/usr/bin/env node
/**
 * scripts/generate-meta-claims-sql.mjs  (v2)
 *
 * Writes prisma/migrations/manual/2026-10-03-meta-claims.sql: the DB half of
 * the banned-claims fix (PageSeo overrides, Course copy, BlogPost copy). The
 * code half ships in the app (fix/meta-claims, fix/meta-claims-2).
 *
 * Input: a production sweep from scripts/audit-rendered-claims.mjs (every
 * match, every URL). For each banned phrase in live text it decides:
 *   - code: the phrase (in context) is in the code at --deployed-ref, so the
 *     code change fixes it, not this SQL (unless it's still in --target-ref);
 *   - DB: covered by a hand-written sentence rewrite (SENTENCES), or by a
 *     derived literal fix (ranking adjectives "Best/Top/Leading …" with a/an
 *     corrected, "top companies/firms", "high-paying"). Anything else is
 *     listed as NEEDS A HAND REWRITE and blocks a clean result.
 *
 * The SQL defines public.coss_claims_fix_20261003(text) (dropped again in the
 * last step): the seeded blog suffix is dropped (end-anchored regexp), then
 * literal replace() pairs, longest first. Literal replace only touches text
 * containing the exact phrase, so it's safe over whole tables and re-runnable.
 *
 * Before writing, the SQL is SIMULATED in JS on every live page text and on
 * the live Course/BlogPost rows (public GET APIs), re-checked with the full
 * checker. Remaining = banned matches the SQL doesn't fix and the target code
 * doesn't fix either; the goal is 0, with every URL fetched. Read-only.
 *
 * Live pages only reach rows the site links to. The 2026-10-03 run expected
 * PageSeo 101 / Course 28 rows and touched 145 / 33: orphaned PageSeo keys and
 * draft courses. So the generated file starts with STEP S, a read-only
 * DB-wide candidate scan (every row, any status, every column the fix
 * touches). Run it in the SQL Editor, export the result as CSV, and generate
 * again with --db-scan: every candidate text is then checked with the full
 * checker, fixed or listed, and simulated, and the expected counts are exact.
 *
 * Usage: node scripts/generate-meta-claims-sql.mjs <sweep.json>
 *          [--deployed-ref origin/main] [--target-ref WORKTREE|<git ref>]
 *          [--db-scan <step-s-export.csv>] [--out <file.sql>]
 * --out defaults to the 2026-10-03 file; a file marked "-- APPLIED" is never
 * overwritten (it records what was run), so pass a new --out next time.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { findClaimMatches } from '../src/lib/social-captions.ts';

const BASE = 'https://www.cosscloudsol.com';
const DEFAULT_OUT = new URL('../prisma/migrations/manual/2026-10-03-meta-claims.sql', import.meta.url);

// STEP S prefilter (PostgreSQL ARE, case-insensitive, \y = start of a word). Deliberately
// broad: it only picks candidates; the JS checker decides what is a claim.
const SCAN_PREFILTER = String.raw`\y(best|top|leading|premier|largest|no\.?\s*1|number one|rated|trusted|award|guarant|100\s*%|placed|placement|hire|hiring|jobs?\y|salar|high-paying|lakh|thousand|years|students|learners|alumni|graduates|partners|compan|firms|recruit|employees|professionals|mnc|tcs|infosys|wipro|accenture|trained)|#\s*1`;
// Also when cut short anywhere after "Hyderabad's" ("Hyderabad's lead…" is still the claim).
const SUFFIX_RE = /\s*—\s*Expert IT training insights from Coss Cloud Solutions, Hyderabad's.*$/i;
const SUFFIX_NEW = ' — Expert IT training insights, since 2010.';
const MAX_DESC = 158;
const META_FIELDS = new Set(['title', 'meta description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']);

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
  // PageSeo: blog pages (seeded from the old MDX titles). Where the derived fix reads
  // badly ("Training for DevOps", "at the DevOps Training"), or the ranking word is
  // further from "Training" than the checker looks (4 words).
  ['Get Placed with Coss Cloud Solutions "Corporate Training" in Hyderabad', 'Train with Coss Cloud Solutions "Corporate Training" in Hyderabad'],
  ['Why COSS Cloud Solutions Offers the Best Digital Marketing Course in Hyderabad', 'Digital Marketing Course in Hyderabad at COSS Cloud Solutions'],
  ['Advance Your Career at the Top DevOps Institute in Dilsukhnagar', 'Advance Your Career at Our DevOps Institute in Dilsukhnagar'],
  ['Join the Best Digital Marketing Training in Dilsukhnagar', 'Join Our Digital Marketing Training in Dilsukhnagar'],
  ['Join Our Industry Leading AWS Cloud Institute', 'Join Our AWS Cloud Institute'],
  ['Best Institute for DevOps in Hyderabad', 'DevOps Training in Hyderabad'],
  ['TopRated Digital Marketing Institute', 'Digital Marketing Institute'],
  ['Best Full Stack Power BI Training', 'Full Stack Power BI Training'],
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
  // Beyond the checker (a wider read-only scan of the same pages and rows): a ranking word
  // more than 3 words before "training", a "/" inside a word, "top jobs", "leading companies".
  ['This course helps you join leading companies such as TCS, Wipro, Infosys, and local startups, giving you the skills needed to start a fulfilling career in AI.', 'This course gives you the skills needed to start a fulfilling career in AI.'],
  ['Get certified and secure top cybersecurity roles with practical training and placement support at leading companies.', 'Get certified and prepare for cybersecurity roles with practical training and placement support.'],
  ['Get certified and secure top placements at leading companies in HITEC City, Gachibowli.', 'Get certified and prepare for Architect roles in HITEC City & Gachibowli.'],
  ['Get personalized career guidance & placement support for top jobs.', 'Get personalized career guidance & placement support.'],
  ['Master Multi-Cloud Architecture for top IT jobs in Hyderabad', 'Master Multi-Cloud Architecture in Hyderabad'],
  ['as a Data Scientist or Analyst in leading tech companies.', 'as a Data Scientist or Analyst.'],
  ['Get skilled in Data Science for top jobs in Hyderabad.', 'Get skilled in Data Science in Hyderabad.'],
  ['placement assistance for top digital marketing jobs.', 'placement assistance for digital marketing roles.'],
  ['Expert training, real projects, strong placement.', 'Expert training, real projects, placement support.'],
  ["Placement support for Hyderabad's leading companies.", 'Placement support with 50+ hiring partners.'],
  ['Best soft skills and spoken English training', 'Soft skills and spoken English training'],
  ['neural networks for top tech jobs in Hyderabad.', 'neural networks in Hyderabad.'],
  ['Best Multi Cloud & DevOps Course in Hyderabad', 'Multi Cloud & DevOps Course in Hyderabad'],
  ['Get practical skills for top IT jobs.', 'Get practical, job-ready skills.'],
  ['Gain practical skills for top jobs.', 'Gain practical, job-ready skills.'],
  ['Best SQL/MySQL/PostgreSQL Training', 'SQL/MySQL/PostgreSQL Training'],
  ['Best UI/UX Design training', 'UI/UX Design training'],
];

// ── Derived literal fixes ───────────────────────────────────────────────
const RANK_ADJ = /^(?:best|leading|premier|largest|top[-\s]?rated|toprated|top|no\.?\s*1)\s*/i;
const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** "an" before a vowel sound: an IT, an SQL, an ML, an AWS; a DevOps, a Python. */
function wantsAn(word) {
  if (/^[A-Z0-9]{2,}\b/.test(word)) return 'AEFHILMNORSX'.includes(word[0]);
  return /^[aeiou]/i.test(word);
}
/** [fragment, replacement] for one live match, or null if it needs a hand rewrite. */
function derivedFix(text, m) {
  const { phrase, index, why } = m;
  let start = index;
  let end = index + phrase.length;
  if (text.slice(start, end).toLowerCase() !== phrase.toLowerCase()) return null;
  const upper = /^[A-Z]/.test(text[start]);
  if (/rankings/.test(why)) {
    const adj = phrase.match(RANK_ADJ);
    if (!adj) return null;
    let rest = phrase.slice(adj[0].length).replace(/\bInstitutes?$/, 'Training').replace(/\binstitutes?$/, 'training');
    const industry = text.slice(Math.max(0, start - 9), start).match(/industry[-\s]$/i);
    if (industry) start -= industry[0].length;
    const lead = /^[A-Z]/.test(text[start]);
    if (!rest) {
      // The phrase is the adjective alone ("Top-Rated"): drop it and the space after.
      const gap = text.slice(end).match(/^\s+/)?.[0] ?? '';
      const next = text[end + gap.length] ?? '';
      return next ? [text.slice(start, end + gap.length + 1), lead ? next.toUpperCase() : next] : [text.slice(start, end + gap.length), ''];
    }
    let repl = lead ? capFirst(rest) : rest;
    const art = text.slice(Math.max(0, start - 4), start).match(/\b(a|an)\s$/i);
    if (art) {
      start -= art[0].length;
      const word = wantsAn(repl) ? 'an' : 'a';
      repl = `${art[1][0] === 'A' ? capFirst(word) : word} ${repl}`;
    }
    return [text.slice(start, end), repl];
  }
  if (/top companies/.test(why)) {
    const rest = phrase.replace(/^top\s+/i, '');
    return [text.slice(start, end), upper ? capFirst(rest) : rest];
  }
  if (/salary/.test(why)) {
    // "a high-paying career" → "a career"; "High salaries, global demand" → "Global demand".
    const gap = text.slice(end).match(/^,?\s+/)?.[0] ?? '';
    const next = text[end + gap.length] ?? '';
    if (upper && next) return [text.slice(start, end + gap.length + 1), next.toUpperCase()];
    return [text.slice(start, end + gap.length), ''];
  }
  return null;
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

// ── Is a live phrase copy from the code (at a git ref, or the working tree)? ──
const codeCache = new Map();
function inCode(ref, needle) {
  const n = needle.replace(/\s+/g, ' ').trim();
  if (n.length < 12) return false;
  const key = `${ref}\u0000${n}`;
  if (!codeCache.has(key)) {
    // src only: MDX frontmatter was cleaned in fix/meta-claims (checked separately), and MDX
    // post bodies aren't page metadata, so a live meta/body claim matching an MDX body is
    // still DB text (PageSeo seeded from it). Comment lines don't render: a JSDoc example
    // quoting an old title must not make live DB text look like code.
    const args = ['grep', '-h', '-F', '-i', n, ...(ref === 'WORKTREE' ? [] : [ref]), '--', 'src'];
    let lines = [];
    try { lines = execFileSync('git', args, { encoding: 'utf8' }).split('\n'); } catch {}
    codeCache.set(key, lines.some((l) => l.trim() && !/^\s*(\*|\/\/|\/\*)/.test(l)));
  }
  return codeCache.get(key);
}
/**
 * The strings to look for in the code for one match: the phrase in its own context only,
 * because the bare phrase also occurs in unrelated code (keywords strings), which would
 * misfile DB text as code. The context is cut back to whole words, but never into the
 * phrase: "Best X training" at the start of a text must not shrink to "X training",
 * which the fixed code does contain. The bare phrase only when it is the whole text.
 */
export function contextNeedles(text, m) {
  const i = m.index;
  const end = i + m.phrase.length;
  const phrase = text.slice(i, end);
  const tail = end + 25 < text.length ? text.slice(end, end + 25).replace(/\S*$/, '') : text.slice(end);
  const head = i > 30 ? text.slice(i - 30, i).replace(/^\S*/, '') : text.slice(0, i);
  if (!tail.trim() && !head.trim()) return [phrase];
  return [tail.trim() && phrase + tail, head.trim() && head + phrase].filter(Boolean);
}
function codeSourced(ref, text, m) {
  return contextNeedles(text, m).some((n) => inCode(ref, n));
}

/** RFC 4180 CSV (the SQL Editor's export): quoted fields may hold commas, quotes and newlines. */
export function parseCsv(src) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = src.charCodeAt(0) === 0xfeff ? src.slice(1) : src; // BOM
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((f) => f !== ''));
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h.trim(), r[j] ?? ''])));
}

// Transient network errors are retried; a fetch that still fails is counted, and
// any failure makes the run unusable (a partial fetch can't pass as clean).
const fetchFailures = [];
async function get(url, { json = false } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (json) return res.ok ? await res.json() : null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) {
        fetchFailures.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// Invisible characters (the SAP Fico title has a no-break space) are written as
// U&'' escapes: pasted raw into the SQL Editor they can turn into plain spaces,
// and the literal replace() would then silently miss.
const INVISIBLE = /[\u00a0\u00ad\u1680\u2000-\u200f\u2028-\u202f\u205f\u2060\u3000\ufeff]/g;
const sql = (s) => {
  const q = String(s).replace(/'/g, "''");
  if (!q.match(INVISIBLE)) return `'${q}'`;
  return `U&'${q.replace(/\\/g, '\\\\').replace(INVISIBLE, (c) => `\\${c.codePointAt(0).toString(16).padStart(4, '0')}`)}'`;
};
const opt = (args, name, dflt) => { const i = args.indexOf(name); return i === -1 ? dflt : args.splice(i, 2)[1]; };

async function main() {
  const args = process.argv.slice(2);
  const deployedRef = opt(args, '--deployed-ref', 'origin/main');
  const targetRef = opt(args, '--target-ref', 'WORKTREE');
  const dbScanFile = opt(args, '--db-scan', null);
  const outArg = opt(args, '--out', null);
  const OUT = outArg ? pathToFileURL(outArg) : DEFAULT_OUT;
  const sweepFile = args[0];
  if (!sweepFile) throw new Error('usage: node scripts/generate-meta-claims-sql.mjs <sweep.json> [--deployed-ref ref] [--target-ref ref] [--db-scan file.csv] [--out file.sql]');
  if (existsSync(OUT) && /^-- APPLIED/m.test(readFileSync(OUT, 'utf8'))) {
    throw new Error(`${OUT.pathname} is marked "-- APPLIED" (a record of what was run): pass --out <new file>`);
  }
  // STEP S export: every candidate text in the DB, reachable from the site or not.
  const scan = dbScanFile
    ? parseCsv(readFileSync(dbScanFile, 'utf8')).map((r) => ({ tbl: r.tbl, key: r.key, col: r.col, text: r.txt })).filter((r) => r.tbl && typeof r.text === 'string')
    : null;
  if (scan && !scan.length) throw new Error(`${dbScanFile}: no rows (expected the columns tbl, key, col, txt)`);
  const { results } = JSON.parse(readFileSync(sweepFile, 'utf8'));
  const notOk = results.filter((r) => r.status !== 200);
  const { pageFields } = await import('./audit-rendered-claims.mjs');

  // Live texts (every field) for every URL with hits, once per final URL (a /courses
  // link and a sitemap URL can land on the same page; body text if either scanned it).
  const live = [];
  const pages = new Map();
  for (const r of results.filter((x) => x.hits.length)) {
    const path = new URL(r.finalUrl).pathname;
    pages.set(path, Boolean(pages.get(path) || r.body));
  }
  for (const [path, body] of pages) {
    const html = await get(`${BASE}${path}?cb=${Date.now()}`);
    if (html === null) continue;
    for (const [field, text] of Object.entries(pageFields(html, { body }))) live.push({ path, field: field.replace(/ #\d+$/, ''), text });
  }
  // Live Course + BlogPost rows behind every course/blog URL in the sweep.
  const rows = [];
  const seen = new Set();
  for (const r of results) {
    const segs = new URL(r.finalUrl).pathname.split('/').filter(Boolean);
    const api = segs[0] === 'blog' ? `/api/blog/${segs[1]}` : segs.length ? `/api/courses/${segs[segs.length - 1]}` : null;
    if (!api || seen.has(api)) continue;
    seen.add(api);
    const row = await get(`${BASE}${api}`, { json: true });
    if (row?.id) rows.push({ table: segs[0] === 'blog' ? 'BlogPost' : 'Course', row });
  }
  const COLS = { Course: ['title', 'excerpt', 'description', 'seoTitle', 'seoDesc', 'highlights'], BlogPost: ['title', 'excerpt', 'seoTitle', 'seoDesc'] };
  const rowValues = (table, row) => COLS[table].flatMap((c) => (Array.isArray(row[c]) ? row[c].map((v) => [c, v]) : [[c, row[c]]])).filter(([, v]) => typeof v === 'string');

  // Classify every match; collect derived fixes and anything needing a hand rewrite.
  const handFixed = (t) => fixText(t, SENTENCES);
  const derived = new Map();
  const needsHand = new Map();
  const consider = (where, text) => {
    const afterHand = handFixed(text);
    for (const m of findClaimMatches(afterHand)) {
      const fix = derivedFix(afterHand, m);
      if (fix && fix[0] !== fix[1]) derived.set(fix[0], fix[1]);
      else if (!fix) needsHand.set(`${m.phrase} :: ${afterHand.slice(Math.max(0, m.index - 50), m.index + m.phrase.length + 50)}`, where);
    }
  };
  for (const l of live) {
    for (const m of findClaimMatches(l.text)) {
      if (codeSourced(deployedRef, l.text, m)) continue; // code: fixed (or not) by the code, see below
      consider(`${l.path} ${l.field}`, l.text);
      break; // consider() handles every match in this text
    }
  }
  for (const { table, row } of rows) for (const [c, v] of rowValues(table, row)) if (findClaimMatches(v).length) consider(`${table} ${row.id} (${row.slug}) ${c}`, v);
  for (const r of scan ?? []) if (findClaimMatches(r.text).length) consider(`DB ${r.tbl} ${r.key} ${r.col}`, r.text);

  const pairs = [...SENTENCES, ...derived]
    .filter(([a, b]) => a && a !== b)
    .filter(([a], i, all) => all.findIndex(([x]) => x === a) === i)
    .sort((x, y) => y[0].length - x[0].length);

  // Simulate.
  const remaining = [];
  const longAlready = new Map();
  const pageSeoPages = new Map();
  for (const l of live) {
    const after = fixText(l.text, pairs);
    for (const m of findClaimMatches(after)) {
      const codeNow = codeSourced(deployedRef, after, m);
      if (codeNow && !codeSourced(targetRef, after, m)) continue; // removed by the code change
      remaining.push({ where: `${l.path} ${l.field}`, phrase: m.phrase, source: codeNow ? 'CODE (still in target)' : 'DB', text: after.slice(Math.max(0, m.index - 60), m.index + m.phrase.length + 60) });
    }
    if (META_FIELDS.has(l.field) && after !== l.text) {
      // Blocking only if the fix itself makes a description longer than 160; one that was
      // already longer and only gets shorter is listed as a note.
      if (/description/.test(l.field) && after.length > 160) {
        if (after.length > l.text.length) remaining.push({ where: `${l.path} ${l.field}`, phrase: `LENGTH ${l.text.length} → ${after.length}`, source: 'DB', text: after });
        else longAlready.set(`${l.path} ${l.field}`, `${l.text.length} → ${after.length}`);
      }
      const fromRow = rows.some(({ table, row }) => rowValues(table, row).some(([, v]) => v && (l.text.includes(v) || v.includes(l.text))));
      if (!fromRow) {
        const slug = l.path === '/' ? 'home' : l.path.slice(1);
        pageSeoPages.set(slug, [...new Set([...(pageSeoPages.get(slug) ?? []), l.field.replace(/^twitter:/, 'og:')])]);
      }
    }
  }
  const changedRows = { Course: new Map(), BlogPost: new Map() };
  for (const { table, row } of rows) {
    for (const [c, v] of rowValues(table, row)) {
      const after = fixText(v, pairs);
      if (after !== v) changedRows[table].set(row.id, `${row.slug}: ${[...new Set([...(changedRows[table].get(row.id)?.split(': ')[1]?.split(', ') ?? []), c])].join(', ')}`);
      if (c === 'seoDesc' && after !== v && after.length > 160) {
        if (after.length > v.length) remaining.push({ where: `${table} ${row.id} (${row.slug}) ${c}`, phrase: `LENGTH ${v.length} → ${after.length}`, source: 'DB', text: after });
        else longAlready.set(`${table} ${row.slug} ${c}`, `${v.length} → ${after.length}`);
      }
      for (const m of findClaimMatches(after)) remaining.push({ where: `${table} ${row.id} (${row.slug}) ${c}`, phrase: m.phrase, source: 'DB', text: after.slice(Math.max(0, m.index - 60), m.index + m.phrase.length + 60) });
    }
  }
  // DB-wide: exact rows per table (the reachable-row estimate above is a lower bound).
  const scanChanged = { PageSeo: new Set(), Course: new Set(), BlogPost: new Set() };
  for (const r of scan ?? []) {
    const after = fixText(r.text, pairs);
    if (after !== r.text) scanChanged[r.tbl]?.add(r.key);
    if (/^(metaDescription|ogDescription|seoDesc)$/.test(r.col) && after !== r.text && after.length > 160) {
      if (after.length > r.text.length) remaining.push({ where: `DB ${r.tbl} ${r.key} ${r.col}`, phrase: `LENGTH ${r.text.length} → ${after.length}`, source: 'DB', text: after });
      else longAlready.set(`DB ${r.tbl} ${r.key} ${r.col}`, `${r.text.length} → ${after.length}`);
    }
    for (const m of findClaimMatches(after)) remaining.push({ where: `DB ${r.tbl} ${r.key} ${r.col}`, phrase: m.phrase, source: 'DB scan', text: after.slice(Math.max(0, m.index - 60), m.index + m.phrase.length + 60) });
  }
  const expected = scan
    ? { PageSeo: scanChanged.PageSeo.size, Course: scanChanged.Course.size, BlogPost: scanChanged.BlogPost.size }
    : { PageSeo: pageSeoPages.size, Course: changedRows.Course.size, BlogPost: changedRows.BlogPost.size };

  const fnName = 'public.coss_claims_fix_20261003';
  const fn = `CREATE OR REPLACE FUNCTION ${fnName}(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  s text := t;
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  -- 1. Seeded blog suffix (also when cut short with "…").
  IF s ~* ${sql(SUFFIX_RE.source)} THEN
    s := regexp_replace(s, ${sql(SUFFIX_RE.source)}, '', 'i');
    IF length(s) + ${SUFFIX_NEW.length} <= ${MAX_DESC} THEN s := s || ${sql(SUFFIX_NEW)}; END IF;
  END IF;
  -- 2. Literal phrase pairs, longest first.
${pairs.map(([a, b]) => `  s := replace(s, ${sql(a)}, ${sql(b)});`).join('\n')}
  RETURN s;
END
$fn$;`;
  const arrFix = (col) => `ARRAY(SELECT ${fnName}(x) FROM unnest(${col}) WITH ORDINALITY AS u(x, i) ORDER BY i)`;
  const pageCols = ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription'];
  const changed = (cols, arr = []) => [...cols.map((c) => `"${c}" IS DISTINCT FROM ${fnName}("${c}")`), ...arr.map((c) => `"${c}" IS DISTINCT FROM ${arrFix(`"${c}"`)}`)].join('\n   OR ');
  const courseCols = ['title', 'excerpt', 'description', 'seoTitle', 'seoDesc'];
  const blogCols = ['title', 'excerpt', 'seoTitle', 'seoDesc'];
  const fetched = results.length;
  const ok = fetched - notOk.length;

  const scanFrom = `(
  SELECT 'PageSeo' AS tbl, "pageSlug" AS key, col, txt
  FROM "PageSeo", LATERAL (VALUES ('metaTitle', "metaTitle"), ('metaDescription', "metaDescription"), ('ogTitle', "ogTitle"), ('ogDescription', "ogDescription")) v(col, txt)
  UNION ALL
  SELECT 'Course', id || ' ' || slug, col, txt
  FROM "Course", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('description', description), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, txt)
  UNION ALL
  SELECT 'Course', id || ' ' || slug, 'highlights[' || i || ']', x
  FROM "Course", unnest(highlights) WITH ORDINALITY AS u(x, i)
  UNION ALL
  SELECT 'BlogPost', id || ' ' || slug, col, txt
  FROM "BlogPost", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, txt)
) t
WHERE txt ~* ${sql(SCAN_PREFILTER)}`;
  const out = `-- ${new Date().toISOString().slice(0, 10)} Banned claims in page metadata and course/blog copy (generated; v2 first run after fix/meta-claims-2).
-- Run in the Supabase SQL Editor AFTER the fix/meta-claims-2 deploy is live. Not run by Claude.
-- Generated by scripts/generate-meta-claims-sql.mjs from the production sweep
-- (scripts/audit-rendered-claims.mjs, every match): ${fetched} URLs fetched, ${ok} returned 200.
-- Simulated before writing on ${live.length} live page texts + ${rows.length} live Course/BlogPost rows${scan ? ` + ${scan.length} DB-wide scan texts (STEP S export)` : ''}:
-- banned matches left after this SQL: ${remaining.length}.
-- Allowed claims only: since 2010, 5,000+ students trained, 50+ hiring partners, 1-year LMS access.
--
${scan
  ? `-- Expected rows changed (exact, from the DB-wide scan; STEP 1 shows the list):
--   PageSeo: ${expected.PageSeo}, Course: ${expected.Course}, BlogPost: ${expected.BlogPost}`
  : `-- Expected rows changed (rows reachable from the live site only; STEP 1 shows the exact list):
--   PageSeo:  ${pageSeoPages.size} pages (pageSlug: ${[...pageSeoPages.keys()].join(', ')})
--   Course:   ${changedRows.Course.size} rows (${[...changedRows.Course.keys()].join(', ')})
--   BlogPost: ${changedRows.BlogPost.size} rows (${[...changedRows.BlogPost.keys()].join(', ')})
-- NOT DB-wide: orphaned PageSeo keys and draft rows aren't reachable from the site. Run
-- STEP S, export it as CSV and generate again with --db-scan before running step 0.`}
--
-- The fix makes no description longer than 160 characters (STEP 1 checks this). Already
-- over 160 before it, and only shortened by it (${longAlready.size}):
${[...longAlready].map(([where, lens]) => `--   ${where}: ${lens}`).join('\n') || '--   (none)'}
--
-- Run the steps in order: ${scan ? '' : 'S (then regenerate) → '}0 → 1 → 2 → 3 → 4. Each can be run on its own (the
-- helper is a normal function, so it survives separate SQL Editor runs; step 4 drops it).
-- The SQL Editor shows only the last result: run each SELECT on its own to see it.

-- ── STEP S: DB-wide candidate scan (read-only) ─────────────────────────────
-- Every PageSeo / Course / BlogPost text, any status, with a word that might start a
-- banned claim. Export the result as CSV (columns tbl, key, col, txt) and run
--   node scripts/generate-meta-claims-sql.mjs <sweep.json> --db-scan <export.csv> --out <new file>
-- The generator checks each text with the full checker. Check that the export has as many
-- rows as the count query below (the Editor may page large results).
SELECT tbl, key, col, txt FROM ${scanFrom}
ORDER BY 1, 2, 3;

SELECT count(*) AS scan_rows FROM ${scanFrom};

-- ── STEP 0: helper function (dropped in step 4) ────────────────────────────
${fn}

-- ── STEP 1: PREVIEW (read-only) — old and new text side by side ────────────
SELECT 'PageSeo' AS tbl, "pageSlug" AS key, col, old, ${fnName}(old) AS new
FROM "PageSeo", LATERAL (VALUES ('metaTitle', "metaTitle"), ('metaDescription', "metaDescription"), ('ogTitle', "ogTitle"), ('ogDescription', "ogDescription")) v(col, old)
WHERE old IS DISTINCT FROM ${fnName}(old)
UNION ALL
SELECT 'Course', id || ' ' || slug, col, old, ${fnName}(old)
FROM "Course", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('description', description), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, old)
WHERE old IS DISTINCT FROM ${fnName}(old)
UNION ALL
SELECT 'Course', id || ' ' || slug, 'highlights[' || i || ']', x, ${fnName}(x)
FROM "Course", unnest(highlights) WITH ORDINALITY AS u(x, i)
WHERE x IS DISTINCT FROM ${fnName}(x)
UNION ALL
SELECT 'BlogPost', id || ' ' || slug, col, old, ${fnName}(old)
FROM "BlogPost", LATERAL (VALUES ('title', title), ('excerpt', excerpt), ('seoTitle', "seoTitle"), ('seoDesc', "seoDesc")) v(col, old)
WHERE old IS DISTINCT FROM ${fnName}(old)
ORDER BY 1, 2, 3;

-- Row counts the UPDATEs in STEP 2 will touch (compare with the expected counts above):
SELECT 'PageSeo' AS tbl, count(*) FROM "PageSeo" WHERE ${changed(pageCols)}
UNION ALL
SELECT 'Course', count(*) FROM "Course" WHERE ${changed(courseCols, ['highlights'])}
UNION ALL
SELECT 'BlogPost', count(*) FROM "BlogPost" WHERE ${changed(blogCols)};

-- Expected: 0 rows — no description the fix makes longer AND over 160 characters.
SELECT tbl, key, col, length(old) AS old_len, length(new) AS new_len FROM (
  SELECT 'PageSeo' AS tbl, "pageSlug" AS key, col, old, ${fnName}(old) AS new
  FROM "PageSeo", LATERAL (VALUES ('metaDescription', "metaDescription"), ('ogDescription', "ogDescription")) v(col, old)
  UNION ALL
  SELECT 'Course', slug, 'seoDesc', "seoDesc", ${fnName}("seoDesc") FROM "Course"
  UNION ALL
  SELECT 'BlogPost', slug, 'seoDesc', "seoDesc", ${fnName}("seoDesc") FROM "BlogPost"
) d
WHERE length(new) > 160 AND length(new) > length(old);

-- ── STEP 2: UPDATE … RETURNING (one transaction) ───────────────────────────
BEGIN;

UPDATE "PageSeo" SET
  ${pageCols.map((c) => `"${c}" = ${fnName}("${c}")`).join(',\n  ')},
  "updatedAt" = now()
WHERE ${changed(pageCols)}
RETURNING 'PageSeo' AS tbl, "pageSlug", ${pageCols.map((c) => `"${c}"`).join(', ')};

UPDATE "Course" SET
  ${courseCols.map((c) => `"${c}" = ${fnName}("${c}")`).join(',\n  ')},
  highlights = ${arrFix('highlights')},
  "updatedAt" = now()
WHERE ${changed(courseCols, ['highlights'])}
RETURNING 'Course' AS tbl, id, slug, "seoDesc", excerpt;

UPDATE "BlogPost" SET
  ${blogCols.map((c) => `"${c}" = ${fnName}("${c}")`).join(',\n  ')},
  "updatedAt" = now()
WHERE ${changed(blogCols)}
RETURNING 'BlogPost' AS tbl, id, slug, "seoDesc", excerpt;

COMMIT;

-- ── STEP 3: VERIFY (read-only) ──────────────────────────────────────────────
-- Expected: PageSeo 0, Course 0, BlogPost 0 (nothing left that the fix would still change).
SELECT 'PageSeo' AS tbl, count(*) FROM "PageSeo" WHERE ${changed(pageCols)}
UNION ALL
SELECT 'Course', count(*) FROM "Course" WHERE ${changed(courseCols, ['highlights'])}
UNION ALL
SELECT 'BlogPost', count(*) FROM "BlogPost" WHERE ${changed(blogCols)};

-- ── STEP 4: drop the helper ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS ${fnName}(text);

-- Then tell Claude "SQL done": the full production sweep is re-run
-- (node scripts/audit-rendered-claims.mjs) and before/after counts reported.
`;
  mkdirSync(new URL('.', OUT), { recursive: true });
  writeFileSync(OUT, out);

  console.log(`URLs fetched ${fetched}, 200 ${ok}; live texts ${live.length}; rows ${rows.length}`);
  console.log(`fetch failures after retries: ${fetchFailures.length}${fetchFailures.length ? ' — RESULT NOT USABLE' : ''}`);
  for (const f of fetchFailures) console.log(`  FAILED ${f}`);
  if (fetchFailures.length) process.exitCode = 1;
  console.log(`pairs: ${pairs.length} (hand ${SENTENCES.length}, derived ${derived.size})`);
  console.log(`expected rows (${scan ? `exact, DB-wide scan of ${scan.length} texts` : "reachable rows only"}): PageSeo ${expected.PageSeo}, Course ${expected.Course}, BlogPost ${expected.BlogPost}`);
  console.log(`NEEDS A HAND REWRITE: ${needsHand.size}`);
  for (const [k, where] of needsHand) console.log(`  ${where} :: ${k}`);
  console.log(`simulated: banned matches left after the SQL (and the target code): ${remaining.length}`);
  for (const r of remaining) console.log(`  LEFT [${r.source}] ${r.where}: "${r.phrase}" :: ${r.text}`);
  console.log(`already over 160 before the fix, shortened by it: ${longAlready.size}`);
  for (const [where, lens] of longAlready) console.log(`  ${where}: ${lens}`);
  console.log('derived pairs:');
  for (const [a, b] of derived) console.log(`  "${a}" → "${b}"`);
  console.log(`wrote ${OUT.pathname}`);
}

// Run only as a script: the tests import the helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
