import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { getSearchIndex } from '@/lib/course-search-index';
import { getPromoBanners } from '@/lib/promo-banners';
import { bannerForSlot } from '@/lib/promo-banner-slots';
import { COURSE_FILTER_PARAMS } from '@/lib/course-search';
import CoursesExplorer from '@/components/courses/CoursesExplorer';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  // Canonical stays /courses; filtered views (?q=, ?cat=, …) get
  // X-Robots-Tag: noindex, follow from the middleware.
  return buildPageMetadata('courses');
}

/**
 * Runs before the results are painted: on a filtered URL, hide the parts the
 * client will re-filter so the unfiltered list never flashes (or shifts).
 * The class is removed once the filters apply, or after 3 s as a fallback.
 */
const PENDING_SCRIPT = `(function(){try{if(new RegExp('[?&](${COURSE_FILTER_PARAMS.join('|')})=').test(location.search)){var r=document.documentElement;r.classList.add('courses-pending');setTimeout(function(){r.classList.remove('courses-pending')},3000)}}catch(e){}})();`;

export default async function CoursesPage() {
  const [index, banners] = await Promise.all([getSearchIndex(), getPromoBanners('course-grid')]);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PENDING_SCRIPT }} />
      <CoursesExplorer courses={index.courses} banner={bannerForSlot(banners, 0)} />
    </>
  );
}
