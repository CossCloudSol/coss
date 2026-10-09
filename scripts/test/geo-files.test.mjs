// Run with: npm test. Files for search engines and AI assistants (item 12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) return next(pathToFileURL(path.resolve('src', `${spec.slice(2)}.ts`)).href, ctx);
    return next(spec, ctx);
  },
});

test('robots: the six AI crawlers may read every public page, never /admin or /api', async () => {
  const { default: robots, AI_CRAWLERS } = await import('../../src/app/robots.ts');
  assert.deepEqual([...AI_CRAWLERS], ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']);
  const { rules, sitemap } = robots();
  const all = rules.find((r) => r.userAgent === '*');
  assert.deepEqual([all.allow, all.disallow], ['/', ['/admin/', '/api/']]);
  for (const bot of AI_CRAWLERS) {
    const group = rules.filter((r) => [].concat(r.userAgent).includes(bot));
    assert.equal(group.length, 1, bot);
    assert.equal(group[0].allow, '/', bot);
    assert.deepEqual(group[0].disallow, ['/admin/', '/api/'], bot);
  }
  assert.match(sitemap, /\/sitemap\.xml$/);
});

test('favicon.ico is a real icon file (PNG inside an ICO, square, a multiple of 48px)', () => {
  const ico = fs.readFileSync('public/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1, 'ICO type');
  assert.equal(ico.readUInt16LE(4), 1, 'one image');
  const w = ico.readUInt8(6), h = ico.readUInt8(7), size = ico.readUInt32LE(14), offset = ico.readUInt32LE(18);
  assert.equal(w, h);
  assert.equal(w % 48, 0);
  assert.equal(ico.readUInt32BE(offset), 0x89504e47, 'PNG data');
  assert.equal(offset + size, ico.length);
});

test('manifest: brand name, brand colour, existing icons', async () => {
  const { default: manifest } = await import('../../src/app/manifest.ts');
  const m = manifest();
  assert.match(m.name, /^Coss Cloud Solutions/);
  assert.equal(m.theme_color, '#024c57');
  for (const icon of m.icons) assert.ok(fs.existsSync(path.join('public', icon.src)), icon.src);
});

test('the 404 page is noindex; /locations and /llms.txt exist', () => {
  const nf = fs.readFileSync('src/app/not-found.tsx', 'utf8');
  assert.match(nf, /robots: \{ index: false/);
  assert.ok(fs.existsSync('src/app/locations/page.tsx'));
  const llms = fs.readFileSync('src/app/llms.txt/route.ts', 'utf8');
  assert.match(llms, /ALLOWED_CLAIMS/, 'facts come from the approved list');
  assert.match(llms, /findClaimMatches\(c\.title\)/, 'course titles are claim-checked');
  assert.match(llms, /courseCanonicalUrl/, 'courses at their canonical URLs');
});
