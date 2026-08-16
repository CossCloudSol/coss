---
name: db-change
description: Apply a schema change to the cosscloudsol database safely. Use when adding or altering a Prisma model, column, index, or relation.
disable-model-invocation: true
argument-hint: [what the schema change should do]
---

Schema change requested: $ARGUMENTS

NEVER run `prisma migrate` or `prisma db push` in this project. They are blocked.
The database is edited through the Supabase SQL Editor by the developer, not by you.

Follow these steps in order:

1. Read `prisma/schema.prisma` and locate the models involved.
2. Edit `prisma/schema.prisma` to describe the target state.
3. Generate the SQL for the change and print it in a fenced `sql` block for the
   developer to paste into the Supabase SQL Editor. Include the rollback SQL
   directly underneath, in a second block.
4. Stop and wait. Do not continue until the developer confirms the SQL ran.
5. After confirmation, run `npx prisma generate` only.
6. Run `npm run build` and report the result. If types break, fix the call sites.

Rules that apply to every change:
- Add an index for any new foreign key and any column used in a `where` filter.
- Prefer nullable columns or a default over a required column on an existing table.
- Name the migration SQL file `prisma/migrations/manual/<yyyy-mm-dd>-<slug>.sql`
  and commit it, so the change has a history even though it was applied by hand.

Report at the end: which models changed, the SQL the developer must run, and
whether the build passed.
