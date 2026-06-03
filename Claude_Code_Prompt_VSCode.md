# Claude Code — Implement Upgraded Course Cards
# Project: C:\Users\zoomn\OneDrive\Dokumen\CLOUDE Code\coss-nextjs-complete\nextjs-project-coss
# Repo: https://github.com/CossCloudSol/coss

---

## BEFORE YOU START

Read these files first so you understand the project:
```
src/app/layout.tsx
src/app/globals.css
tailwind.config.ts
src/app/courses/data-analytics-bi/page.tsx
src/components/   ← list all files here
src/lib/          ← list all files here
content/          ← list top-level folders
```

Do NOT make any changes until you have read all of the above.
Report back what you found (file structure, how course data is stored,
whether Tailwind or CSS Modules is used, existing card component names).

---

## TASK OVERVIEW

Replace the existing course card section on all 12 category pages with
the upgraded card design. Implement as a reusable React component.

---

## STEP 1 — Add fonts to `tailwind.config.ts`

Extend the fontFamily section:

```ts
fontFamily: {
  display: ['Clash Display', 'sans-serif'],
  body:    ['Bricolage Grotesque', 'sans-serif'],
},
```

---

## STEP 2 — Add font imports to `src/app/globals.css`

Add at the very top (before any existing rules):

```css
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600&display=swap');

body {
  font-family: 'Bricolage Grotesque', sans-serif;
}
```

---

## STEP 3 — Create `src/components/CourseCard.tsx`

Create this file with the EXACT design spec below.

### Props interface

```ts
export interface CourseCardProps {
  title: string
  badge: string
  badgeVariant: 'orange' | 'teal' | 'violet' | 'rose' | 'amber' | 'green'
  accentVariant: 'hr' | 'cloud' | 'medical' | 'devops' | 'sap' | 'oracle' |
                 'data' | 'security' | 'fullstack' | 'digital' | 'softskills' | 'quantum'
  duration: string
  mode: string
  level: string
  rating: number
  reviewCount: string
  enrolledCount: string
  description: string
  highlights: [string, string]
  originalPrice: string
  discountedPrice: string
  emi: string
  urgency: string
  href: string
  animationIndex?: number
}
```

### Visual structure (top to bottom)

```
┌──────────────────────────────────────────────────┐
│  [4px accent strip — left edge, full height]      │
│  CARD HEADER  bg: gradient(145deg,#0D1B2A,#1B3A5C)│
│  padding: 22px 20px 18px  min-height: 155px       │
│  ┌ [badge pill] ─────────────────────────────── ┐ │
│  │ Course Title  (font-display, 18px, 600, #fff) │ │
│  │ [⏱ Duration] [🏠 Mode] [📊 Level]  chips     │ │
│  └───────────────────────────────────────────── ┘ │
├──────────────────────────────────────────────────┤
│  CARD BODY  padding: 18px 20px  flex-col gap-14px │
│  ★★★★★  4.9  (reviews)       [Enrolled pill]      │
│  Description  13px #475569  line-height 1.65       │
│  ✓ highlight one                                   │
│  ✓ highlight two                                   │
├──────────────────────────────────────────────────┤
│  1px divider #F1F5F9                               │
├──────────────────────────────────────────────────┤
│  CARD FOOTER  padding: 14px 20px 18px             │
│  ₹XX,XXX  (strikethrough 11px #94A3B8)            │
│  ₹XX,XXX  (Clash Display 22px bold #0D1B2A)       │
│  EMI text  (10px #64748B)         [View Details→] │
├──────────────────────────────────────────────────┤
│  URGENCY STRIP  bg:#FFF7ED  border-top:#FED7AA    │
│  ⚠ Urgency message  (11px #C2410C bold)           │
└──────────────────────────────────────────────────┘
```

### Tailwind implementation

**Card wrapper:**
```
bg-white rounded-[20px] overflow-hidden border border-black/[0.07]
shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col
transition-[transform,box-shadow] duration-[220ms] ease-[ease]
hover:-translate-y-[6px] hover:shadow-[0_20px_48px_rgba(0,0,0,0.13)]
```

**Fade-up animation** — add to globals.css:
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: no-preference) {
  .animate-fade-up {
    animation: fadeUp 0.5s ease both;
  }
}
```
Apply `animate-fade-up` to each card and set inline style
`animationDelay: \`${(animationIndex ?? 0) * 0.05}s\``

**Card header:**
```
relative p-[22px_20px_18px] min-h-[155px] overflow-hidden
```
Inline style: `background: 'linear-gradient(145deg, #0D1B2A 0%, #1B3A5C 100%)'`

