# cosscloudsol

Next.js app for Coss Cloud Solutions, an IT training institute in Hyderabad.
Public marketing site plus an Institute Management System (IMS) admin panel.

## Commands

- Build: `npm run build` (runs `prisma generate && next build` — do not change this)
- After any schema edit: `npx prisma generate` only

## Database

Schema changes are applied by the developer through the Supabase SQL Editor.
IMPORTANT: never run `prisma migrate` or `prisma db push`. Use `/db-change`.

## Conventions

- Import prisma from `@/lib/db`
- `getSession(req, probe)` takes two args, where `probe = NextResponse.next()`
- Escape JSX entities as `&quot;` and `&apos;`

## Workflow

- Review the UI mockup before writing component code
- Verify production with `/verify-prod`, not by hand
