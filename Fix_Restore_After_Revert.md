# Fix: Restore CourseCard.tsx and CourseGrid.tsx After Bad Revert

## What happened
`git revert HEAD` reverted too far and deleted CourseCard.tsx and CourseGrid.tsx.
These files need to be restored from git history.

## Step 1 — Check git log to find the right commit

Run:
```bash
git log --oneline -10
```

You will see something like:
```
475b08c  Revert "Fix category label position"
ab14bd0  Fix category label position
3f9a2c1  feat: upgrade course cards with new design   ← THIS is the good commit
...
```

Find the commit that added CourseCard.tsx and CourseGrid.tsx.
It will be named something like "upgrade course cards" or "implement course cards".

## Step 2 — Restore only the deleted files from that commit

Run these two commands (replace COMMIT_HASH with the actual hash from Step 1):

```bash
git checkout COMMIT_HASH -- src/components/CourseCard.tsx
git checkout COMMIT_HASH -- src/components/CourseGrid.tsx
```

Also restore courseData.ts from that same commit:
```bash
git checkout COMMIT_HASH -- src/lib/courseData.ts
```

## Step 3 — Verify files are back

Run:
```bash
ls src/components/CourseCard.tsx
ls src/components/CourseGrid.tsx
ls src/lib/courseData.ts
```

All three should exist.

## Step 4 — Confirm dev server works

Run:
```bash
npm run dev
```

Open:
- http://localhost:3001/courses/data-analytics-bi
- http://localhost:3001/courses/human-resource

Expected: New 3-column course cards visible with badge, rating, price, urgency strip.
NO categoryLabel prop anywhere (that was the reverted change).

## Step 5 — Commit the restored files

```bash
git add src/components/CourseCard.tsx src/components/CourseGrid.tsx src/lib/courseData.ts
git commit -m "fix: restore CourseCard, CourseGrid and courseData after bad revert"
```
