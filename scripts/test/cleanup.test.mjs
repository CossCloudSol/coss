// Run with: npm test. Item 15 cleanup: no page file that a redirect makes unreachable, and
// the removed form packages and dead files stay gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REDIRECTS } from '../../redirects.config.mjs';
import { finalPath } from '../../src/lib/redirect-resolve.ts';

/** Static routes of src/app (route groups dropped; dynamic segments skipped). */
function staticRoutes(dir = 'src/app', segs = []) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('[') || e.name.startsWith('_') || e.name === 'api') continue;
    const next = e.name.startsWith('(') ? segs : [...segs, e.name];
    const sub = path.join(dir, e.name);
    if (fs.existsSync(path.join(sub, 'page.tsx'))) out.push('/' + next.join('/'));
    out.push(...staticRoutes(sub, next));
  }
  return out;
}

test('no page sits behind a redirect (Next.js applies redirects before pages)', () => {
  const routes = staticRoutes();
  assert.ok(routes.length > 50, `found ${routes.length} routes`);
  const shadowed = routes.filter((r) => finalPath(r, REDIRECTS) !== r);
  assert.deepEqual(shadowed, []);
});

test('react-hook-form and @hookform/resolvers are not dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  for (const name of ['react-hook-form', '@hookform/resolvers']) {
    assert.equal(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name], undefined, name);
  }
});

test('dead files stay removed', () => {
  for (const f of ['src/components/CourseAccordionNav.tsx', 'src/app/__test_write.txt', 'src/lib/validations/announcement-bar.ts.clean']) {
    assert.equal(fs.existsSync(f), false, f);
  }
});
