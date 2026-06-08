# Claude Code — Fix All SEO + GEO Issues Found in Live Audit
# Project: C:\Users\zoomn\OneDrive\Dokumen\CLOUDE Code\coss-nextjs-complete\nextjs-project-coss
# Source: Live audit of https://coss-six.vercel.app

---

## CONFIRM PROJECT FIRST
Run: pwd && cat package.json | grep '"name"'
Must show coss project path. Stop if it shows nextskill.

---

## BEFORE YOU START — Read these files:
```
src/lib/seo-seed.ts
src/lib/get-page-seo.ts
src/lib/all-pages-registry.ts
src/lib/global-schemas.ts
src/app/layout.tsx
src/components/SiteHeader.tsx
src/components/FooterLogo.tsx
```
Report what you find in each before making changes.

---

## FIX 1 — seo-seed.ts: Replace ALL NextSkill + Bengaluru + localhost

This is the most critical fix. The file still has wrong brand, city, and URLs.

In src/lib/seo-seed.ts find and replace:

### Homepage SEO seed:
```
title: "Best IT Training Institute in Bengaluru | NextSkill"
→ "Best IT Training Institute in Hyderabad | Coss Cloud Solutions"

description: "NextSkill: Top IT training in Bengaluru. Cloud, DevOps & 30+ courses. 5000+ placed. 100% placement support. Centres in Indiranagar, Whitefield & Electronic City."
→ "Coss Cloud Solutions: Top IT training in Hyderabad. Cloud, DevOps & 30+ courses. 5,000+ placed. 100% placement support. Centres in Dilsukhnagar & Ameerpet."

og.title: same as title above
og.description: same as description above
twitter.title: same as title above
twitter.description: same as description above

canonical: "http://localhost:3000" → "https://www.cosscloudsol.com"
og.url: "http://localhost:3000" → "https://www.cosscloudsol.com"
```

### About Us SEO seed:
```
title: "About NextSkill — IT Training Institute Bengaluru"
→ "About Coss Cloud Solutions — IT Training Institute Hyderabad"

description: "Learn about NextSkill — a leading IT training institute in Bengaluru. 5000+ students placed, expert trainers, Indiranagar, Whitefield & Electronic City branches."
→ "Learn about Coss Cloud Solutions — a leading IT training institute in Hyderabad. 5,000+ students placed, expert trainers, Dilsukhnagar & Ameerpet branches."

og.title: match new title above
og.description: match new description above
twitter.title: match new title
twitter.description: match new description

keywords: "NextSkill Bengaluru, IT training institute Bengaluru, about us, best software training institute, Indiranagar training centre"
→ "Coss Cloud Solutions Hyderabad, IT training institute Hyderabad, about us, best software training Hyderabad, Dilsukhnagar training centre, Ameerpet training centre"

canonical: "http://localhost:3000/about-us/" → "https://www.cosscloudsol.com/about-us"
og.url: same fix
```

### Blog SEO seed:
```
title: "IT Training Blog & Career Tips | NextSkill"
→ "IT Training Blog & Career Tips | Coss Cloud Solutions"

description: "Read the latest IT articles, career tips, tech tutorials & training guides from NextSkill experts. Stay ahead in Cloud, DevOps, AI & Data Science."
→ "Read the latest IT articles, career tips, tech tutorials & training guides from Coss Cloud Solutions experts. Stay ahead in Cloud, DevOps, AI & Data Science."

og.title: "IT Training Blog & Career Tips | NextSkill"
→ "IT Training Blog & Career Tips | Coss Cloud Solutions"

og.description: same fix — replace "NextSkill" with "Coss Cloud Solutions"
twitter.title: same fix
twitter.description: same fix

canonical: "http://localhost:3000/blog/" → "https://www.cosscloudsol.com/blog"
og.url: same fix
```

### Any other pages in seo-seed.ts:
Search the entire file for:
- "NextSkill" → "Coss Cloud Solutions"
- "Bengaluru" → "Hyderabad"
- "Bangalore" → "Hyderabad"
- "Indiranagar" → "Dilsukhnagar"
- "Whitefield" → "Ameerpet"
- "Electronic City" → "HITEC City"
- "http://localhost:3000" → "https://www.cosscloudsol.com"
- "localhost:3000" → "www.cosscloudsol.com"

---

## FIX 2 — get-page-seo.ts: Fix default/fallback SEO values

In src/lib/get-page-seo.ts:
Search for any default title, description, canonical, og.url that 
contains NextSkill, Bengaluru, Bangalore, or localhost.
Apply same replacements as Fix 1.

---

## FIX 3 — Fix double pipe in page titles

Category pages render titles like:
"Best Data, Analytics and BI Training Institute in Hyderabad |  | Coss Cloud Solutions"

The empty middle segment creates a double pipe "| |".

In src/app/layout.tsx find the title template:
```ts
template: '%s | %s | Coss Cloud Solutions'
OR
template: '%s |  | Coss Cloud Solutions'
```
Change to:
```ts
template: '%s | Coss Cloud Solutions'
```

Also check src/lib/build-course-page-metadata.ts and 
src/lib/build-category-page-metadata.ts for title construction 
that adds an empty segment.

---

## FIX 4 — Fix og:image on all category pages

