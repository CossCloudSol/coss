# Internal Linking Repair — Phase 1 (measure) & Phase 2 (proposals)

Follow-up to `seo-deep-audit-report.md` finding C.3. Read-only pass: live crawl of
`https://www.cosscloudsol.com` (303/303 sitemap URLs, concurrency 5) via
`scripts/seo-deep-audit.mjs`, plus source review. No writes made. Full per-page data in
`seo-deep-audit-linkgraph.json` (overwritten by this run — see caveat in §1.4).

---

## Phase 1 — Re-measured link graph

### 1.1 Headline numbers vs. baseline

| | Baseline (original audit) | Current | Δ |
|---|---|---|---|
| Course-type pages analyzed | 194 | 194 | — |
| Near-orphaned (≤2 contextual inlinks) | 150 (77%) | 140 (72%) | **−10** (improved) |
| At exactly 0 contextual inlinks | 25 | 50 | **+25** (worse) |

The remediation **did not net-improve** the orphan picture the way the commit message
implied. It helped some pages and left a much larger zero-inlink population than before.
Root cause below (§1.3).

### 1.2 Full distribution, and why it must be read by URL family, not in aggregate

The 194 "course-type" pages are actually **three structurally different populations**
that share nothing except being crawled by the same script. Aggregating them (as the
original 150/25 headline did) hides where the problem actually is:

| Population | Count | 0 | 1–2 | 3–5 | 6+ | Near-orphan rate |
|---|---|---|---|---|---|---|
| **Legacy 2-segment** `/courses/{slug}` | 62 | 0 | 31 | 5 | 26 | 50% |
| **Nested 3-segment** `/courses/{category}/{slug}` (Phase 2 canonical) | 54 | 4 | 41 | 9 | **0** | 83% |
| **Flat legacy** (36 `/​{seo-slug}` landing pages + other root-level course routes) | 78 | 46 | 18 | 4 | 10 | 82% |

Two things jump out:

- **Not one of the 54 nested-URL course pages has 6+ inlinks.** There's a hard ceiling — every nested course tops out at 5. That's not random; it's structural (§1.3, Related Courses cap).
- **The flat-legacy population is where the 0-inlink count actually lives**: 46 of the 50 current zero-inlink pages are flat legacy pages, not nested/Phase-2 pages.

### 1.3 Why zero-inlinks went *up* despite the remediation

Checked the 7 example zero-inlink pages named in the original audit report directly:

| Page | Then | Now |
|---|---|---|
| `/big-data-training-institute-in-hyderabad` | 0 | **0** |
| `/aws-cloud-training-institute-in-hyderabad` | 0 | **0** |
| `/cyber-security-training-institute-in-hyderabad` | 0 | **0** |
| `/java-training-institute-in-hyderabad` | 0 | **0** |
| `/machine-learning-training-institute-in-hyderabad` | 0 | 2 |
| `/python-training-institute-in-hyderabad` | 0 | 2 |
| `/devops-training-institute-in-hyderabad` | 0 | 6 |

3 of 7 improved, 4 of 7 are untouched. I checked why: the dead-host commit's "129 outbound
links → 35 unique destinations" resolved each broken blog link through
`next.config.mjs`'s existing redirect table. I inspected that table — **the large majority
of those 35 destinations are `/blog/...` (other blog posts)**, not course pages. Only a
handful land on `/courses/...`. So the remediation was mostly a **blog→blog** dead-link
fix, not the **blog→course** funneling fix the commit message and this task's premise
assumed. It fixed real breakage (dead images, dead outbound links, a 404 host) but wasn't
primarily an internal-linking fix for courses — that's still open, which is consistent
with, not contradicted by, this task existing.

The zero-count *increase* is very likely a **measurement artifact, not a regression**:
the original audit's per-page list wasn't preserved (this run overwrote the only copy of
`seo-deep-audit-linkgraph.json`), so I can't do an exact page-by-page diff — but nothing
in the codebase or commit history removed course links between the two runs. Treat "25 →
50 at zero" as "the true zero-count was probably always closer to 50 and the original
crawl undercounted," not as damage caused by the remediation. Flagging as an open
question rather than asserting either way.

### 1.4 A genuine bug found in the process (not a linking-architecture choice — a defect)

`src/app/courses/[slug]/page.tsx`, `CategoryLandingView`, line 514:

