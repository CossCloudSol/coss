# cosscloudsol

Next.js app for Coss Cloud Solutions, an IT training institute in Hyderabad.
Public marketing site plus an Institute Management System (IMS) admin panel.

## Commands

- Build: `npm run build` (runs `prisma generate && next build` — do not change this)
- After any schema edit: `npx prisma generate` only

## Database

Schema changes are applied by the developer through the Supabase SQL Editor.
IMPORTANT: never run `prisma migrate` or `prisma db push`. Use `/db-change`.

## Local environment

`@prisma/client` auto-loads the root `.env` on import — any script that imports
`PrismaClient` targets **production** unless run through
`npx dotenv-cli -e .env.development.local -- <command>`. That wrapper works
because dotenv never overrides a `process.env` value that's already set.
`--env-file` flags and manual env loaders inside a script are not protective —
`.env` loads first regardless.

## Conventions

- Import prisma from `@/lib/db`
- `getSession(req, probe)` takes two args, where `probe = NextResponse.next()`
- Escape JSX entities as `&quot;` and `&apos;`

## Workflow

- Review the UI mockup before writing component code
- Verify production with `/verify-prod`, not by hand

## Standing rules
- Stage files by name; never `git add -A`. Commit, push, deploy are separate steps: always ask before any push; never push to `main` or force-push.
- Write SQL for the developer to run in the Supabase SQL Editor; never execute SQL or PrismaClient scripts yourself.
- Verify at the layer the claim is about (live HTML/headers beat source). Show raw command output, not summaries.
- Allowed claims only: "5,000+ students trained", "50+ hiring partners", "since 2010". No placement percentages, counts or guarantees (CCPA).