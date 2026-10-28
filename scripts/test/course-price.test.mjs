// Run with: npm test. Course fees (client-approved 28 Oct): every public price is a "From" price,
// and no public page shows a crossed-out "original price" (CCPA: a reference price that was never
// charged is a misleading discount).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (f) => fs.readFileSync(f, 'utf8');

function publicFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p.includes(`${path.sep}admin`)) continue; // admin is staff-only
      publicFiles(p, out);
    } else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('no public component renders a crossed-out price', () => {
  const offenders = publicFiles('src').filter((f) => /line-through|textDecoration:\s*'line-through'/.test(read(f)));
  assert.deepEqual(offenders, [], `line-through found in: ${offenders.join(', ')}`);
});

test('course price display goes through formatFromPrice ("From ₹…") everywhere a price renders', () => {
  const lib = read('src/lib/course-price.ts');
  assert.match(lib, /return `From ₹\$\{Math\.round\(price\)\.toLocaleString\('en-IN'\)\}`/);
  for (const f of ['src/app/courses/[slug]/page.tsx', 'src/app/courses/[slug]/[courseSlug]/page.tsx', 'src/components/CourseCard.tsx']) {
    const s = read(f);
    assert.match(s, /formatFromPrice\(/, `${f} does not use formatFromPrice`);
    assert.doesNotMatch(s, /\{course\.originalPrice\b|\{originalPrice\b/, `${f} still renders originalPrice`);
  }
});

test('formatFromPrice: "From ₹30,000"; nothing for missing, zero or invalid prices', async () => {
  const src = read('src/lib/course-price.ts');
  const body = src.match(/export function formatFromPrice[\s\S]*?\n\}/)[0]
    .replace(/export function formatFromPrice\(price: number \| null \| undefined\): string \| null/, 'function formatFromPrice(price)');
  const formatFromPrice = new Function(`${body}; return formatFromPrice;`)();
  assert.equal(formatFromPrice(30000), 'From ₹30,000');
  assert.equal(formatFromPrice(150000), 'From ₹1,50,000');
  assert.equal(formatFromPrice(null), null);
  assert.equal(formatFromPrice(undefined), null);
  assert.equal(formatFromPrice(0), null);
  assert.equal(formatFromPrice(Number.NaN), null);
});

test('no EMI offer on public pages until the client enables EMI (LMS + automation stack)', () => {
  const legal = /src[\\/]app[\\/](terms-conditions|refund-cancellation-policy)[\\/]/; // policy text: the client's call
  const offenders = publicFiles('src').filter((f) => !legal.test(f) && /\bEMI\b/.test(read(f)));
  assert.deepEqual(offenders, [], `EMI mentioned in: ${offenders.join(', ')}`);
});