Add two decorative pseudo-elements via a wrapper `<div>` with absolute positioning:
- Circle top-right: `absolute -top-[30px] -right-[30px] w-[130px] h-[130px] rounded-full bg-white/[0.04] pointer-events-none`
- Oval bottom: `absolute -bottom-[20px] left-1/2 w-[200px] h-[60px] rounded-full bg-white/[0.025] pointer-events-none`

**Accent strip** — 4px left edge, full height, absolute positioned:
```
absolute left-0 top-0 bottom-0 w-1 rounded-r-sm
```
Inline gradient style by accentVariant:
```ts
const accentGradients: Record<string, string> = {
  hr:         'linear-gradient(180deg, #FF6B2B, #FF9A6B)',
  cloud:      'linear-gradient(180deg, #0BA5A0, #34D399)',
  medical:    'linear-gradient(180deg, #7C3AED, #A78BFA)',
  devops:     'linear-gradient(180deg, #E11D48, #FB7185)',
  sap:        'linear-gradient(180deg, #0369A1, #38BDF8)',
  oracle:     'linear-gradient(180deg, #D97706, #FCD34D)',
  data:       'linear-gradient(180deg, #6366F1, #A5B4FC)',
  security:   'linear-gradient(180deg, #DC2626, #F87171)',
  fullstack:  'linear-gradient(180deg, #059669, #6EE7B7)',
  digital:    'linear-gradient(180deg, #DB2777, #F9A8D4)',
  softskills: 'linear-gradient(180deg, #7C3AED, #C4B5FD)',
  quantum:    'linear-gradient(180deg, #0D9488, #5EEAD4)',
}
```

**Badge** — inline-flex items-center gap-[5px] px-[11px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.3px] mb-[10px] text-white
Badge bg by variant:
```ts
const badgeBg: Record<string, string> = {
  orange: '#FF6B2B',
  teal:   '#0BA5A0',
  violet: '#7C3AED',
  rose:   '#E11D48',
  amber:  '#D97706',
  green:  '#059669',
}
```
Badge dot: `inline-block w-[6px] h-[6px] rounded-full bg-white/70`

**Card title:**
```
font-display text-[18px] font-semibold text-white leading-[1.3] mb-[14px] tracking-[-0.2px]
```

**Meta chips:**
```
inline-flex items-center gap-[5px] bg-white/10 border border-white/[0.14]
text-white/85 rounded-full px-[11px] py-[4px] text-[11px] font-medium
backdrop-blur-sm
```
Chip SVG icons (12×12, stroke-only, opacity-80):
- Duration: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
- Mode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
- Level: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M6 20V10M12 20V4M18 20v-6"/></svg>`

**Rating row:**
```
flex items-center gap-[10px]
```
- Stars: `text-amber-400 text-[13px] tracking-[1px]` → `★★★★★`
- Score: `text-[13px] font-semibold text-slate-800`
- Review count: `text-[12px] text-slate-400`
- Enrolled pill: `ml-auto bg-sky-50 text-sky-700 text-[11px] font-semibold px-[10px] py-[3px] rounded-full border border-sky-200`

**Description:** `text-[13px] leading-[1.65] text-slate-500 flex-1`

