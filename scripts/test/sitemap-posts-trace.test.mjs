// Run with: npm test. The sitemap route is regenerated at runtime on Vercel in a function bundle of
// its own: its file trace must include content/posts, or the file-based blog posts silently drop out
// of sitemap.xml (203 URLs became 114 on 9 Oct 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('next.config traces content/posts into the sitemap route', async () => {
  const { default: config } = await import('../../next.config.mjs');
  const includes = config.experimental?.outputFileTracingIncludes?.['/sitemap.xml'];
  assert.ok(Array.isArray(includes), 'outputFileTracingIncludes["/sitemap.xml"] is set');
  assert.ok(includes.some((g) => /content\/posts/.test(g)), `includes content/posts: ${includes}`);
});

test('the sitemap logs (does not hide) a failed read of the posts', () => {
  const s = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert.match(s, /catch \(err\) \{[\s\S]*?console\.error\('\[sitemap\] could not read content\/posts/);
});

test('when a build exists: its sitemap trace lists the posts', { skip: !fs.existsSync('.next/server/app/sitemap.xml/route.js.nft.json') }, () => {
  const trace = JSON.parse(fs.readFileSync('.next/server/app/sitemap.xml/route.js.nft.json', 'utf8'));
  const posts = trace.files.filter((f) => /content[\\/]posts[\\/].+\.mdx$/.test(f));
  assert.ok(posts.length >= 80, `sitemap trace has ${posts.length} post files`);
});
