// Real publish and update dates for the MDX blog posts, from git history (item 10):
//   published = the commit that first added the file (followed across renames)
//   modified  = the last commit that changed it (today, if it has uncommitted changes)
// Used by scripts/build-post-dates.mjs (writes content/posts/_dates.json, which
// src/lib/posts.ts reads) and by scripts/test/post-dates.test.mjs (checks the file is current).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const POSTS_DIR = 'content/posts';
export const DATES_FILE = 'content/posts/_dates.json';

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Today in India (YYYY-MM-DD): the date a commit made now would carry here. */
export function todayIst(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function isShallowRepo(cwd = process.cwd()) {
  return git(['rev-parse', '--is-shallow-repository'], cwd).trim() === 'true';
}

/**
 * { slug: { published: 'YYYY-MM-DD', modified: 'YYYY-MM-DD' } } for every .md/.mdx file in
 * content/posts. Throws on a shallow clone: partial history would give wrong dates.
 */
export function computePostDates(cwd = process.cwd(), today = todayIst()) {
  if (isShallowRepo(cwd)) throw new Error('shallow git clone: post dates need the full history');
  const files = fs.readdirSync(path.join(cwd, POSTS_DIR)).filter((f) => /\.mdx?$/.test(f)).sort();

  // Where each current file sits at the point of history being read (follows renames back).
  const tracked = new Map(files.map((f) => [f, `${POSTS_DIR}/${f}`]));
  const modified = new Map();
  const published = new Map();

  // Uncommitted changes count as today (they will be committed with this file).
  for (const line of git(['status', '--porcelain', '--', POSTS_DIR], cwd).split('\n')) {
    if (!line.trim()) continue;
    const xy = line.slice(0, 2);
    const rest = line.slice(3);
    const [from, to] = rest.includes(' -> ') ? rest.split(' -> ') : [rest, rest];
    const file = path.posix.basename(to);
    if (!tracked.has(file)) continue;
    modified.set(file, today);
    if (xy.includes('R')) tracked.set(file, from);
    else if (xy === '??' || xy.includes('A')) published.set(file, today);
  }

  // Newest commit first. "-M" reports renames as "R<score>\told\tnew".
  let date = null;
  for (const line of git(['log', '-M', '--name-status', '--format=>%cs', '--', POSTS_DIR], cwd).split('\n')) {
    if (line.startsWith('>')) { date = line.slice(1).trim(); continue; }
    if (!line.trim()) continue;
    const [status, a, b] = line.split('\t');
    const newPath = /^[RC]/.test(status) ? b : a;
    for (const [file, p] of tracked) {
      if (p !== newPath) continue;
      if (!modified.has(file)) modified.set(file, date);
      if (status === 'A') published.set(file, date); // read newest → oldest: the first add wins last
      if (status.startsWith('R')) tracked.set(file, a); // older commits know it by its old name
    }
  }

  return Object.fromEntries(files.map((f) => {
    const slug = f.replace(/\.mdx?$/, '');
    const pub = published.get(f) ?? null;
    return [slug, { published: pub, modified: modified.get(f) ?? pub }];
  }));
}

export function writePostDates(cwd = process.cwd()) {
  const dates = computePostDates(cwd);
  fs.writeFileSync(path.join(cwd, DATES_FILE), `${JSON.stringify(dates, null, 2)}\n`);
  return dates;
}
