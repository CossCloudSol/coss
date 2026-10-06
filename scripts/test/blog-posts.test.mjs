// Run with: npm test. Blog source hygiene (content/posts) and the MDX excerpt
// fallback in src/lib/posts.ts (item 6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

// posts.ts imports "@/lib/…" (tsconfig paths); map it to src/ for Node.
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});
const { getAllPosts, isUsableExcerpt, excerptFromBody } = await import('../../src/lib/posts.ts');
const { findClaimMatches } = await import('../../src/lib/social-captions.ts');

const DIR = 'content/posts';
const files = readdirSync(DIR).filter((f) => /\.mdx?$/.test(f));

test('no WordPress leftovers in the MDX sources', () => {
  for (const f of files) {
    const src = readFileSync(path.join(DIR, f), 'utf8');
    assert.doesNotMatch(src, /\[\/?(?:vc_|woodmart|wd_)/, `${f}: shortcode`);
    assert.doesNotMatch(src, /\[object Object\]/, `${f}: [object Object]`);
  }
});

test('every served MDX excerpt is usable, shortcode-free and claim-free', async () => {
  const posts = await getAllPosts();
  assert.equal(posts.length, files.length);
  for (const p of posts) {
    const e = p.frontmatter.excerpt ?? '';
    assert.ok(isUsableExcerpt(e), `${p.slug}: ${JSON.stringify(e)}`);
    assert.deepEqual(findClaimMatches(e).map((m) => m.phrase), [], `${p.slug}: claim in the excerpt`);
  }
});

test('isUsableExcerpt: short or shortcode-truncated excerpts are not usable', () => {
  assert.equal(isUsableExcerpt('[/vc_colu'), false);
  assert.equal(isUsableExcerpt('[vc_video link="https://www.youtube.com/watch?v=x" css="" poster'), false);
  assert.equal(isUsableExcerpt('Too short.'), false);
  assert.equal(isUsableExcerpt('A plain sentence about cloud training in Hyderabad.'), true);
});

test('excerptFromBody: first prose paragraph, plain text, capped at a word boundary', () => {
  const body = [
    '### A heading',
    '- a list item that is long enough to count as prose if it were a paragraph',
    '![img](x.png)',
    'Cloud skills are in demand. Learn **AWS** with [our course](/courses/aws) and build real projects in our labs every week of the batch.',
  ].join('\n\n');
  const e = excerptFromBody(body, 60);
  assert.equal(e, 'Cloud skills are in demand. Learn AWS with our course and…');
  assert.ok(e.length <= 61);
  assert.equal(excerptFromBody('A short one, but over forty characters long in total.', 160), 'A short one, but over forty characters long in total.');
  assert.equal(excerptFromBody('### only a heading\n\n- and a list'), '');
});

test('excerptFromBody: skips a paragraph whose excerpt would carry a claim, even cut off', () => {
  const body = [
    'Digital marketing is in demand — and we stand tall as the best Digital Marketing Institute in Dilsukhnagar.',
    'Coss Cloud Solutions teaches SEO, PPC, social media and analytics in hands-on classroom batches.',
  ].join('\n\n');
  // Cut at 70 chars the first paragraph ends "…as the best Digital…", without the noun the claim rules need.
  assert.equal(excerptFromBody(body, 70), 'Coss Cloud Solutions teaches SEO, PPC, social media and analytics in…');
  for (const w of ['top', 'leading', '#1', 'No. 1', 'most trusted', 'guaranteed', 'lifetime', 'high-paying']) {
    assert.equal(excerptFromBody(`We are the ${w} choice for students who want cloud training in Hyderabad.`), '', w);
  }
});
