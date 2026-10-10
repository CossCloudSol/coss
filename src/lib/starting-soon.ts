import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { COURSE_CATALOG_TAG } from '@/lib/course-search';
import { courseCanonicalPath } from '@/lib/course-canonical';
import { memoDuringBuild } from '@/lib/build-memo';
import { finalHref } from '@/lib/redirect-resolve';
import { formatBatchTime } from '@/lib/batch-time';
import { REDIRECTS } from '../../redirects.config.mjs';
import { DEPLOY_CACHE_KEY } from '@/lib/deploy-cache-key';

/** One live batch for the menu's "Starting soon" list: branch and time only, no seat counts. */
export interface StartingSoonBatch {
  id: string;
  /** ISO start date. */
  startDate: string;
  course: string;
  href: string;
  /** "Ameerpet" / "Dilsukhnagar" / "Live online". */
  where: string;
  /** The batch's time, formatted "10–11 AM"; empty when the schedule has no readable time. */
  time: string;
}

function startOfTodayIST(): Date {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + istOffset);
  return new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()) - istOffset);
}

async function loadStartingSoon(): Promise<StartingSoonBatch[]> {
  const rows = await prisma.batch.findMany({
    where: { status: 'upcoming', startDate: { gte: startOfTodayIST() }, course: { status: 'published' } },
    orderBy: { startDate: 'asc' },
    take: 3,
    select: {
      id: true,
      startDate: true,
      mode: true,
      centre: true,
      schedule: true,
      course: { select: { title: true, slug: true, urlType: true, categorySlug: true } },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    startDate: b.startDate.toISOString(),
    course: b.course.title.trim(),
    href: finalHref(courseCanonicalPath(b.course), REDIRECTS),
    where: /online/i.test(b.mode) || !b.centre ? 'Live online' : b.centre.trim(),
    time: formatBatchTime(b.schedule),
  }));
}

// Batch writes revalidate COURSE_CATALOG_TAG (see course-search-index).
const getCachedStartingSoon = unstable_cache(loadStartingSoon, ['starting-soon', DEPLOY_CACHE_KEY], {
  tags: [COURSE_CATALOG_TAG],
  revalidate: 3600,
});

export function getStartingSoon(): Promise<StartingSoonBatch[]> {
  return memoDuringBuild('starting-soon', getCachedStartingSoon);
}
