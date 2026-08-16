# Deep SEO / GEO Implementation Audit — Coss Cloud Solutions

**Scope:** Beyond page metadata (that workstream is closed — production audit: CRITICAL 0 / WARNING 175 / INFO 25, remaining warnings are known editorial items). This audit covers crawl/indexation architecture, rendering performance, semantic structure & internal linking, structured data, local/GEO signals, and conversion instrumentation.

**Method:** Read-only. Live production checks against `https://www.cosscloudsol.com` at concurrency 5 (same politeness budget as `scripts/seo-audit.mjs`), plus static code review. Two new re-runnable tools were added for this pass:

- `scripts/seo-deep-audit.mjs` — crawls the full sitemap (303 URLs), strips `<header>`/`<nav>`/`<footer>` chrome, builds a contextual internal-link graph, and quantifies live staging-host leakage.
- Everything else was verified with targeted `curl`/grep against production and direct source reads — no new script needed for one-off checks (redirect-hop tracing, robots.txt, header inspection).

**Baseline context:** Feb 2026 peak was 316 clicks/wk; current is ~26/wk. Non-brand rankings sit at positions 9–78 (i.e. largely *indexed but not competitive*, not *deindexed*) — which is consistent with several of the findings below: pages exist and pass basic metadata checks, but lack the internal-link equity and structured-data completeness needed to rank higher than page 1 position 9+.

**No fixes were made in this pass.** Findings are tagged CRITICAL / HIGH / MEDIUM / LOW with file/URL evidence. The TOP-10 at the end is for item-by-item approval.

---

## A. Crawl & indexation architecture

### A1. robots.txt — LOW (no issue found)
`src/app/robots.ts` → live `https://www.cosscloudsol.com/robots.txt`:
```
User-agent: *        Allow: /     Disallow: /admin/, /api/
User-agent: GPTBot    Disallow: /admin/, /api/
User-agent: CCBot     Disallow: /admin/, /api/
Sitemap: https://www.cosscloudsol.com/sitemap.xml
Host: https://www.cosscloudsol.com
```
Correct: admin/api blocked, no JS/CSS/asset blocking, sitemap referenced, host directive present. `/admin` is also behind a real redirect/auth gate (confirmed live: `GET /admin` → `307`), so robots.txt is defense-in-depth, not the only protection.

### A2. Sitemap `lastmod` accuracy — **HIGH**
`src/app/sitemap.ts` sets `lastModified: now` (the instant the sitemap route executes) for **groups 1–4**: the 36 SEO course pages, category overview pages, dynamic `[courseSlug]` pages, and static pages (lines 76, 89, 102, 116) — this is the bulk of the site's indexable URLs. Only blog posts (`post.frontmatter.date`, line 133) and DB-sourced course/category/blog entries (`updatedAt`/`publishedAt`, lines 166, 183, 200) carry real dates.

**Live confirmation:** fetched `/sitemap.xml` (303 URLs) — **99 of 303 URLs (33%)** share the exact same second-precision timestamp (`2026-07-19T10:05:23.191Z`, the moment the sitemap was requested), spread arbitrarily across course/category/static pages regardless of when their content actually last changed. Per the brief's own framing: a `lastmod` that's provably fake trains Google to stop trusting the signal sitewide, undermining even the legitimately-dated blog/DB entries in the same sitemap.

**Fix direction (not applied):** groups 1–4 should source a real date — `PageSeo.updatedAt` where a DB override exists, falling back to a fixed content-authored date (or omit `lastModified` entirely for those groups rather than fabricate one, since Google treats a missing lastmod better than a provably-wrong one).

### A3. Index-bloat: crawlable tag-filter URLs — **MEDIUM-HIGH**
Every blog post footer renders crawlable tag links: `href="/blog?tag=AWS"`, `?tag=Cloud`, `?tag=Coss`, `?tag=Hyderabad`, `?tag=Institutes`, `?tag=Solutions` (confirmed via live blog post HTML, `src/app/blog/[slug]/page.tsx`). Live-tested `/blog?tag=AWS`:
- Status 200, `<link rel="canonical" href="https://www.cosscloudsol.com/blog"/>` (correctly self-canonicalizes to `/blog`)
- **But** `<meta name="robots" content="index, follow"/>` — no `noindex` directive.

