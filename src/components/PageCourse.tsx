'use client'

import { useEffect } from 'react'
import { setPageCourse } from '@/lib/page-course'

/**
 * Rendered once by every course page. Tells the site-wide WhatsApp links (header, footer, sticky
 * bar, chat widget) which course this page is about, so their prefill names it. Renders nothing.
 */
export default function PageCourse({ name, slug }: { name: string; slug?: string }): null {
  useEffect(() => {
    setPageCourse({ name, slug })
    return () => setPageCourse(null)
  }, [name, slug])
  return null
}
