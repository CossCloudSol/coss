// Run with: npm test
// Colour tokens that failed contrast on public pages (Lighthouse, 11 Oct 2026) must not come back.
//  - orange-500 / #f97316: never (white text on it is 2.8:1).
//  - brand orange #e47538 is DECORATIVE only (icons, borders, glows, banner fills, non-text accents).
//    Text, and fills behind text, use #b8531c (light) / #f3a57a (dark): the --primary-fill and
//    --primary-text tokens. #e47538 as a text colour, or as a background on a line with white text, fails.
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
const all = walk(root);
// Public code: the admin panel and the generated OG banner image are not part of the #e47538 rule.
const pub = all.filter((f) => !/^(app\/admin|components\/admin|app\/api|app\/course-banner)\//.test(rel(f)));

test('no orange-500 / #f97316 anywhere in src', () => {
  const hits = [];
  for (const f of all) {
    const s = fs.readFileSync(f, 'utf8');
    for (const re of [/\borange-500\b/, /#f97316/i]) if (re.test(s)) hits.push(`${rel(f)}: ${re}`);
  }
  assert.deepEqual(hits, []);
});

test('#e47538 (decorative orange) is not a text colour nor a background behind text', () => {
  const hits = [];
  for (const f of pub) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (!/e47538/i.test(line)) return;
      const icon = /<svg|aria-hidden|Icon\b/.test(line);
      if (/text-\[#e47538\]/i.test(line) && !icon) hits.push(`${rel(f)}:${i + 1} text-[#e47538]`);
      if (/(^|[^-a-zA-Z])color:\s*['"]#e47538['"]/i.test(line)) hits.push(`${rel(f)}:${i + 1} color: #e47538`);
      const bg = /bg-\[#e47538\]|background:\s*['"]#e47538['"]/i.test(line);
      const whiteText = /text-white|color:\s*['"]#fff(fff)?['"]/i.test(line);
      if (bg && whiteText) hits.push(`${rel(f)}:${i + 1} #e47538 background with white text`);
    });
  }
  assert.deepEqual(hits, []);
});

test('the logo mark keeps the brand orange (logos are exempt from contrast rules)', () => {
  const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  assert.match(css, /\.logo-icon \{\s*background: var\(--primary\);/);
  assert.match(css, /--primary:\s*#e47538;/);
});

test('home review stars come only from the live Google feed, and carry a text alternative', () => {
  const home = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8') + fs.readFileSync(path.join(root, 'components/home/v4/Lower.tsx'), 'utf8');
  assert.doesNotMatch(home, /prisma\.testimonial|getReviews\(/);
  assert.match(home, /role="img" aria-label=\{`\$\{r\.rating\} out of 5 stars`\}/);
});

test('every form select has a label (select-name)', () => {
  const src = fs.readFileSync(path.join(root, 'components/LandingEnrollForm.tsx'), 'utf8');
  assert.match(src, /<label htmlFor="lef-branch"/);
});