Canonical alone doesn't stop crawl budget spend: Google still fetches each `?tag=` permutation before it can act on the canonical, and with 6 tags repeated across every post this is a standing, infinitely-recrawlable URL set — a plausible contributor to GSC's ~347 "Discovered/Crawled – currently not indexed" bucket named in the brief. No other filter/sort/pagination URL patterns were found crawlable elsewhere in the templates checked (course/category listing, jobs).

**Fix direction:** add `noindex, follow` to the `?tag=` route (or block via robots.txt query pattern) — canonical + noindex together are the standard combo for faceted/filter URLs Google shouldn't index but may still follow.

### A4. Host/slash canonicalization — **HIGH** (one real defect found)
Live-traced every hop with `curl -D -` (no `-L`, so each redirect is visible individually):

| From | Hops to 200 | Chain |
|---|---|---|
| `http://cosscloudsol.com/` | **2** | `http://cosscloudsol.com/` →308→ `https://cosscloudsol.com/` →308→ `https://www.cosscloudsol.com/` |
| `http://www.cosscloudsol.com/` | 1 | →308→ `https://www.cosscloudsol.com/` |
| `https://cosscloudsol.com/` | 1 | →308→ `https://www.cosscloudsol.com/` |
| `https://www.cosscloudsol.com/` | 0 | 200 directly (canonical target) |
| `/blog` vs `/blog/` | 1 | trailing slash redirects cleanly to non-trailing |

**Defect:** bare `http://cosscloudsol.com/` — the form used by aged backlinks, print material, and directory listings that predate HTTPS/www adoption — takes two redirect hops instead of one, each hop costing crawl budget and link-equity dilution. Fix is a single combined redirect rule (scheme + host in one 308) at the Vercel/hosting layer rather than two chained rules.

### A5. Leaked staging host `nextjs.cosscloudsol.com` — **CRITICAL**
Confirmed and quantified, and worse than the brief's framing ("equity leak to a duplicate site") — **the staging host no longer resolves at all**:
```
GET https://nextjs.cosscloudsol.com/  → 404, X-Vercel-Error: DEPLOYMENT_NOT_FOUND
```
This means every reference to it is a dead link/dead image, not merely a duplicate-content risk.

**Source-level scope** (content authored, `grep -r` over `content/`):
- `content/posts/*.mdx` (the **live** blog, rendered via `src/lib/posts.ts` → `/blog/[slug]`): **197 occurrences across ~140 files** — both `wp-content/uploads/...` image hotlinks (65 confirmed `<img src>` patterns) and outbound course/homepage links carrying `?utm_source=chatgpt.com` (evidence the content was AI-generated against the staging domain and never migrated).
- `content/pages/*.mdx` (171 files, 594 occurrences): **confirmed orphaned** — `grep -r "content/pages" src/` returns zero matches, this directory is not imported by any live route. Not a live SEO issue, but dead weight worth deleting or migrating separately.

**Live-rendered confirmation:** fetched a live blog post directly — its HTML contains `<img src="https://nextjs.cosscloudsol.com/wp-content/uploads/2024/12/AWS-training-Image-Banner.jpg">`, and that exact image URL returns **404** when fetched. So this isn't just a canonical-host nuisance — **images are visibly broken on live, indexed blog posts today**, which is both a UX/trust problem and removes those posts from Google Images eligibility entirely.

**Full-site live crawl** (`scripts/seo-deep-audit.mjs`, 303/303 pages fetched): *[numbers below from the corrected run — see note]*

> Note: the first crawl pass had a regex bug — the unescaped `.` in `nextjs.cosscloudsol.com` also matched Cloudinary's `nextjs-cosscloudsol-com` folder-naming convention (hyphens), which is a harmless self-hosted asset path, not a leak. The script was corrected (dots escaped, `src=`/`href=` breakdown added) and re-run; results below are from the corrected pass. See `seo-deep-audit-linkgraph.json` for the full per-page data.

- Pages with genuine `nextjs.cosscloudsol.com` references: **81/303 (27%)**
- Total occurrences: **402** (65 in `img src=`, 130 in `href=`, remainder in non-anchor/image text mentions e.g. plain-text URLs in body copy)
- **Every single one of the 81 affected pages is a `/blog/*` post** (matches the `content/posts` source scope above) — category, course, locality, and homepage templates were **not** actually affected; the Cloudinary path-segment coincidence (`nextjs-cosscloudsol-com` folder name, hyphens not dots) fully explains the inflated homepage/category counts (32x, 12x, etc.) seen in the first, buggy crawl pass.
- Worst offenders: `/blog/learn-aws-devops-in-hyderabad-with-coss-cloud-solutions` (34 occurrences, 16 outbound `href`s to the dead host), `/blog/learn-azure-devops-in-dilsukhnagar-hyderabad-with-coss-cloud-solutions` (14, 6 hrefs). Full 81-row breakdown in `seo-deep-audit-linkgraph.json`.

