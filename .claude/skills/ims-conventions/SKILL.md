---
name: ims-conventions
description: Admin panel and data-layer conventions for the cosscloudsol IMS. Background knowledge for any work under the admin routes or on Prisma models.
user-invocable: false
paths: ["app/admin/**", "prisma/**", "lib/db*"]
---

Data access:
- Import prisma from `@/lib/db`. Never construct a new PrismaClient.
- `getSession(req, probe)` takes two arguments; `probe = NextResponse.next()`.
- Schema changes go through `/db-change`. `prisma migrate` and `prisma db push`
  are never run in this project.

Admin pages:
- Every admin page sets `export const dynamic = 'force-dynamic'`.
- Build command is `prisma generate && next build`.
- JSX entities use `&quot;` and `&apos;`.

Structured data:
- Course pages emit `Course` schema.
- Each branch location emits `EducationalOrganization`, not a single sitewide
  Organization block.
- Schema output is managed through the Schema Markup Manager, not hardcoded
  in page components.

Shared helpers exist for trust stats and description sanitising. Check
`getTrustStats.ts` and `sanitizeDescription.ts` before writing a new one.