In src/lib/build-category-page-metadata.ts and
src/lib/build-course-page-metadata.ts:

Find:
```ts
images: [{ url: '/logo.png' }]
OR
og.image: 'https://www.cosscloudsol.com/logo.png'
```

Replace with:
```ts
images: [
  {
    url: '/og-image.jpg',
    width: 1200,
    height: 630,
    alt: '[page title] — Coss Cloud Solutions',
  }
]
```

---

## FIX 5 — Fix company logo alt tags

Search ALL files for:
```
alt="Hiring company"
alt='Hiring company'
```

These appear on every category page in the "Companies That Hire" section.

Replace each with the actual company name based on the image filename:
- google.jpg → alt="Google"
- ibm.jpg → alt="IBM"
- oracle.jpg → alt="Oracle"
- hcl.jpg → alt="HCL Technologies"
- wipro.jpg → alt="Wipro"
- tcs.jpg → alt="TCS"
- tech_mahindra.jpg → alt="Tech Mahindra"
- infosys.jpg → alt="Infosys"
- accenture.jpg → alt="Accenture"
- cognizant.jpg → alt="Cognizant"
- capgemini.jpg → alt="Capgemini"
- adp.jpg → alt="ADP"
- airtel.jpg → alt="Airtel"
- hsbc.jpg → alt="HSBC"
- genpact.jpg → alt="Genpact"
- ericsson.jpg → alt="Ericsson"
- bank_of_america.jpg → alt="Bank of America"
- wells_fargo.jpg → alt="Wells Fargo"
- sonata.jpg → alt="Sonata Software"
- synopsys.jpg → alt="Synopsys"

For any other image filename not listed above, use the filename 
(without extension, capitalised) as the alt text.

The fix should be in the component/data file that renders this section,
likely in:
- src/components/CourseCategoryPage.tsx
- src/data/courses-data.ts
- src/lib/seo-seed.ts (if companies are defined there)

---

## FIX 6 — Fix logo alt text stutter in SiteHeader + FooterLogo

In src/components/SiteHeader.tsx:
Find the logo image:
```tsx
<img src="/logo.png" alt="CCossCloud Solutions" />
OR alt="CCoss Cloud Solutions"
```
Replace with: alt="Coss Cloud Solutions"

In src/components/FooterLogo.tsx:
Same fix — ensure alt="Coss Cloud Solutions"

Also check for any <span> next to the logo that renders the brand name.
If it shows "CCossCloud Solutions" fix the text to "Coss Cloud Solutions".

---

## FIX 7 — Standardise Hiring Partners stat to 200+

Currently inconsistent:
- Homepage shows: 200+ Hiring Partners
- About Us shows: 50+ Hiring Partners

Find ALL occurrences of "50+ Hiring Partners" or "50+\nHiring Partners"
in src/app/about-us/page.tsx and any shared stats data file.
Change "50+" to "200+" for Hiring Partners ONLY.

Keep all other stats (students, courses, years) unchanged.

---

## FIX 8 — Delete or fix broken blog post /blog/a

Check if there is a file at:
  src/app/blog/a/page.tsx
  content/posts/a.mdx
  OR an entry in the blog data/CMS with slug "a"

If it's a page file — delete it.
If it's in the CMS/admin panel — note it for manual deletion.
If it's in a blog data array — remove the entry with slug "a".

---

## FIX 9 — Standardise brand name capitalisation

Search for "COSS Cloud Solutions" (all caps COSS):
```
grep -rn "COSS Cloud Solutions" src/ --include="*.tsx" --include="*.ts"
```

Replace ALL instances of "COSS Cloud Solutions" with "Coss Cloud Solutions"
EXCEPT in:
- CSS class names
- Variable names  
- Comments

The canonical brand name is "Coss Cloud Solutions" not "COSS Cloud Solutions".

---

## FIX 10 — global-schemas.ts: Check for any remaining wrong values

Open src/lib/global-schemas.ts.
Search for:
- Any Bengaluru/Bangalore location references
- Any NextSkill references
- Any localhost URLs
- numberOfItems: 36 → change to 30 (courses offered)
- Any "10+" years references → change to "15+"
- "2014" → "2010" (founding date, if present)

---

## VERIFICATION AFTER ALL FIXES

Run: npm run build

Then run these checks:
```bash
grep -rn "NextSkill\|Bengaluru\|Bangalore\|Indiranagar\|Whitefield\|Electronic City\|localhost:3000" src/ --include="*.tsx" --include="*.ts" --include="*.js"
```
Expected: ZERO matches.

```bash
grep -rn "COSS Cloud Solutions" src/ --include="*.tsx" --include="*.ts"
```
Expected: ZERO matches (should all be "Coss Cloud Solutions").

```bash
grep -rn "alt=\"Hiring company\"" src/ --include="*.tsx" --include="*.ts" --include="*.jsx"
```
Expected: ZERO matches.

---

## COMMIT

git add -A
git commit -m "fix: resolve all SEO/GEO audit issues — NextSkill/Bengaluru removed, canonicals fixed, logo alts corrected, stats standardised"
git push origin main

---

## DO NOT TOUCH
- URL slugs or route paths
- Course card components (CourseCard.tsx, CourseGrid.tsx)
- Form logic or API routes
- node_modules, .git
- Any file not mentioned above