**Fix scope (separate approved task, not done here):** bulk find/replace `https://nextjs.cosscloudsol.com` → `https://www.cosscloudsol.com` for internal links across `content/posts/*.mdx`, and migrate the 65 hotlinked WP images to Cloudinary (the codebase already has a working Cloudinary pipeline — `src/lib/cloudinary.ts` — these images just were never run through it during the original migration).

### A6. 404 page — **MEDIUM**
Status code is correct: unmapped URLs return a real HTTP **404** (verified `X-Matched-Path: /[courseSlug]`, not a soft-200). But there is **no custom `not-found.tsx`** anywhere in `src/app` (confirmed: zero matches for `not-found*` under `src/app`). Consequences visible in the live response:
- `<title>` on the 404 is the site's default/homepage title, not something like "Page Not Found | Coss Cloud Solutions" — confusing browser-tab/history UX.
- No visible fallback content in the raw HTML shell (all content streams via React Server Component payload with no SSR'd text fallback) — a non-JS crawler or slow-JS client sees an essentially blank page.
- No recovery UX: no search box, no "popular courses" links, no CTA — a pure bounce with no chance to recapture the visitor, which matters given the traffic-recovery goal in this audit's context.

### A7. Response headers — LOW (no issue found)
HTML responses: `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (expected for dynamic/personalized-capable routes), no `X-Robots-Tag: noindex` anywhere, standard security headers present (CSP, HSTS, X-Frame-Options, X-Content-Type-Options). Static assets (e.g. `/sitemap.xml`) correctly get `Cache-Control: no-store, must-revalidate` + `Etag` + `X-Vercel-Cache: PRERENDER`. Nothing anomalous found.

---

## B. Rendering & performance (Core Web Vitals)

### B0. Lighthouse/PageSpeed API — **could not run, tooling gap**
`GOOGLE_PAGESPEED_API_KEY=""` in `.env.local` (empty). The public PSI endpoint without a key returned `429 Quota exceeded for quota metric 'Queries per day'` on the very first call. **No CWV numbers (LCP/CLS/TBT) could be collected this pass.** Recommend provisioning a real key (the admin SEO tooling already has a `/api/admin/seo/pagespeed` route built for this — `src/app/api/admin/seo/pagespeed/route.ts` — it's just never been given a working key) and re-running B1 as a follow-up.

### B1–B2. LCP element per template — not independently measurable without B0, but code-level signal is good
No raw `<img>` found as a hero/above-the-fold element on homepage, course, or blog templates — all hero images use `next/image`. Both `fill` usages in the codebase (`src/app/page.tsx:606-613` homepage Ken Burns background, `src/components/CourseCardThumb.tsx:75-81` course thumbnails) correctly pair `fill` with `sizes`. No missing-`sizes` violations found.

### B3. Image discipline sweep

**Raw `<img>` usage** (bypasses Next's image optimizer) — all confirmed **minor/non-LCP**:
| File:line | Context | Impact |
|---|---|---|
| `src/components/WpImg.tsx:45` | dedicated raw-`<img>` wrapper w/ error-fallback, used for WP/Cloudinary logos | wrapper, not itself the issue |
| `src/components/CourseCategoryPage.tsx:261,294` | hiring-partner logo grid, category pages | minor, lazy |
| `src/app/page.tsx:791,835,1082,1204` | badge logo, WhatsApp QR, hiring-partner grid, testimonial avatar (homepage) | minor, lazy |
| `src/components/JobCard.tsx:71` | company logo on job cards | minor, small icon |
| `src/components/CourseCardThumb.tsx:61` | SVG data-URI fallback only (real thumbnail path uses `next/image`) | fallback-only |

**Cloudinary URL discipline — one real gap:** `src/lib/cloudinary.ts` (`getCldUrl`) correctly injects `f_auto,q_auto` by default and is used for blog/course images. **But `src/lib/wpImages.ts`'s base `WP` constant has zero transformation params** (grep for `f_auto|q_auto` in that file: 0 matches) — every hero/icon/subcourse/company-logo/extra-image URL built from it ships as the raw original file. Current usage is limited to small logos (low CWV impact today), but it's a landmine: if any `wpImages.ts` field is ever wired into a larger visible image, it ships unoptimized.

**Alt text quality** (sample of 20 across templates): hand-authored static alts (logo, hero, `wpImages.ts` subcourse images — e.g. `"Data Analytics Training Hyderabad"`, `"AI Training Hyderabad"`) are descriptive and keyword-appropriate. **CMS-driven alts fall back to bare names with no context** — `alt={p.altText || p.name}` pattern in `CourseCategoryPage.tsx:296`, `page.tsx:1084`, `corporate-training/page.tsx:190`, `placements/page.tsx:218` (hiring-partner logos → just the company name); `alt={t.name}` for testimonial avatars (`page.tsx:1204`, just a person's name, no "photo of…" framing); `CourseCardThumb.tsx` course thumbnails → `alt={title}` (acceptable but minimal). Roughly 30-40% of sampled alts are generic-by-fallback rather than truly empty or truly descriptive — a MEDIUM, low-effort content-quality gap (add real `altText` in the CMS/admin panel for hiring partners and testimonials rather than relying on the name fallback).

### B4. Font loading — LOW (no issue found)
`src/app/layout.tsx:1-16` uses `next/font/google` for Raleway/Roboto, both `display: 'swap'`, self-hosted via CSS variables — no external Google Fonts `<link>`, no render-blocking font request, no preconnect needed (self-hosted).

### B5. Client-JS weight
- No bundle analyzer configured (`@next/bundle-analyzer` absent from `package.json`, no `.next/analyze` artifact) — bundle composition is not directly measurable without running one.
- No heavy legacy libraries found (no `moment`, no `lodash`/`lodash-es` full imports, no chart or animation JS libraries — all icons via tree-shakeable `lucide-react` named imports, all animation is CSS).
- All four money templates (homepage, course category, course detail, blog post) are correctly **server components** at the top level, with `force-dynamic` on the DB-driven course/blog routes.
- One plausible over-client component: `src/components/CategoryIconDisplay.tsx` is `'use client'` but is a pure prop→icon lookup with no hooks/state — rendered per-category on the homepage and course pages, so its (small) client-bundle cost is paid repeatedly. Low-impact, cheap to convert to a server component.
- `src/components/LandingPageTemplate.tsx` (used for the 36 SEO/`[courseSlug]` landing pages) is `'use client'` for the entire template rather than isolating just the interactive form — flagged for a deeper pass, not fully line-audited here.

### B6. Animation cost — LOW (no issue found)
Hero (`globals.css:468-609`) and category-section (`globals.css:2981-3007`) keyframes animate only `transform`/`opacity` (plus one paint-only `box-shadow` glow); `HeroLaptopComposition.tsx` mouse-parallax only ever sets `el.style.transform`. `will-change: transform` used appropriately. No layout-thrashing (`width`/`height`/`top`/`left`/`margin`) animations found in these sections.

---

## C. Semantic structure & internal linking — **the rank-growth engine, and where the biggest opportunity is**

### C.1–C.2. Heading hierarchy & breadcrumbs
- Homepage, Dilsukhnagar/Ameerpet locality pages, and the sampled category page all have exactly one H1 with keyword-bearing copy (e.g. locality H1: "IT Training Institute in Dilsukhnagar/Ameerpet…", live-confirmed).
- Visible breadcrumbs and `BreadcrumbList` JSON-LD are **built from two independently-maintained code paths that can drift**:
  - Static category pages (`CourseCategoryPage.tsx:109`): visible breadcrumb hardcodes a **placeholder `#` href** for the category level (`[{label:'Courses',href:'/courses/'},{label:data.name,href:'#'}]`), while the JSON-LD `BreadcrumbList` (`src/lib/course-schema.ts:163-196`) independently builds a real 4-level trail using its own `CATEGORY_SLUG_MAP` — live-confirmed 1 `BreadcrumbList` schema block present on `/courses/cloud-computing`, but its URLs don't match what's clickable on the page.
  - `/locations/[locality]`: visible breadcrumb only, **no `BreadcrumbList` JSON-LD at all**.
  - `/courses/[slug]/[courseSlug]` (the DB-driven detail pages — the majority of course URLs): hand-rolled inline breadcrumb, **no `BreadcrumbList` JSON-LD**.
  - Blog posts: no breadcrumb trail rendered at all (just "← Back to Blog").
  - Net: only static category pages get `BreadcrumbList` schema, and even there it disagrees with the visible trail. MEDIUM priority — breadcrumb rich results are a low-cost SERP-real-estate win being left on the table almost everywhere.

### C.3. Internal link graph — **CRITICAL, the single most consequential finding in this audit**

Full-site contextual-link crawl (`scripts/seo-deep-audit.mjs`, chrome-stripped — nav/header/footer excluded so only body/content links count, matching the brief's "excluding nav/footer" instruction):

- **194 course-type pages analyzed** (36 SEO course pages + dynamic `[courseSlug]` pages + `/courses/[cat]/[slug]` DB pages)
- **150 of 194 (77%) are near-orphaned: ≤2 contextual inlinks from anywhere else on the site**
- **The 25 worst have exactly ZERO contextual inlinks** — reachable only via sitemap/nav/footer, never referenced from any piece of body content anywhere on the site. Examples (all currently indexed, all at positions 9–78 per the brief's own numbers): `/big-data-training-institute-in-hyderabad`, `/machine-learning-training-institute-in-hyderabad`, `/aws-cloud-training-institute-in-hyderabad`, `/devops-training-institute-in-hyderabad`, `/cyber-security-training-institute-in-hyderabad`, `/python-training-institute-in-hyderabad`, `/java-training-institute-in-hyderabad` — full list of 25 (and the complete 194-row report) in `seo-deep-audit-linkgraph.json`.

This directly explains the "indexed but ranking 9–78" pattern described as the recovery goal: Google can find and index these pages via the sitemap, but has almost no contextual signal about which other pages consider them relevant/important, so they never accumulate the internal PageRank needed to outrank competitors for their target keywords. This is very plausibly the largest lever available to move rankings without new content — it's a linking-architecture fix, not a content-production one.

**Where the brief asked to check specifically:**
- *Do categories link all their courses?* — Partially: category pages do render "View Details" cards for their own courses (confirmed live on `/courses/cloud-computing`), but that only covers courses *within* that one category — it doesn't explain the near-orphan status of the 36 flat SEO landing pages, which sit largely outside the category taxonomy.
- *Do courses cross-link related courses?* — No dedicated "related courses" module found on the DB-driven course detail template during this pass; would need a follow-up code check specifically for that component if not already covered.
- *Do blog posts link relevant courses (money-page funneling)?* — Yes, blog posts do link out to courses — **but per A5, a large share of those outbound links point at the dead `nextjs.cosscloudsol.com` host instead of the real internal course URL**, which means the funneling intent exists in the content but the link equity is being thrown away on a 404 rather than reaching the course page. Fixing A5 (redirecting/rewriting those links to real internal URLs) directly improves C.3 — **the two issues compound each other and should be fixed together**: bulk-replacing `nextjs.cosscloudsol.com` links in blog posts with correct internal course URLs is simultaneously an A5 fix and a C.3 fix.
- *Do locality pages link branch-filtered courses?* — Confirmed: `/locations/dilsukhnagar` and `/locations/ameerpet` both render a "Courses Running at This Branch" section (live-confirmed H2 on both pages).

### C.4. Anchor-text quality — **MEDIUM, compounds C.3**
Live-confirmed on the category page: every single course-card link uses the identical generic anchor text **"View Details"** (`<a class="...bg-[#FF6B2B]..." href="/courses/cloud-computing/azure-administrator-certification-training-hyderabad">View Details</a>`, repeated for every course in the grid). The secondary category-switcher sidebar does use descriptive text (category names). Swapping "View Details" for the actual course title (or title + "→") on card links is a cheap, template-level change that improves the relevance signal on every one of the ~150 near-orphaned pages simultaneously — pairs naturally with fixing C.3.

---

## D. Structured data & rich-result opportunity

### D.1. Course schema completeness — **HIGH**
**Three independent, inconsistent Course-schema code paths**, and the one covering the most URLs is the weakest:

| Builder | Used by | `provider` | `offers`/price | `hasCourseInstance` |
|---|---|---|---|---|
| `src/lib/course-schema.ts` (`buildCourseSchemas`) | 12 static category pages | ✅ full, `@id`-linked | `offers` present but **no `price`/`priceCurrency`** | present but **hardcoded** 2 static `Place`s, no real dates |
| `LandingPageTemplate.tsx:133-152` | 36 SEO `[courseSlug]` pages | ✅ but plain, not `@id`-linked | **absent entirely** | hardcoded, no dates |
| `courses/[slug]/[courseSlug]/page.tsx` (DB-driven) | **the majority of actual course URLs** | **none — no automatic Course schema emitted at all** | none | none |

The DB already has everything needed and simply isn't wired in: `Batch` (`prisma/schema.prisma:254-275`) has `startDate`, `endDate`, `mode`, `centre`, `schedule`, `price` — the DB-driven course pages *display* real batch data (`courseBatches`, confirmed in the page component) but never pass it to a schema builder. No `aggregateRating`/reviews should be added (explicit project policy, respected here) — but `offers.price` from `Course.price`/`Batch.price` and real `hasCourseInstance` dates from `Batch.startDate/endDate` are legitimate, data-supported additions that unlock Google's Course/CourseInstance rich result on the pages that most need ranking help.

### D.2. FAQPage schema — **MEDIUM-HIGH, content-supported and currently unused where it matters most**
- Schema exists in `course-schema.ts:145-161` and `LandingPageTemplate.tsx:164-171` — but the latter has a **content/schema mismatch bug**: builds 10 FAQ items, page visibly renders all 10 (`.map`, line 694), but schema only includes `faqItems.slice(0, 5)` (line 166) — schema under-represents what's actually on the page.
- **Not emitted on blog posts at all** (`blog/[slug]/page.tsx` only emits `BlogPosting`), despite 50+ blog posts containing real "Frequently Asked Questions" sections in their MDX body (`content/posts/*.mdx`) — this is exactly the "content exists, schema doesn't" gap the brief asked to identify.
- `content/pages/*.mdx` also has real FAQ content but (per A5) that directory is unrendered/orphaned — not actionable until/unless that content is migrated into a live route.

### D.3. LocalBusiness (locality pages) — **MEDIUM**
`src/lib/global-schemas.ts:35-72`, used on `/locations/[locality]`:
- `openingHoursSpecification`: valid shape, but a single spec applies identical hours to all 7 days.
- `geo`: correctly sourced from branch settings, 6-decimal precision — live map embeds confirmed to match exactly (`17.367741,78.528543` Dilsukhnagar, `17.436986,78.447128` Ameerpet, no drift on either locality page or the homepage footer).
- **`hasMap`: absent entirely.**
- **`sameAs`: absent entirely** at the per-branch level (only the sitewide Organization schema has `sameAs`) — a locality page can't currently signal its own Google Business Profile link to Google via schema.

### D.4. Organization schema — LOW (no issue found)
`global-schemas.ts:102-163`, injected once in root layout. `logo` (structured `ImageObject`), `contactPoint` (telephone + contactType for both customer-service/admissions), and `sameAs` (5 URLs: Facebook, X, Instagram, LinkedIn, YouTube) are all present and **exactly match the footer's 5 social links** — confirmed not stale.

### D.5. Duplication check — **LOW-MEDIUM**
No full duplicate root `Organization`/`WebSite` graphs (root layout injects once, confirmed only one injection site). But: `course-schema.ts`'s `PROVIDER` constant reuses the **same `@id`** (`#organization`) as the global Organization node while carrying a *different* payload (extra `address[]`/`telephone`/`email` fields) — since JSON-LD merges by `@id` within a page, category pages that load both blocks risk Google merging conflicting property values for the same node. Several other templates (blog `BlogPosting.author/.publisher`, jobs `hiringOrganization`, `LandingPageTemplate`'s `Course.provider`) create anonymous nested `Organization` stubs instead of referencing `${SITE_URL}/#organization` — not full duplicates, but inconsistent and missing the entity-linking benefit `@id` referencing is meant to provide.

---

## E. Local/GEO signals

### E.1. NAP consistency — **HIGH, and it's a routing bug, not just a data bug**
Canonical source: `src/lib/get-branch-settings.ts` `FALLBACK` object.
- Dilsukhnagar: `+91 88851 66007`
- Ameerpet: `+91 77807 27374`

**The phone numbers themselves are consistent in visible text everywhere they're shown** (`+91 88851 66007` / `+91 77807 27374`, no formatting drift). The real problem is **scope**: sitewide chrome components — `SiteHeader.tsx`, `MobileStickyBar.tsx`, `WhatsAppWidget.tsx` (the floating widget on every page), and the footer's top quick-call/WhatsApp link — are **all hardcoded to the Dilsukhnagar number**, and render identically regardless of which page (including the Ameerpet locality page itself) the visitor is on. `lib/whatsapp.ts`'s `buildWhatsAppUrl` (used for batch-booking/job-apply messages) has the same hardcoded-Dilsukhnagar problem regardless of which branch the batch/job actually belongs to. Only `TopInfoBar.tsx` (shows both numbers) and the in-page NAP block on each locality page itself (`locations/[locality]/page.tsx:148`, correctly dynamic) get this right.

**Net effect:** a visitor on `/locations/ameerpet` who uses the sticky-bar "Call Now" button, the floating WhatsApp widget, the header's mobile call icon, or the footer's quick links is connected to the **Dilsukhnagar** branch — a real lead-misrouting bug, not a cosmetic inconsistency. `LandingEnrollForm.tsx`'s post-submit WhatsApp button has the identical bug: always opens Dilsukhnagar's number even when the visitor selected "Ameerpet" in the form's own branch dropdown.

**Secondary finding:** `src/lib/locations-data.ts`'s hand-authored address text (used for hero/directions copy on locality pages) and `get-branch-settings.ts`'s DB-fallback address are **two independently-maintained strings with materially different content** (different landmark names — "Bank of Maharashtra / Chai Vaai Cafe / Anjana Function Hall" vs. "Kamala Nagar" — not just formatting). A genuine content-source-of-truth fork worth consolidating.

### E.2. Locality-page internal visibility — not separately re-crawled this pass beyond the link-graph data already captured in C.3's JSON output (locality pages were included in the 303-URL crawl); flagging for inclusion in a C.3 follow-up read of `seo-deep-audit-linkgraph.json` rather than re-stating here.

### E.3. Local keyword coverage — **confirmed already fixed, no action needed**
Live-checked both branch pages: `<title>IT Training Institute in Dilsukhnagar, Hyderabad | Coss Cloud Solutions</title>` / `...in Ameerpet, Hyderabad...`, with matching H1s. The "training institute in {area}" pattern the brief asked to verify "post-fix" is confirmed live on both title and H1.

### E.4. Map embed regression check — **no regression, confirmed correct**
Live-extracted every `<iframe>` map embed on both locality pages and the homepage footer — all resolve to the exact verified coordinates (Dilsukhnagar `17.367741,78.528543`, Ameerpet `17.436986,78.447128`), including the Google-Place-linked embeds (`!2sComplete%20Open%20Source%20Solutions...` / `!2sCoss%20Cloud%20Solutions%20-%20Data%20Science...`) matching the correct named location per branch.

---

## F. Conversion instrumentation

### F.1–F.2. Lead-path inventory & tracking — **CRITICAL**
Full inventory (hero form, full enroll form, demo sidebar form, landing-page form, contact form, corporate form, WhatsApp widget, direct `wa.me` links, Free Demo CTAs, `tel:` links — file-level detail in the research notes) confirms **every single lead-capture surface is untracked**:
- The only `gtag`/`dataLayer` call in the entire `src` tree is a bare GA4 page-view tag (`src/components/GoogleAnalytics.tsx:26-29`) — live-confirmed measurement ID `G-7NMF1D9HZD`.
- Zero matches anywhere for `gtag(|dataLayer\.push|sendGAEvent|trackEvent|useAnalytics` outside that one file.
- Every form's success handler (7 different forms) only does a local `setState({kind:'success'})` — no analytics call, no URL change, nothing GA4 can observe.
- All `tel:` and `wa.me` anchors are plain `<a href>` with no click handler.

**Consequence:** GA4, as currently wired, cannot distinguish a form submit, a WhatsApp click, a tel click, or a Free Demo CTA click from ordinary page navigation. There is currently **no way to build a GA4 conversion goal** off this site, which matters directly for the stated goal of recovering clicks — without event-level conversion data, it's not possible to tell which of the (currently near-orphaned, per C.3) landing pages are actually producing leads versus just traffic, so link-equity and content-investment decisions are being made blind.

### F.3. `tel:`/`wa.me` per-branch correctness — see E.1 (same finding, cross-referenced there in full).

### F.4. Form success / conversion state — **HIGH**
No `/thank-you` route or any redirect-based signal exists anywhere (confirmed: zero route matches for `thank-you`/`thankyou`). Every form does an inline state swap only. This is the same root cause as F.1/F.2 — fixing it (redirect to a `/thank-you` URL, or fire a `gtag('event', 'generate_lead', …)` call on success) is the single change that would make GA4 conversion tracking possible at all.

### F.5. Friction found while crawling — LOW, mostly clean
- No broken anchors found: `#enroll-form` and `#top` both resolve to real `id` targets.
- Form UX itself is solid — all forms use `zod`/`react-hook-form` with inline `role="alert"` error messages and disabled/spinner submit states.
- The one real UX gap: **footer branch cards show address but no phone number at all** for either branch (`Footer.tsx` `buildBranchCard()` returns no `phone` field) — a visitor scanning the Ameerpet card in the footer sees no way to call that specific branch, only the unrelated hardcoded Dilsukhnagar number/WhatsApp link elsewhere in the footer.

---

## TOP-10 priority list (ranked by expected click/conversion impact vs. effort)

| # | Finding | Section | Impact | Effort | Why it's ranked here |
|---|---|---|---|---|---|
| 1 | **150/194 (77%) course pages near-orphaned; 25 with zero contextual inlinks** | C.3 | Very High | Medium | Most direct explanation for "indexed but ranking 9–78." Fixing internal linking (category→course, course→related course, blog→course) is the highest-leverage lever available without new content. |
| 2 | **81/303 live blog posts (402 occurrences: 130 href + 65 img) link to a dead staging host instead of real internal course URLs/Cloudinary images** | A5 / C.3 | Very High | Medium | Same root cause as #1's "blog funneling" gap — fixing this bulk find/replace is simultaneously a link-equity recovery (A5) and an internal-linking fix (C.3). Also fixes visibly broken hotlinked images on live posts. |
| 3 | **Sitewide chrome (header/sticky-bar/WhatsApp widget) hardcoded to Dilsukhnagar phone, misrouting Ameerpet leads** | E.1 | High | Low-Medium | Direct revenue leakage on every non-Dilsukhnagar page visit, not just an SEO issue — a visitor actively trying to convert gets sent to the wrong branch. |
| 4 | **Zero conversion tracking on any lead-capture surface (forms, WhatsApp, tel:, CTAs)** | F.1/F2/F4 | High | Medium | Can't measure what's working. Blocks data-driven prioritization of every other fix on this list going forward. |
| 5 | **Sitemap `lastmod` fabricated for 33% of URLs (uniform build-time timestamp)** | A2 | High | Low | Cheap to fix (use real `updatedAt`), but currently actively degrading Google's trust in freshness signals sitewide. |
| 6 | **Generic "View Details" anchor text on every internal course link** | C.4 | Medium-High | Low | Near-zero-cost template change that directly compounds fix #1 — every near-orphaned page that does get a new inlink will benefit more from a descriptive anchor. |
| 7 | **`/blog?tag=X` crawlable, indexable, uncanonicalized-enough URL bloat** | A3 | Medium | Low | Cheap `noindex,follow` fix, plausible contributor to the ~347 "Discovered/not indexed" GSC bucket. |
| 8 | **2-hop redirect for bare-`http://` canonicalization** | A4 | Medium | Low | One redirect-rule change; recovers crawl budget/link equity from any legacy backlink using the bare-http form. |
| 9 | **Course JSON-LD fragmented across 3 builders; DB-driven course pages (majority of URLs) emit no Course schema at all; no price/real batch dates anywhere** | D.1 | Medium-High | Medium-High | Real rich-result opportunity, but requires wiring real `Batch` data into a schema builder — more implementation work than the above. |
| 10 | **FAQPage schema absent on blog posts despite abundant on-page FAQ content** | D.2 | Medium | Low-Medium | Cheap, content-supported rich-result opportunity; also fix the existing 10-vs-5 FAQ schema/content mismatch in `LandingPageTemplate.tsx` while touching this code. |

**Not in the top 10 but worth a follow-up pass:** no custom 404 page (A6), `wpImages.ts` missing Cloudinary transforms (B3), missing `hasMap`/`sameAs` on per-branch LocalBusiness schema (D.3), breadcrumb visible/schema drift on category pages (C.1), and re-running B0 (Core Web Vitals) once a working `GOOGLE_PAGESPEED_API_KEY` is provisioned — this pass could not collect any LCP/CLS/TBT numbers due to API quota exhaustion without a key.

---

## Tooling added this pass
- `scripts/seo-deep-audit.mjs` — re-runnable, read-only, concurrency-5 crawler for the internal link graph and staging-host leak detection. Output: console summary + `seo-deep-audit-linkgraph.json` (full per-page inlink/leak data, including the complete 194-row course-page inlink report referenced in C.3).