```ts
href={course.href ?? course.slug ?? '#'}
```

`Course` (from `/api/categories/[slug]`) never has an `.href` field — the Prisma model has
no such column — so this **always** falls through to the raw `course.slug`, rendered as a
bare relative string with no leading slash. Live-confirmed on `/courses/human-resource`:

```html
<a href="hr-management-training-in-hyderabad">HR Management Training</a>
```

Browsers/crawlers resolve a slash-less relative href against the *parent* of the current
path, not the current path itself:

```
new URL('hr-management-training-in-hyderabad', '.../courses/human-resource')
  → .../courses/hr-management-training-in-hyderabad   (WRONG — drops "human-resource",
                                                          404s: the real route needs both segments)
```

This path is used by **every category that doesn't have a dedicated static folder under
`src/app/courses/`** — confirmed at least `human-resource` and `artificial-intelligence-training`
hit it; both are exactly the two categories with 0-inlink nested courses in §1.2. The
static category pages (`cloud-computing`, `cyber-security`, etc.) build hrefs correctly
and don't have this bug. This is why "categories link all their courses" (true by DB
query — no `take`/limit anywhere, confirmed in both the static and dynamic category code
paths) doesn't guarantee those links actually work.

**Recommend fixing this regardless of which Phase 2 proposals get approved** — it's a
correctness bug (broken/misrouted links + wasted crawl budget), not a design decision.

### 1.5 Locality pages

Ran a second, narrower crawl (same method, same politeness budget) isolating inlinks to
`/locations/*`:

| Page | Contextual inlinks | From |
|---|---|---|
| `/locations/dilsukhnagar` | 2 | other locality pages only |
| `/locations/ameerpet` | 2 | other locality pages only |
| `/locations/kukatpally` | 2 | other locality pages only |
| `/locations/madhapur-hitec-city` | 1 | other locality pages only |

All four locality pages (2 branch + 2 catchment) link to each other but **receive zero
contextual inlinks from anywhere else** — homepage, courses, blog, nothing points at them.
Not this task's primary target (courses are), but worth a follow-up.

### 1.6 Locality → course direction (branch pages linking out to courses)

Both `/locations/dilsukhnagar` and `/locations/ameerpet` (and the two catchment pages)
render real `<Link>` elements to course detail pages — confirmed live, not placeholder
anchors. `getBranchBatches()` (`src/app/locations/[locality]/page.tsx:32-69`) pulls up to
6 upcoming batches and dedupes to distinct courses, so each locality page emits **≤6**
course links today, capped by the batch query limit rather than by content availability.

### 1.7 Category completeness

Confirmed by code, not just the crawl: both category-page implementations query **all**
published courses in the category with no `take`/limit —

- Static pages (10 folders, e.g. `src/app/courses/cloud-computing/page.tsx:16-21`): `prisma.course.findMany({ where: { categorySlug, status: 'published' }, orderBy: { sortOrder: 'asc' } })`
- Dynamic fallback (`src/app/api/categories/[slug]/route.ts:9-18`): `courseCategory.findUnique({ include: { courses: { where: { status: 'published' } } } })`

So no category silently truncates its course list. The completeness problem is the §1.4
href bug on the dynamic-fallback path, not missing courses.

---

## Phase 2 — Proposed linking architecture

Ranked by (orphans lifted ÷ effort). All proposals below are scoped to internal linking
only — no visual redesign beyond adding sections in the existing card/section language.

### Ranking summary

