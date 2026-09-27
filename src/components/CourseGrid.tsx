import { Fragment } from 'react'
import CourseCard, { CourseCardProps } from './CourseCard'
import PromoBanner from './PromoBanner'
import { bannerForSlot, PROMO_EVERY_N_ITEMS } from '@/lib/promo-banner-slots'
import type { PromoBanner as PromoBannerData } from '@/lib/promo-banner-schema'

interface CourseGridProps {
  courses: CourseCardProps[]
  /**
   * Course-grid promo banners. When passed (even empty), a full-width banner
   * follows every 6th course; an empty list shows the coded fallback.
   */
  promoBanners?: PromoBannerData[]
}

export default function CourseGrid({ courses, promoBanners }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
      {courses.map((course, i) => {
        const slot = (i + 1) % PROMO_EVERY_N_ITEMS === 0 ? (i + 1) / PROMO_EVERY_N_ITEMS - 1 : -1
        return (
          <Fragment key={course.title}>
            <CourseCard {...course} animationIndex={i} />
            {promoBanners && slot >= 0 && (
              <div className="col-span-full">
                <PromoBanner placement="course-grid" banner={bannerForSlot(promoBanners, slot)} />
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
