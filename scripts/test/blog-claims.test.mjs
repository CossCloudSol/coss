// Run with: npm test. Item 7: blog posts (content/posts/*.mdx) make only the allowed claims —
// "since 2010", "5,000+ students trained", "50+ hiring partners" — and no rankings, salary
// figures, placement records or "high-paying" promises about Coss. Slugs and URLs are not
// checked (they can't change without redirects).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR = 'content/posts';
const posts = fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx'));

/** Post text without the slug line and without link/image targets. */
function text(file) {
  return fs.readFileSync(`${DIR}/${file}`, 'utf8')
    .split('\n')
    .filter((l) => !/^slug:/.test(l))
    .join('\n')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '');
}

const RANK = String.raw`(?:best|top-rated|top|leading|premier|renowned|most trusted|#\s?1|number one|go-to|industry-leading|unmatched|unparalleled)`;
const BANNED = {
  'ranking an institute': new RegExp(String.raw`\b${RANK}\b[^.\n]{0,25}\b(?:institute|institution|training institute|training provider)\b`, 'i'),
  'ranking Coss': new RegExp(String.raw`\bcoss\b[^.\n]{0,40}\b(?:is|as) (?:the|one of the) ${RANK}\b`, 'i'),
  'salary figure': /\b\d+(?:\.\d+)?\s?(?:[-–]|to)?\s?\d*(?:\.\d+)?\s?(?:LPA|lakhs? per annum)\b|₹\s?[\d,.]+\s?(?:LPA|per annum|monthly)/i,
  'high-paying / lucrative': /\bhigh[- ]paying\b|\blucrative\b|\bdream jobs?\b/i,
  'placement record': /\bplacement (?:record|rate|track record)\b|\b(?:students|graduates|alumni|candidates)\b[^.\n]{0,40}\b(?:have been|were|are now|been successfully) placed\b/i,
  'alumni outcome': /\btrack record of (?:placing|student success)|\b(?:alumni|graduates|former students)\b[^.\n]{0,60}\b(?:now work|are now working|have (?:successfully )?(?:transitioned|landed|secured|gone on)|work at|secured positions)\b|\b(?:roles|jobs|placements|positions) (?:at|in|with) (?:top|leading|reputed) (?:companies|firms|mncs|tech firms|it firms)\b/i,
  'top companies as partners': /\b(?:partnerships?|collaborat\w+|tie-ups?|connections?) with (?:top|leading|major) (?:companies|firms|mncs|it firms|tech firms|it companies)\b/i,
  'unapproved student count': /\bthousands of (?:students|learners|professionals)\b|\bhundreds of (?:students|learners)\b/i,
  'years claim': /\b15\+ ?(?:years|yrs)\b/i,
  'competitor named': /\b(?:NareshIT|Digital Nest|Digital Medha|Digital Floats)\b/,
  'blog-only discount': /\bMention this blog post\b/i,
  'Kukatpally students claim': /\bmany of our (?:students|learners) travel in from\b/i,
};

test('blog posts: no banned claim patterns', () => {
  assert.ok(posts.length >= 80, `found ${posts.length} posts`);
  const hits = [];
  for (const f of posts) {
    const t = text(f);
    for (const [name, re] of Object.entries(BANNED)) {
      const m = t.match(re);
      if (m) hits.push(`${f}: ${name}: "${m[0]}"`);
    }
  }
  assert.deepEqual(hits, []);
});
