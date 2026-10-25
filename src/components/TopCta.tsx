import Link from 'next/link';
import WhatsAppLink from '@/components/WhatsAppLink';
import type { PageType } from '@/lib/click-tracking';

/* -------------------------------------------------------------------------- */
/*  Top-of-page CTA row, placed right under a page's H1 so it is above the    */
/*  fold on phones: "Book a free demo", WhatsApp, and a course link that      */
/*  matches the page's topic. Server-rendered: the demo and course links are  */
/*  plain tagged anchors counted by the site-wide click listener              */
/*  (lib/intent-listener), and WhatsApp is the existing WhatsAppLink, so the  */
/*  row adds no client JS of its own.                                         */
/* -------------------------------------------------------------------------- */

export const TOP_CTA_LOCATION = 'page_top_cta';

export interface TopCtaProps {
  /** The course (or course list) that matches the page's topic. */
  course: { href: string; label: string };
  /** Where "Book a free demo" goes: /free-demo-class, with ?course= when the page is about one course, or "#enroll-form" on the homepage. */
  demoHref?: string;
  /** Course slug for the click rows, when the page is about one course. */
  courseSlug?: string;
  pageType?: PageType;
  /** "dark" on the coloured heroes (white text), "light" on white or pale sections. */
  tone?: 'dark' | 'light';
  /** WhatsApp message; omit for a bare chat link. */
  whatsappMessage?: string;
  /** Spacing around the row, e.g. "0 0 20px". */
  margin?: string;
  /** "center" inside the centred page banners. */
  align?: 'start' | 'center';
}

const FONT = 'var(--font-poppins), Poppins, sans-serif';

export default function TopCta({
  course,
  demoHref = '/free-demo-class',
  courseSlug,
  pageType,
  tone = 'dark',
  whatsappMessage,
  margin = '0 0 20px',
  align = 'start',
}: TopCtaProps): JSX.Element {
  const dark = tone === 'dark';
  const pill = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0 18px',
    borderRadius: '999px',
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: 1.2,
    textDecoration: 'none',
  } as const;

  return (
    <div data-section={TOP_CTA_LOCATION} style={{ margin, textAlign: align === 'center' ? 'center' : 'left' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        <a
          href={demoHref}
          data-cta="book_demo"
          data-loc={TOP_CTA_LOCATION}
          data-kind="demo"
          {...(courseSlug ? { 'data-course': courseSlug } : {})}
          style={{ ...pill, background: '#b8531c', color: '#fff' }}
        >
          Book a free demo
        </a>
        <WhatsAppLink
          ctaType="other"
          ctaId="page_top_whatsapp"
          location={TOP_CTA_LOCATION}
          pageType={pageType}
          courseSlug={courseSlug}
          message={whatsappMessage}
          aria-label="Chat with Coss Cloud Solutions on WhatsApp"
          style={{
            ...pill,
            background: 'transparent',
            color: dark ? '#fff' : '#166534',
            border: `2px solid ${dark ? '#4ade80' : '#16a34a'}`,
          }}
        >
          WhatsApp us
        </WhatsAppLink>
      </div>
      <Link
        href={course.href}
        data-cta="top_course_link"
        data-loc={TOP_CTA_LOCATION}
        data-kind="other"
        {...(courseSlug ? { 'data-course': courseSlug } : {})}
        style={{
          display: 'inline-block',
          marginTop: '10px',
          padding: '6px 0',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: '14px',
          color: dark ? '#fff' : '#024c57',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        }}
      >
        {course.label} →
      </Link>
    </div>
  );
}
