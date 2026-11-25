import WhatsAppLink from '@/components/WhatsAppLink'
import type { PageType } from '@/lib/click-tracking'

export const HERO_WA_FEES_CTA = 'hero_whatsapp_fees'

/**
 * Primary WhatsApp button right under a course page's hero, on phones only (≤768px, the site's md
 * split). The free-demo form that follows stays the next option. The text WhatsApp opens with is
 * the standard fees-and-batches line with its ref code (lib/wa-ref).
 */
export default function MobileWaFees({ courseName, courseSlug, pageType = 'course' }: { courseName: string; courseSlug: string; pageType?: PageType }) {
  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-4 md:hidden">
      <WhatsAppLink
        ctaType="hero"
        ctaId={HERO_WA_FEES_CTA}
        dataCta={HERO_WA_FEES_CTA}
        location="hero"
        pageType={pageType}
        courseName={courseName}
        courseSlug={courseSlug}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#15803d] px-5 py-3 text-center text-[15px] font-bold text-white"
      >
        Ask fees &amp; batch dates on WhatsApp
      </WhatsAppLink>
    </div>
  )
}
