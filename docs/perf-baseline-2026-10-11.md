# Performance baseline, 11 Oct 2026 (Lighthouse mobile, median of 3)

Stage 2 (homepage) and Stage 3 (/faculty) must not regress these. Re-measure with the same method.

## Method
- Lighthouse 13.5.0, mobile form factor, simulated throttling, performance category only, headless Edge on the dev PC.
- Median of 3 runs per page.
- "Production" = the live site at the commit named. "Local A/B" = `next build` of the exact commits on one PC with the
  same data (production catalogue via `/api/search-index`), `next start`, so only the code differs. Needed because
  Vercel deployment URLs are behind SSO and cannot be reached by the CLI.

## Production, current (b78ae48, after #45 + #46)
| Page | Perf | LCP | TBT | FCP | LCP element |
|---|---|---|---|---|---|
| `/` | 91 | 2.60 s | 245 ms | 1.71 s | hero `h1.font-heading` (element render delay dominates) |
| `/aws-devops-training-institute-in-hyderabad` | 92 | 2.98 s | 121 ms | 1.63 s | hero `p.text-slate-300` |

## Local A/B, home page: #45 (bd42e97) vs #46 (b78ae48), same data
| Build | Perf | LCP | TBT | FCP |
|---|---|---|---|---|
| bd42e97 (#45) | 84 | 3195 ms | 332 ms | 1564 ms |
| b78ae48 (#46) | 94 | 2852 ms | 56 ms | 1995 ms |
| Delta | +10 | -343 ms | -276 ms | +431 ms |

#46 did not add LCP or TBT on the home page (limits were +300 ms / +150 ms).
The course page could not be A/B'd locally (course data is in the DB, the dev DB is empty), so there is no
#45 baseline for it; the production row above is the baseline from now on.

Run-to-run noise on this PC is large (a single cold run of `/` gave Perf 67 / LCP 4.3 s), which is why the median of 3 is used.
