// Run with: npm test
// Homepage reviews are live Google reviews only: never admin Testimonial rows, hidden when the feed
// fails, always attributed ("Source: Google" + a link to the listing). Source-contract test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The page fetches the feed; the review block itself lives in components/home/v4/Lower.tsx.
const pageOnly = fs.readFileSync(new URL('../../src/app/page.tsx', import.meta.url), 'utf8');
const lower = fs.readFileSync(new URL('../../src/components/home/v4/Lower.tsx', import.meta.url), 'utf8');
const page = `${pageOnly}
${lower}`;

test('the homepage never reads Testimonial rows', () => {
  assert.doesNotMatch(page, /prisma\.testimonial/);
  assert.doesNotMatch(page, /getReviews\(/);
  assert.match(page, /getGoogleReviews\(\)/);
});

test('the review block is hidden unless the live feed returned reviews', () => {
  assert.match(lower, /if \(!reviews \|\| reviews\.reviews\.length === 0\) return null;/);
});

test('every shown review is attributed to Google with a link to the listing', () => {
  assert.match(lower, /Source: Google/);
  assert.match(lower, /reviews\.mapsUri/);
  assert.match(page, /role="img" aria-label=\{`\$\{r\.rating\} out of 5 stars`\}/);
});

test('no review or rating structured data is added by the page', () => {
  assert.doesNotMatch(page, /AggregateRating|"@type":\s*"Review"/);
});
