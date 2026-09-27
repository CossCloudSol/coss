'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { trackCtaClick } from '@/lib/click-tracking';

/** Event the homepage hero form listens for to preselect a course. */
export const PREFILL_COURSE_EVENT = 'coss:prefill-course';

interface Props {
  href: string;
  ctaId: string;
  location: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Course to preselect in the homepage hero form when href is "#enroll-form". */
  prefillCourse?: string;
}

/**
 * Link that fires GA4 cta_click. In-page anchors (#…) scroll smoothly and can
 * preselect a course in the hero form; https links open in a new tab.
 */
export default function TrackedCta({ href, ctaId, location, className, style, children, prefillCourse }: Props): JSX.Element {
  const onClick = () => {
    trackCtaClick(ctaId, location, href);
    if (href.startsWith('#') && prefillCourse) {
      window.dispatchEvent(new CustomEvent(PREFILL_COURSE_EVENT, { detail: { course: prefillCourse } }));
    }
  };

  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  if (/^https:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className} style={style}>
      {children}
    </Link>
  );
}
