# Fix: Remove Old Course Cards — Keep Only New CourseGrid

## Problem
On every category page (e.g. /courses/data-analytics-bi), BOTH the old cards
AND the new CourseGrid are rendering. The old card section was NOT removed —
CourseGrid was only appended below it.

## What to do

Open: `src/components/CourseCategoryPage.tsx`

Find the OLD "Courses We Offer" section. It will look like one of these patterns:

### Pattern A — mapped card grid (most likely)
```tsx
{/* Courses We Offer */}
<section ...>
  <h2>Courses We Offer</h2>
  <div className="grid ...">
    {courses.map((course) => (
      <div key={course.id} ...>
        <div className="... bg-[#0D1B2A] ...">   {/* dark header */}
          ...
        </div>
        <div>
          {course.title}
          <a href={course.href}>View Course →</a>
        </div>
      </div>
    ))}
  </div>
</section>
```

### Pattern B — static JSX cards with dark navy headers
```tsx
<section>
  <h2>📋 Course Details</h2>
  <div className="grid grid-cols-2 ...">
    <div className="rounded-xl overflow-hidden ...">
      <div className="bg-[#0D1B2A] ...">
        ...
      </div>
      <p>Course name</p>
      <a>View Course →</a>
    </div>
  </div>
</section>
```

### Pattern C — any JSX block containing "View Course"
Search for: `View Course` inside CourseCategoryPage.tsx — that text only
appears in the OLD cards. Delete its entire parent section block.

---

## The fix

1. Open `src/components/CourseCategoryPage.tsx`
2. Find the section that renders the OLD course cards
   (look for `View Course`, `view-course`, dark card headers, or a
   course.map() that renders cards WITHOUT rating/price/urgency)
3. DELETE that entire section — the full `<section>...</section>` block
4. Keep the NEW CourseGrid section completely untouched:
   ```tsx
   <section className="py-12 px-4 bg-[#F0F2F5]">
     ...
     <CourseGrid courses={...} />
   </section>
   ```
5. Save the file

---

## Also check these files

If the old cards are defined in a DIFFERENT component imported into
CourseCategoryPage.tsx (e.g. `<CourseList />`, `<CourseDetails />`,
`<CoursesSection />`), delete or comment out that import and its JSX usage.

Search the entire file for:
- `View Course`
- `view-course`
- `viewCourse`
- `CourseList`
- `CourseDetails`
- `CoursesSection`

Remove any matches that belong to the OLD card design.

---

## Verify after fix

Run: `npm run dev`
Open: http://localhost:3000/courses/data-analytics-bi

Expected result:
- ONE "Courses We Offer" section visible
- Shows the NEW 3-column cards with badge, rating, price, highlights, urgency
- NO old dark cards with only title + "View Course →" link
- Hero, FAQ, footer all still intact above and below

If the old cards are STILL showing, search the entire codebase for
"View Course" and find which file is still rendering them, then remove it.
