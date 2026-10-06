import 'server-only'
import { getGoogleRating } from '@/lib/google-rating'
import type { BranchSettings } from '@/lib/get-branch-settings'
import { periodsFromSettings, groupPeriods, type HoursGroup, type HoursPeriod, type Weekday } from '@/lib/opening-hours'

export type BranchHours = {
  /** Where the hours came from: the Google listing, or the centre's settings (admin → Geo). */
  source: 'google' | 'settings'
  periods: HoursPeriod[]
  groups: HoursGroup[]
}

/**
 * A centre's opening hours from one place. The Dilsukhnagar listing's hours
 * come live from Google (same cached Places call as the rating); any centre
 * without them (Ameerpet has no Place ID yet, or Places failed) falls back to
 * its BranchSettings row.
 */
export async function getBranchHours(branch: BranchSettings): Promise<BranchHours> {
  if (branch.branchKey === 'dilsukhnagar') {
    const google = (await getGoogleRating())?.hours
    if (google && google.periods.length > 0) {
      const periods = google.periods.map((p) => ({ day: p.day as Weekday, opens: p.opens, closes: p.closes }))
      return { source: 'google', periods, groups: groupPeriods(periods) }
    }
  }
  const periods = periodsFromSettings(branch.workingDays, branch.workingHoursOpen, branch.workingHoursClose)
  return { source: 'settings', periods, groups: groupPeriods(periods) }
}
