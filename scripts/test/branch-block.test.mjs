// Run with: npm test. Organic leads part 2 (27 Oct): every course page links to both branch pages
// (Ameerpet ranks far below Dilsukhnagar and had almost no internal links).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => fs.readFileSync(f, 'utf8');
const BANNED = /(placement|placed|guarant|[0-9]+ ?%|lakh|lpa|\bbest\b|\btop\b|#1|number one)/i;
const ID = /^[a-z0-9_]{1,60}$/; // /api/cta-clicks ctaId and location rule

test('BranchBlock: server-rendered, links both /locations pages, tagged demo CTA', () => {
  const s = read('src/components/course/BranchBlock.tsx');
  assert.doesNotMatch(s, /^['"]use client['"]/m, 'no client JS of its own');
  assert.match(s, /export const BRANCH_BLOCK_LOCATION = 'course_branch_block'/);
  assert.ok(ID.test('course_branch_block'));
  assert.match(s, /href=\{`\/locations\/\$\{branch\.branchKey\}`\}/);
  assert.match(s, /data-cta=\{`branch_\$\{branch\.branchKey\}`\}/);
  for (const key of ['dilsukhnagar', 'ameerpet']) assert.ok(ID.test(`branch_${key}`));
  assert.match(s, /data-cta="book_demo"\s+data-loc=\{BRANCH_BLOCK_LOCATION\}/);
  assert.match(s, /href=\{`\/free-demo-class\?course=\$\{courseSlug\}`\}/);
  assert.match(s, /minHeight: '44px'/, 'tap targets at least 44px');
  const copy = [...s.matchAll(/>\s*([^<>{}]*[A-Za-z][^<>{}]*)\s*</g)].map((m) => m[1]).join(' ');
  assert.doesNotMatch(copy, BANNED, 'allowed claims only');
});

test('both course templates render BranchBlock right after the Course Overview card', () => {
  for (const f of ['src/app/courses/[slug]/page.tsx', 'src/app/courses/[slug]/[courseSlug]/page.tsx']) {
    const s = read(f);
    assert.match(s, /import BranchBlock from '@\/components\/course\/BranchBlock'/, f);
    assert.match(
      s,
      /Course Overview<\/h2>[\s\S]{0,400}?<\/div>\s*<BranchBlock courseTitle=\{course\.title\} courseSlug=\{course\.slug\} \/>/,
      `${f}: BranchBlock not directly after the overview`,
    );
  }
});

test('flat landing pages: each branch card links to its /locations page', () => {
  const s = read('src/components/LandingPageTemplate.tsx');
  assert.match(s, /href=\{`\/locations\/\$\{branchKey\}`\}\s+data-cta=\{`branch_\$\{branchKey\}`\}\s+data-loc="landing_branch"/);
});
