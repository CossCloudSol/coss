'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { TRACKED_ATTR, inferIntentKind, trackIntent, type IntentKind } from '@/lib/intent-tracking';

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
  /** Defaults to the kind the href implies (lib/intent-tracking), else "other". */
  kind?: IntentKind;
  courseSlug?: string;
}

/**
 * Link tracked through lib/intent-tracking (GA4 event, admin row, last-click memory). In-page
 * anchors (#…) scroll smoothly and can preselect a course in the hero form; https links open
 * in a new tab. data-tracked keeps the site-wide listener from counting it again.
 */
export default function TrackedCta({ href, ctaId, location, className, style, children, prefillCourse, kind, courseSlug }: Props): JSX.Element {
  const tracked = { [TRACKED_ATTR]: '' };
  const onClick = () => {
    trackIntent({ kind: kind ?? inferIntentKind(href) ?? 'other', ctaId, location, destination: href, courseSlug });
    if (href.startsWith('#') && prefillCourse) {
      window.dispatchEvent(new CustomEvent(PREFILL_COURSE_EVENT, { detail: { course: prefillCourse } }));
    }
  };

  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={className} style={style} {...tracked}>
        {children}
      </a>
    );
  }
  if (/^https:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className} style={style} {...tracked}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className} style={style} {...tracked}>
      {children}
    </Link>
  );
}
