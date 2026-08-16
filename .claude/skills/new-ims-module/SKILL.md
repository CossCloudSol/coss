---
name: new-ims-module
description: Scaffold a new admin module in the IMS panel, following the existing module pattern. Use when adding a new manageable content type to the admin panel.
disable-model-invocation: true
argument-hint: [module name] [what it manages]
---

New IMS module: $0 — manages $1

Before writing anything, read an existing module end to end and follow it exactly.
Use the Testimonials module as the reference implementation. Match its file
layout, naming, and data flow rather than inventing a new structure.

Build in this order:

1. Prisma model. Do not apply it yourself — invoke `/db-change` for the schema step.
2. Admin list page. Must set `export const dynamic = 'force-dynamic'`.
3. Create and edit forms, with server-side validation.
4. Server actions or route handlers for create, update, delete.
5. Public-facing render, if this module surfaces on the site.
6. Nav entry in the admin sidebar.

Conventions:
- Import prisma from `@/lib/db`. Never instantiate a client.
- `getSession` takes two arguments: `getSession(req, probe)` where
  `probe = NextResponse.next()`.
- Escape JSX entities as `&quot;` and `&apos;`.
- Reuse existing shared helpers before writing new ones. Check `getTrustStats.ts`
  and `sanitizeDescription.ts` first.

Before reporting done:
- Run `npm run build` and confirm it passes.
- List every file you created or changed.
- Name anything you copied from Testimonials that did not fit, and why.