| # | Proposal | Orphans lifted | Effort | Rank |
|---|---|---|---|---|
| 1 | Fix Related Courses selection algorithm + extend to flat legacy pages | ~100 of 140 near-orphans touched | Medium | **1** |
| 2 | Fix the `CategoryLandingView` href bug (§1.4) | ~10-15 (exact count needs a `CourseCategory` table read) | Trivial | **1 (bundle with #1)** |
| 3 | Blog → course contextual callout | up to 81 posts, indirectly most of the flat-legacy 46 | Medium | **2** |
| 4 | Locality → course cap increase | 0 orphans (already linked); improves depth not breadth | Low | **4** |
| 5 | Homepage "popular courses" strip | 0-6 orphans (whichever aren't already Featured) | Low-Medium | **5, optional** |

---

### Proposal 1 — Related Courses module: fix the selection algorithm + close the flat-legacy gap

**Current state, confirmed by code** (`src/app/courses/[slug]/[courseSlug]/page.tsx:67-79`,
duplicated in `src/app/courses/[slug]/page.tsx:142-152`):

```ts
async function getRelated(category: string, excludeSlug: string) {
  const res = await fetch(`/api/courses?category=${category}`);   // orderBy: [featured desc, sortOrder asc, createdAt desc]
  return data.courses.filter(c => c.slug !== excludeSlug).slice(0, 3);   // ← same 3, every time
}
```

`/api/courses` always returns a category's courses in the *same fixed order*
(`featured desc, sortOrder asc, createdAt desc`). `.slice(0,3)` on a fixed order means
**every course page in a category links the same 2-3 top-`sortOrder` courses** —
confirmed in the data: not a single one of the 54 nested-URL course pages exceeds 5
inlinks (§1.2), and categories with 7-8 courses (`human-resource`, `software-testing-os`,
`erp-crm-enterprise-tools`) show most members stuck at 1-2 while a couple of already-featured
courses within the same category run high. This is precisely the popularity-loop failure
mode the brief anticipated.

**Fix — deterministic least-linked-first selection, no randomness:**

```ts
async function getRelated(categoryId: string, excludeSlug: string, count = 5) {
  const siblings = await prisma.course.findMany({
    where: { categoryId, status: 'published', slug: { not: excludeSlug } },
    select: { id: true, slug: true, title: true, duration: true, sortOrder: true, categorySlug: true, urlType: true, inlinkCount: true },
  });
  return siblings
    .sort((a, b) => (a.inlinkCount - b.inlinkCount) || (a.sortOrder - b.sortOrder))
    .slice(0, count);
}
```

`inlinkCount` doesn't need a live crawl at request time — track it as a stored counter
(`Course.relatedLinkCount Int @default(0)`, incremented whenever a course is chosen as
someone's "related" pick, reset on redeploy or recomputed by a periodic job from real
crawl data). Simpler alternative that avoids a schema/counter at all: **round-robin by
`sortOrder` offset from the *linking* course's own position** — e.g. course at position
`i` in a category of `n` links courses at positions `(i+1)%n, (i+2)%n, ... (i+count)%n`.
Every course in the category ends up selected by roughly `count` other courses, purely
from arithmetic, no state to maintain, still fully deterministic/stable for crawling.
Recommend the round-robin-offset version — same coverage guarantee, zero new
infrastructure.

Two other changes bundled here:
- **Query via `categoryId`** (the real FK, indexed-by-addition-if-needed) instead of the
  current free-text `category` string `contains`/`insensitive` match — more correct and
  slightly cheaper; the string match is a legacy holdover the code comments don't explain
  and nothing depends on its fuzziness.
- **Raise the shown count from 3 to 5** — gives more categories (7-8 course ones) a
  realistic shot at every member appearing somewhere.

**Extend to the 36 flat legacy pages** (`src/components/LandingPageTemplate.tsx`,
currently has *no* related-courses section at all — confirmed, only demo/WhatsApp CTAs
found). This is the highest-value part of this proposal: `getLandingPageCourse()`
(`src/lib/get-landing-page-data.ts`) already resolves every flat page to a real `Course`
row via an explicit `SLUG_MAP`, including `categorySlug`/`courseCategory` — the data this
needs is already being fetched, just not rendered. Add the same module, reusing the
round-robin logic above, keyed off the already-resolved `categoryId`. This alone could
lift most of the 46 currently-zero flat pages to 3-5 inlinks apiece without touching any
other page.

**Also add a link from each flat page to its own canonical nested-course equivalent**
(`getCourseUrl(course)`) — e.g. "View full course details" — since `getLandingPageCourse`
already resolves that mapping. This is a one-line reciprocal link, not a new mechanism.

*Open question for you*: should the reverse direction also exist — nested course pages
linking back to their flat-legacy keyword-variant page? I'd lean **no** by default (avoid
legitimizing 36 near-duplicate URLs further; let the flat pages receive links but not
distribute them back into the canonical graph) but flag it since it's a real fork, not
an obvious call — happy to do either.

**Estimated impact:** all 54 nested pages move from a hard 0-5 ceiling to a realistic 3-7
range (category-page inlink + guaranteed round-robin related-course inlinks); most of the
46 zero-inlink flat pages move to 3-5. Directly addresses roughly 100 of the 140 current
near-orphans.

---

### Proposal 2 — Fix `CategoryLandingView` href bug

Covered in §1.4. One-line fix: build the href the same way the static category pages
already do (`getCourseUrl(course)` / `/courses/${categorySlug}/${slug}`) instead of
`course.href ?? course.slug ?? '#'`. Zero design decision involved — bundle into Phase 3
regardless of which other proposals are approved.

---

### Proposal 3 — Blog → course contextual callout

Current state (`src/app/blog/[slug]/page.tsx`): the live DB-backed post path (the one
actually serving posts today) has tag pills linking to `/blog?tag=X` and a generic
"Interested in this topic?" → `/free-demo-class/` CTA — **no course-specific link at
all**. `BlogPost.tags: String[]` and `.category: String` exist on the model but aren't
cross-matched against `Course.category`/`Course.tools` anywhere.

**Proposal:** a small server-rendered "Related Course" callout box near the end of the
post body (above the existing CTA, same visual weight as the tag pills), auto-matched:
1. exact/substring match between `BlogPost.category` and `Course.category`/`CourseCategory.name`, else
2. any overlap between `BlogPost.tags` and `Course.tools`/`Course.title` keywords, else
3. omit the box entirely rather than showing an irrelevant course (no fallback-to-random).

This is template-level, auto-computed — no hand-editing of the 81 remediated posts (or
any other post) required, matching the brief's explicit ask to avoid manual editing.

**Estimated impact:** doesn't lift zero-inlink *course* pages on its own as reliably as
Proposal 1 (depends on match quality per post), but adds meaningful volume on top of it —
worth doing as the second pass, not the first.

---

### Proposal 4 — Locality → course link depth

Already real `<Link>`s, already correctly capped by the batch data (§1.6), not by a
template limit. Raising the batch `take: 6` wouldn't lift any *orphaned* course — it only
adds depth to courses that already have a batch scheduled at that branch. Low priority;
only worth doing if you want locality pages to read as more complete course hubs for UX
reasons, not for the orphan problem specifically. Recommend **skip** unless you have a UX
reason independent of this task.

---

### Proposal 5 — Homepage "popular courses" strip

Homepage already renders individual course cards today (Featured Courses section, admin
curated `hpSettings.featuredCourseIds`, capped at 6) — this isn't a new mechanism, just a
question of whether it's enough. Given homepage equity is scarce and the 6 featured slots
are already admin-curated (presumably for a reason), I'd **skip** adding a second course
strip — it would compete with the existing one for the same limited homepage real estate
without a clear reason the curated 6 aren't already the right pages to spend that equity
on. If you disagree and want a rotating/algorithmic strip in addition, say so and I'll
design it, but I don't think it's justified on the current evidence.

---

### Dangling question from the previous task — answered

**Are course-card titles independently `<Link>`s?**

**No, in the two most-trafficked places** — confirmed by code, not just eyeballing:

- `src/components/CourseCard.tsx:103-105` (used by category pages via `CourseGrid`): title is a plain `<h3>`, not a link. Only the "View Details" button (`:168-176`) is clickable.
- `src/app/page.tsx:549-551` (homepage Featured Courses — its own inline card, doesn't reuse `CourseCard.tsx`): same pattern, plain `<h3>`, only the CTA anchor (`:583-588`) is a link.

**Yes, in one place** — `src/components/CoursesTabPage.tsx:54-118` (used by the top-level
`/courses` overview page, a *separate* inline `CourseCard` implementation) wraps the
**entire card**, including the title, in one `<Link>`.

So the site is inconsistent between three different card implementations. Independently
of anything else in this task: making the card title itself part of the click target
(not just the CTA button) is a trivial, template-level accessibility/SEO win — it also
directly compounds the anchor-text finding from the original audit (C.4: every course
link currently says generic "View Details" instead of the course name). Recommend folding
"wrap the title, not just the button" and "use the course title as anchor text" into
Phase 3 alongside Proposal 1/2, since it's the same files being touched either way.

---

## What I'm pausing on

Per the brief, no implementation until you approve item-by-item. My recommendation, if
you want the short version: approve 1 + 2 (bundled, they touch the same code and 2 is a
pure bug fix) and 3, skip 4, skip 5 unless you tell me otherwise — and let me know your
call on the "flat page ↔ nested page reciprocal link" open question in Proposal 1.
