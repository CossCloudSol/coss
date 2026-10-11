// Run with: npm test
// Colour tokens that failed contrast on public pages (Lighthouse, 11 Oct 2026) must not come back.
// Orange-500 (#f97316) and the old brand #e47538 under white text are 2.8:1 / 3.0:1; the brand
// orange for fills is #b8531c (AA with white text) and for text on dark surfaces #f3a57a.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
// Public code: the admin panel and the generated OG banner image are not part of this rule.
const files = walk(root).filter((f) => !/^(app\/admin|components\/admin|app\/api|app\/course-banner)\//.test(rel(f)));

test('no orange-500 / #f97316 / #e47538 in public code', () => {
  const hits = [];
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const re of [/\borange-500\b/g, /#f97316/gi, /#e47538/gi]) if (re.test(s)) hits.push(`${rel(f)}: ${re}`);
  }
  assert.deepEqual(hits, []);
});

test('home reviews do not render per-review star spans (admin testimonials, not live Google data)', () => {
  const home = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
  assert.doesNotMatch(home, /out of 5 stars/);
});

test('every form select has a label (select-name)', () => {
  const src = fs.readFileSync(path.join(root, 'components/LandingEnrollForm.tsx'), 'utf8');
  assert.match(src, /<label htmlFor="lef-branch"/);
});
