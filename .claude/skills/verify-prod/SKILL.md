---
name: verify-prod
description: Check that production pages are live and rendering correctly after a deploy. Use after deploying cosscloudsol or when a page is reported broken.
disable-model-invocation: true
allowed-tools: Bash(curl *) Bash(node scripts/smoke.mjs *)
---

## Current deploy state

- Branch and status: !`git status --short --branch`
- Last commit: !`git log -1 --oneline`

## Task

Run the smoke check against production and report the result:

```
node scripts/smoke.mjs
```

The script walks the route list in `scripts/routes.json` and asserts, per route,
an HTTP 200 and the presence of a required content marker. A 200 alone is not a
pass — a page can return 200 with an empty shell.

If the script is missing, write it first:
- Read the route list from the database (GEO pages, course pages) plus the static
  routes, and write it to `scripts/routes.json`.
- For each route, assert status 200 and that the expected `<h1>` text is present.
- Exit non-zero on any failure and print a one-line summary per failing route.

## Reporting

Show the actual command output, not a summary of it. For each failure, name the
route, the status, and which assertion failed. Do not attempt fixes until the
full check has run and the failures are listed.