**Highlights wrapper:** `flex flex-col gap-[6px]`
Each highlight item: `flex items-center gap-[7px] text-[12px] text-gray-700 font-medium`
Check icon (14×14, stroke #10B981, strokeWidth 2.5):
```tsx
<svg className="w-[14px] h-[14px] text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
  <polyline points="20 6 9 17 4 12"/>
</svg>
```

**Divider:** `h-px bg-slate-100`

**Card footer:** `flex items-center justify-between gap-3 px-5 py-[14px_20px_18px]`

**Price block:**
- Original: `text-[11px] text-slate-400 line-through mb-[1px]`
- Main: `font-display text-[22px] font-bold text-[#0D1B2A] leading-none`
- EMI: `text-[10px] text-slate-500 mt-[2px]`

**CTA button:**
```
inline-flex items-center gap-[6px] bg-[#FF6B2B] text-white
px-5 py-[11px] rounded-xl text-[13px] font-semibold whitespace-nowrap
tracking-[0.1px] transition-[background,transform] duration-[180ms]
hover:bg-[#e85a1e] hover:scale-[1.03]
```
Arrow SVG (14×14): `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
Wrap in `<Link href={href}>` (Next.js Link)

**Urgency strip:**
```
bg-[#FFF7ED] border-t border-[#FED7AA] px-5 py-[7px]
flex items-center gap-[6px] text-[11px] font-semibold text-[#C2410C]
```
Info circle SVG (12×12):
`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`

---

## STEP 4 — Create `src/components/CourseGrid.tsx`

```tsx
import CourseCard, { CourseCardProps } from './CourseCard'

interface CourseGridProps {
  courses: CourseCardProps[]
}

export default function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
      {courses.map((course, i) => (
        <CourseCard key={course.title} {...course} animationIndex={i} />
      ))}
    </div>
  )
}
```

---

## STEP 5 — Create `src/lib/courseData.ts`

Create typed course arrays for all 12 categories.
Pull the exact course titles, durations, and levels from what already
exists in each category page file (read the page files first).

Use this category → accentVariant mapping:

| Category slug              | accentVariant | badgeVariant |
|---------------------------|---------------|--------------|
| data-analytics-bi          | data          | teal         |
| cloud-computing            | cloud         | teal         |
| devops-multi-cloud         | devops        | rose         |
| programming-full-stack     | fullstack     | green        |
| data-engineering           | data          | violet       |
| cyber-security             | security      | rose         |
| erp-crm-enterprise-tools   | sap / oracle  | amber        |
| software-testing-os        | devops        | orange       |
| digital-design             | digital       | violet       |
| professional-soft-skills   | softskills    | green        |
| human-resource             | hr            | orange       |
| quantum-computing          | quantum       | teal         |

Each course object must include all CourseCardProps fields.
For `href`, use the individual course page URL already present in
the category page (e.g. `/data-analytics-training-institute-in-hyderabad`).
For prices, use the data from the existing page or reasonable estimates
consistent with the site's pricing (₹15,000–₹45,000 range).
For ratings/reviews/enrolled, use the existing data if present or
realistic values consistent with the live site (4.7–4.9 ratings).

Export each category as a named const, e.g.:
```ts
export const dataAnalyticsBiCourses: CourseCardProps[] = [ ... ]
export const cloudComputingCourses: CourseCardProps[] = [ ... ]
// etc. for all 12
```

---

## STEP 6 — Update all 12 category pages

For each page in `src/app/courses/[category]/page.tsx`:

1. Add imports at the top:
```tsx
import CourseGrid from '@/components/CourseGrid'
import { xxxxxCourses } from '@/lib/courseData'
```

2. Find the section that renders the existing course cards.
   Look for: a `<section>` or `<div>` containing course card markup,
   OR a heading like "Course Details" or "Courses We Offer",
   OR any `.map()` over a course array.

3. Replace ONLY that section with:
```tsx
<section className="py-12 px-4 bg-[#F0F2F5]">
  <div className="max-w-7xl mx-auto mb-10 text-center">
    <h2 className="font-display text-3xl font-bold text-[#0D1B2A] tracking-tight">
      Courses We Offer
    </h2>
    <p className="mt-2 text-slate-500 text-sm">
      Choose the right programme for your goals
    </p>
  </div>
  <CourseGrid courses={xxxxxCourses} />
</section>
```

4. Keep EVERYTHING else on each page untouched:
   hero section, breadcrumb, stats bar, tools grid,
   "Why Learn" section, company logos, career roles, FAQ, CTA, footer.

Category → import name mapping:
```
data-analytics-bi         → dataAnalyticsBiCourses
cloud-computing           → cloudComputingCourses
devops-multi-cloud        → devopsMultiCloudCourses
programming-full-stack    → programmingFullStackCourses
data-engineering          → dataEngineeringCourses
cyber-security            → cyberSecurityCourses
erp-crm-enterprise-tools  → erpCrmCourses
software-testing-os       → softwareTestingCourses
digital-design            → digitalDesignCourses
professional-soft-skills  → professionalSoftSkillsCourses
human-resource            → humanResourceCourses
quantum-computing         → quantumComputingCourses
```

---

## STEP 7 — Verify

Run these commands one by one:
```bash
npm run build
```
Fix any TypeScript or Tailwind errors before moving on.
Then:
```bash
npm run dev
```
Open these URLs and confirm cards render correctly:
- http://localhost:3000/courses/data-analytics-bi
- http://localhost:3000/courses/cloud-computing
- http://localhost:3000/courses/human-resource

---

## HARD RULES — Do NOT violate these

1. Never touch the hero, breadcrumb, stats, tools, FAQ, CTA, or footer sections
2. Never delete or rename existing components — only add new ones
3. All `href` values must be real URLs from the existing page content
4. Use Next.js `<Link>` for the "View Details" button, not `<a>`
5. If a category page uses MDX or fetches data differently, adapt the
   import pattern but keep the same CourseGrid component output
6. The `font-display` Tailwind class must resolve to 'Clash Display'
   (confirm in tailwind.config.ts after Step 1)
7. Run `npm run build` at the end — zero errors required

---

## REFERENCE FILES (attached)

- `Course_Cards_3col.html` — pixel-perfect visual reference for the card
- This prompt file — follow every step in order

Start by reading the project files listed in "BEFORE YOU START", then proceed step by step.
