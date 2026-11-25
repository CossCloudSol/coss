import { useSyncExternalStore } from 'react';
import { getPageCourse, subscribePageCourse, type PageCourseInfo } from '@/lib/page-course';

/** The course page being viewed: null on the server, in the first client render (so hydration matches), and off course pages. */
export function usePageCourse(): PageCourseInfo | null {
  return useSyncExternalStore(subscribePageCourse, getPageCourse, () => null);
}
