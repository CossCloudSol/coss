// Run with: npm test. Light mode by default: dark only when the visitor chose it with the toggle
// (localStorage 'coss-theme' === 'dark'); the system setting is never followed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const provider = fs.readFileSync('src/components/ThemeProvider.tsx', 'utf8');

/** The inline theme script from the root layout, run against a fake document. */
function runInitScript({ saved, systemDark, storageThrows = false }) {
  const src = layout.match(/__html: `(\(function\(\)\{try\{var d=document\.documentElement[^`]*)`/)?.[1];
  assert.ok(src, 'theme init script found in layout.tsx');
  const classes = new Set();
  const documentElement = { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) }, style: {} };
  const localStorage = { getItem: (k) => { if (storageThrows) throw new Error('blocked'); return k === 'coss-theme' ? saved : null; } };
  const window = { matchMedia: (q) => ({ matches: q.includes('dark') ? systemDark : false }) };
  vm.runInNewContext(src, { document: { documentElement }, localStorage, window });
  return { dark: classes.has('dark'), colorScheme: documentElement.style.colorScheme };
}

test('first paint: light unless the saved choice is dark, whatever the system setting', () => {
  for (const systemDark of [true, false]) {
    assert.deepEqual(runInitScript({ saved: null, systemDark }), { dark: false, colorScheme: 'light' }, `no choice, system dark=${systemDark}`);
    assert.deepEqual(runInitScript({ saved: 'light', systemDark }), { dark: false, colorScheme: 'light' });
    assert.deepEqual(runInitScript({ saved: 'dark', systemDark }), { dark: true, colorScheme: 'dark' });
    assert.deepEqual(runInitScript({ saved: 'system', systemDark }), { dark: false, colorScheme: 'light' });
    assert.deepEqual(runInitScript({ saved: null, systemDark, storageThrows: true }), { dark: false, colorScheme: 'light' });
  }
});

test('nothing follows the system colour scheme', () => {
  assert.doesNotMatch(layout, /prefers-color-scheme/);
  assert.doesNotMatch(provider, /prefers-color-scheme|matchMedia|addEventListener/);
  for (const f of fs.readdirSync('src', { recursive: true })) {
    if (!/\.(css|tsx?|mjs)$/.test(f)) continue;
    assert.doesNotMatch(fs.readFileSync(`src/${f}`, 'utf8'), /prefers-color-scheme/, `src/${f}`);
  }
});

test('the toggle still saves the choice', () => {
  assert.match(provider, /localStorage\.setItem\(STORAGE_KEY, next\)/);
  assert.match(provider, /const STORAGE_KEY = 'coss-theme'/);
});
