// Run with: npm test. The claims checker's wider rules (fix/meta-claims-3), the public
// badge filter and the AI generator prompt rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findClaimMatches } from '../../src/lib/social-captions.ts';
import { publicBadge } from '../../src/lib/course-badge.ts';
import { ALLOWED_CLAIMS, CONTENT_RULES } from '../../src/lib/ai-content-rules.ts';

const phrases = (t) => findClaimMatches(t).map((m) => m.phrase);
const flags = (t) => findClaimMatches(t).length > 0;

test('rankings: "/" inside words and up to 5 words before training/course/institute', () => {
  assert.deepEqual(phrases('Best SQL/MySQL/PostgreSQL Training in Hyderabad'), ['Best SQL/MySQL/PostgreSQL Training']);
  assert.ok(flags('Best UI/UX Design training institute in Hyderabad.'));
  assert.ok(flags('Join the best programming and full stack development training in Hyderabad.')); // 5 words
  assert.ok(flags('Best Full Stack Power BI Training in Hyderabad')); // 4 words
  assert.ok(flags('Best soft skills and spoken English training institute'));
  assert.ok(flags('the best Node.js course in Hyderabad'));
  // 6 words is past the window; best practices is never a ranking.
  assert.ok(!flags('the best way to prepare for your first course'));
  assert.ok(!flags('Follow AWS best practices in this training module.'));
});

test('"most trusted" is a ranking when it is about the institute, not when it describes software', () => {
  assert.deepEqual(phrases("Hyderabad's most trusted IT training institute since 2010"), ['most trusted IT training']);
  assert.ok(flags('one of the most trusted names in IT training'));
  assert.ok(!flags('Tally ERP is one of the most trusted and widely used accounting software in India'));
  assert.ok(!flags('IT training institute in Hyderabad since 2010'));
});

test('"top (IT/tech) jobs" and "top/leading … companies" are outcome claims; career advice is not', () => {
  assert.ok(flags('Get practical skills for top IT jobs.'));
  assert.ok(flags('Get certified and secure top cybersecurity roles with practical training.'));
  assert.ok(flags('Get skilled in Data Science for top jobs in Hyderabad.'));
  assert.ok(flags("Placement support for Hyderabad's leading companies."));
  assert.ok(flags('start your career in leading tech companies'));
  assert.ok(flags('placement support for top companies'));
  assert.ok(!flags('Discover why AWS certification is the top IT career move in 2025.'));
  assert.ok(!flags('Placement support with 50+ hiring partners.'));
});

test('the privacy-policy security disclaimer is not a guarantee claim', () => {
  assert.ok(!flags('No method of transmitting or storing data can be guaranteed completely secure, and we cannot warrant absolute security.'));
  assert.ok(flags('Your job is guaranteed after this course.'));
});

test('publicBadge hides claim badges and keeps ordinary ones', () => {
  for (const b of ['Bestseller', 'best seller', 'Best-Seller', '#1 Course', 'No. 1', '100% Placement', 'Job Guaranteed', 'Top Rated', 'Most Trusted', 'Leading']) assert.equal(publicBadge(b), null, b);
  for (const b of ['New', 'Popular', 'High Demand', 'Weekend Batch']) assert.equal(publicBadge(b), b);
  assert.equal(publicBadge('  '), null);
  assert.equal(publicBadge(null), null);
});

test('AI prompts: shared content rules embedded; no invented anecdotes, numbers, scarcity or claim badges asked for', () => {
  for (const c of ALLOWED_CLAIMS) assert.ok(CONTENT_RULES.includes(`"${c}"`), c);
  assert.equal(findClaimMatches(ALLOWED_CLAIMS.join('. ')).length, 0, 'the allowed claims pass the checker');
  for (const name of ['blog', 'course', 'category', 'field']) {
    const src = readFileSync(new URL(`../../src/app/api/admin/generate/${name}/route.ts`, import.meta.url), 'utf8');
    assert.match(src, /\$\{CONTENT_RULES\}/, `${name} embeds CONTENT_RULES`);
    for (const bad of [/Seats are limited/i, /real-feeling scenario/i, /Specific numbers beat/i, /one number or data point/i, /Bestseller/, /GOOD:.*walked into/i, /Cloud & Open Source/]) {
      assert.doesNotMatch(src, bad, `${name}: ${bad}`);
    }
  }
});
