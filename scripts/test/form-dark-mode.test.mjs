// Regression guard: lead-form consent text stays readable in dark mode.
// Run with: npm test
//
// What broke (Oct 2026): the WhatsApp opt-in label and the privacy line take
// the form's text colour ("inherit"). In dark mode the page text turns light
// (#e8f0f2) and the homepage demo form is a card that stays white, so that
// text was light on white (1.1:1). The fix pins colours on a white card with
// the `light-surface` class and removes inline colour/opacity from the shared
// components. This test:
//   1. renders both shared components and checks they carry no inline colour,
//      opacity or background (so a surface can always set them);
//   2. resolves their colour in dark mode from the real globals.css, once
//      without and once with `light-surface`, against the white card, and
//      requires >= 4.5:1 with it;
//   3. fails if any component that renders them is not classified, or is a
//      white-card form that lacks `light-surface`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'package.json'));
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8').replace(/\r\n/g, '\n');

/* ── contrast helpers (WCAG 2.x) ─────────────────────────────────────── */
const hex = (h) => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const WHITE = '#ffffff';

/** The first declaration of `prop` in the rule whose selector is exactly `selector`. */
function cssDecl(selector, prop) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = css.match(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`));
  assert.ok(rule, `globals.css has a rule for ${selector}`);
  const d = rule[1].match(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+)`));
  assert.ok(d, `${selector} sets ${prop}`);
  return d[1].trim();
}

/* ── render the shared components ────────────────────────────────────── */
function renderShared() {
  const ts = require('typescript');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const dir = path.join(root, 'node_modules', '.cache', 'form-dark-mode-test');
  fs.mkdirSync(dir, { recursive: true });
  const load = (name) => {
    const src = fs.readFileSync(path.join(root, 'src/components', `${name}.tsx`), 'utf8');
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const file = path.join(dir, `${name}.cjs`);
    fs.writeFileSync(file, out);
    return require(file);
  };
  const optin = load('WhatsAppOptIn');
  const note = load('FormPrivacyNote');
  const optinHtml = renderToStaticMarkup(React.createElement(optin.default));
  const noteHtml = renderToStaticMarkup(React.createElement(note.default));
  return { optinHtml, noteHtml };
}

test('opt-in label and privacy note carry no inline colour, opacity or background', () => {
  const { optinHtml, noteHtml } = renderShared();
  for (const [name, html] of [['WhatsAppOptIn', optinHtml], ['FormPrivacyNote', noteHtml]]) {
    const styles = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]).join(';');
    assert.doesNotMatch(styles, /(^|;)\s*color\s*:/i, `${name}: inline colour would override the surface's colour`);
    assert.doesNotMatch(styles, /opacity\s*:/i, `${name}: opacity lowers contrast and can't be fixed by the surface`);
    assert.doesNotMatch(styles, /background/i, `${name}: no background (it showed as a grey box)`);
  }
  assert.match(optinHtml, /class="wa-optin"/);
  assert.match(noteHtml, /class="form-privacy-note"/);
});

test('opt-in checkbox: accent #005663, light colour scheme, so its border stays visible', () => {
  const { optinHtml } = renderShared();
  assert.match(optinHtml, /accent-color:#005663/i);
  assert.match(optinHtml, /color-scheme:light/i);
});

test('on a white card in dark mode, the consent text meets 4.5:1 with light-surface and fails without it', () => {
  // Dark mode: body text becomes --text of .dark, which the form text inherits.
  const darkText = css.match(/\n\.dark \{[^}]*--text:\s*(#[0-9a-fA-F]{3,6})/)?.[1];
  assert.ok(darkText, '.dark defines --text');
  assert.ok(contrast(darkText, WHITE) < 4.5, 'sanity: the inherited dark-mode text is unreadable on white');

  const label = cssDecl('.light-surface .wa-optin', 'color');
  const note = cssDecl('.light-surface .form-privacy-note', 'color');
  const link = cssDecl('.light-surface .form-privacy-note a', 'color');
  const scheme = cssDecl('.light-surface', 'color-scheme');
  assert.equal(scheme, 'light');
  for (const [what, colour] of [['opt-in label', label], ['privacy text', note], ['privacy link', link], ['surface text', cssDecl('.light-surface', 'color')]]) {
    assert.match(colour, /^#[0-9a-fA-F]{3,6}$/, `${what}: an explicit hex colour`);
    assert.ok(contrast(colour, WHITE) >= 4.5, `${what} ${colour} on white = ${contrast(colour, WHITE).toFixed(2)}:1, needs 4.5:1`);
  }
  assert.match(cssDecl('.light-surface .form-privacy-note', 'background'), /transparent/);
});

test('dark glass card (free-demo-class) keeps light consent text on its dark background', () => {
  // .ef-glass-ctx is a dark translucent card over the dark hero.
  for (const sel of ['.ef-glass-ctx .wa-optin', '.ef-glass-ctx .form-privacy-note']) {
    const v = cssDecl(sel, 'color');
    const m = v.match(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
    assert.ok(m, `${sel} is white with an alpha`);
    assert.ok(Number(m[1]) >= 0.7, `${sel} alpha ${m[1]} is high enough on the dark card`);
  }
});

/* ── every form that shows the consent text is classified ───────────── */
// white-card: a card that is white in BOTH themes -> must have `light-surface`.
// themed: the card follows the theme (dark card in dark mode) -> text is inherited and right.
// dark: designed dark in both themes -> sets its own light colours.
const SURFACES = {
  'components/home/HomeHeroForm.tsx': 'white-card',
  'components/ContactForm.tsx': 'themed',
  'components/CorporateForm.tsx': 'themed',
  'components/DemoSidebarForm.tsx': 'themed',
  'components/EnrollFullForm.tsx': 'themed',
  'components/LandingEnrollForm.tsx': 'themed',
  'components/BrochureButton.tsx': 'themed',
  'components/search/NoResultsLead.tsx': 'themed',
  'components/WhatsAppWidget.tsx': 'themed',
  'components/HeroEnrollForm.tsx': 'dark',
  'components/header/MegaMenuCallback.tsx': 'dark',
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

test('every component that renders the opt-in or privacy note is classified; white cards use light-surface', () => {
  const src = path.join(root, 'src');
  const users = walk(src)
    .map((f) => path.relative(src, f).split(path.sep).join('/'))
    .filter((rel) => !/^components\/(WhatsAppOptIn|FormPrivacyNote)\.tsx$/.test(rel))
    .filter((rel) => /<(WhatsAppOptIn|FormPrivacyNote)\b/.test(fs.readFileSync(path.join(src, rel), 'utf8')));

  for (const rel of users) {
    assert.ok(
      SURFACES[rel],
      `${rel} renders the consent text but is not in SURFACES (scripts/test/form-dark-mode.test.mjs). Classify it: white-card (add the light-surface class), themed, or dark.`,
    );
  }
  for (const [rel, kind] of Object.entries(SURFACES)) {
    const file = path.join(src, rel);
    if (!fs.existsSync(file)) continue; // classified but not on this branch yet
    if (kind === 'white-card') {
      // Inside a string literal (a class list), not in a comment.
      assert.match(
        fs.readFileSync(file, 'utf8'),
        /(['"`])[^'"`\n]*\blight-surface\b[^'"`\n]*\1/,
        `${rel}: a white card must carry the light-surface class`,
      );
    }
  }
});
