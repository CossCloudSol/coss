# Fix: Move Category Label to Top-Right of Card Header

## Problem
In `src/components/CourseCard.tsx`, the category label (e.g. "HUMAN RESOURCE",
"DATA ANALYTICS & BI") is positioned top-left, directly overlapping the badge
pill ("Popular", "High Demand", "Newly Added").

This makes both elements unreadable. The label must move to the TOP-RIGHT.

---

## Current layout (broken)
```
┌─────────────────────────────────────────┐
│ [Popular]  HUMAN RESOURCE ← overlap!    │  ← both top-left
│ HR Recruitment Training                 │
│ [45 Days] [Classroom] [Beginner]        │
└─────────────────────────────────────────┘
```

## Target layout (fixed)
```
┌─────────────────────────────────────────┐
│ [Popular]              HUMAN RESOURCE   │  ← badge left, label right
│ HR Recruitment Training                 │
│ [45 Days] [Classroom] [Beginner]        │
└─────────────────────────────────────────┘
```

---

## The fix

Open: `src/components/CourseCard.tsx`

### 1. Find the top row of the card header

Look for the JSX that renders both the badge and the category label together.
It will look something like this:

```tsx
<div className="...">
  <span className="... badge ...">{badge}</span>
  <span className="... category-label ...">{categoryLabel}</span>
</div>
```

OR the category label may be absolutely positioned:
```tsx
<span className="absolute top-... left-... text-... uppercase">
  {categoryLabel}
</span>
```

OR it may be a separate div above/beside the badge:
```tsx
<div className="text-xs uppercase text-white/60 mb-1">{category}</div>
<div className="badge ...">{badge}</div>
```

---

### 2. Apply this fix

Make the top row a flex row with space-between:

```tsx
{/* Top row: badge left, category label right */}
<div className="flex items-start justify-between gap-2 mb-[10px]">
  
  {/* Badge — left side */}
  <span
    className="inline-flex items-center gap-[5px] px-[11px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.3px] text-white"
    style={{ background: badgeBg[badgeVariant] }}
  >
    <span className="inline-block w-[6px] h-[6px] rounded-full bg-white/70" />
    {badge}
  </span>

  {/* Category label — right side */}
  <span className="text-[10px] font-semibold uppercase tracking-[1px] text-white/50 text-right leading-tight pt-[3px]">
    {categoryLabel}
  </span>

</div>
```

Key changes:
- Wrapper div: `flex items-start justify-between gap-2`
- Badge stays on the LEFT (no change to badge styling)
- Category label moves to the RIGHT with `text-right` and `text-white/50`
- Both sit on the same row with space-between pushing them apart

---

### 3. If categoryLabel is not a separate prop

If the category name is hardcoded or derived from `accentVariant` or `badge`,
add a `categoryLabel` prop to the interface:

```ts
categoryLabel?: string   // e.g. "HUMAN RESOURCE", "DATA ANALYTICS & BI"
```

Then in `src/lib/courseData.ts`, add `categoryLabel` to each course object:
- humanResourceCourses → `categoryLabel: "HUMAN RESOURCE"`
- dataAnalyticsBiCourses → `categoryLabel: "DATA ANALYTICS & BI"`
- cloudComputingCourses → `categoryLabel: "CLOUD COMPUTING"`
- devopsMultiCloudCourses → `categoryLabel: "DEVOPS & MULTI-CLOUD"`
- programmingFullStackCourses → `categoryLabel: "PROGRAMMING & FULL STACK"`
- dataEngineeringCourses → `categoryLabel: "DATA ENGINEERING"`
- cyberSecurityCourses → `categoryLabel: "CYBER SECURITY"`
- erpCrmCourses → `categoryLabel: "ERP, CRM & ENTERPRISE"`
- softwareTestingCourses → `categoryLabel: "SOFTWARE TESTING"`
- digitalDesignCourses → `categoryLabel: "DIGITAL & DESIGN"`
- professionalSoftSkillsCourses → `categoryLabel: "PROFESSIONAL SKILLS"`
- quantumComputingCourses → `categoryLabel: "QUANTUM COMPUTING"`

---

## Final result per card header

```
┌── card header (dark navy) ───────────────────────────────┐
│ 4px accent strip (left edge)                              │
│                                                           │
│  [● Popular]                        HUMAN RESOURCE        │
│                                                           │
│  HR Recruitment Training                                  │
│                                                           │
│  [45 Days]  [Classroom]  [Beginner]                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

Badge → bottom-left aligned, colored pill
Category label → top-right, small, muted white (white/50), uppercase

---

## Verify

Run: `npm run dev`
Open: http://localhost:3000/courses/human-resource

Check:
- Badge ("Popular", "High Demand") visible on the LEFT ✓
- Category label ("HUMAN RESOURCE") visible on the RIGHT ✓  
- No overlap between badge and label ✓
- Applies to all course cards across all 12 category pages ✓
