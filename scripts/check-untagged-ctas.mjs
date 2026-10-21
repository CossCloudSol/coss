// Lists public-site links to /free-demo-class, a syllabus/brochure, tel: or wa.me that carry no
// tracking: no data-cta and not rendered through CallLink / WhatsAppLink / TrackedCta /
// PromoBanner (which track themselves). Those still count through the site-wide listener's
// safety net (cta_id "untagged"), but should get a real data-cta + data-loc.
// Usage: node scripts/check-untagged-ctas.mjs   (exit 1 when any are found)
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src/app', 'src/components'];
const SKIP = /[\\/](admin|api)[\\/]/;
const TARGET = /free-demo-class|syllabus|brochure|tel:|wa\.me|whatsapp|wa(Href|Url|Link)|DEMO_HREF|demoHref/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP.test(p + path.sep) ? [] : walk(p);
    return /\.tsx$/.test(e.name) ? [p] : [];
  });
}

/** Opening tags of <a …> and <Link …>, with brace-aware scanning so `=>` doesn't end them. */
function openingTags(src) {
  const out = [];
  const re = /<(a|Link)\b/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    out.push({ tag: src.slice(m.index, i + 1), line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

export function untaggedCtas(roots = ROOTS) {
  const found = [];
  for (const file of roots.flatMap(walk)) {
    if (/PromoBanner\.tsx$|TrackedCta\.tsx$|CallLink\.tsx$|WhatsAppLink\.tsx$/.test(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const { tag, line } of openingTags(src)) {
      const href = tag.match(/href=(\{[^}]*\}|"[^"]*"|'[^']*')/)?.[1] ?? '';
      if (!TARGET.test(href)) continue;
      if (/data-cta=|data-tracked/.test(tag)) continue;
      found.push(`${file.replace(/\\/g, '/')}:${line}  ${href}`);
    }
  }
  return found;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('check-untagged-ctas.mjs')) {
  const found = untaggedCtas();
  if (found.length === 0) {
    console.log('No untagged CTA links.');
  } else {
    console.log(`${found.length} untagged CTA link(s):`);
    for (const f of found) console.log(`  ${f}`);
    process.exitCode = 1;
  }
}
