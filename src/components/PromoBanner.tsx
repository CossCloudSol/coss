'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackPromoBannerClick } from '@/lib/click-tracking';
import { buildWhatsAppClickPayload, logWhatsAppClick } from '@/lib/contact-click-log';
import { TRACKED_ATTR, inferIntentKind, trackIntent, type IntentKind } from '@/lib/intent-tracking';
import type { PromoBanner as PromoBannerData, PromoBannerPlacement } from '@/lib/promo-banner-schema';

/** Where "Download Syllabus" goes on course pages (PDF download or a WhatsApp request). */
export interface SyllabusLink {
  href: string;
  external: boolean;
}

interface Props {
  placement: PromoBannerPlacement;
  /** The admin banner for this slot; null (or no image) shows the coded fallback. */
  banner: PromoBannerData | null;
  /** Adds "Download Syllabus" to the fallback (course pages only). */
  syllabus?: SyllabusLink;
  /** Replaces the coded fallback card when there is no admin image banner. */
  fallback?: ReactNode;
  className?: string;
}

// Fixed box: 2:1 on phones, 4:1 from sm up, so nothing shifts while images load.
const FRAME = 'relative block w-full overflow-hidden rounded-2xl aspect-[2/1] sm:aspect-[4/1]';

const DEMO_HREF = '/free-demo-class';

function isExternal(href: string): boolean {
  return /^https:\/\//.test(href);
}

/**
 * A banner link: promo_banner_click (as before) plus the shared intent event and admin row
 * (trackIntent; a wa.me syllabus request also gets its WhatsAppClick row). data-tracked keeps
 * the site-wide listener from counting it again.
 */
function TrackedLink({
  href,
  onClick,
  intent,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  onClick: () => void;
  intent: { kind?: IntentKind; ctaId: string; location: string };
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}): JSX.Element {
  const handleClick = () => {
    onClick();
    const kind = intent.kind ?? inferIntentKind(href) ?? 'other';
    trackIntent({ kind, ctaId: intent.ctaId, location: intent.location, destination: href });
    const wa = href.match(/^https:\/\/wa\.me\/(\d{12})/);
    if (wa) {
      logWhatsAppClick(buildWhatsAppClickPayload({
        pathname: window.location.pathname,
        ctaType: 'other',
        phoneNumber: `+${wa[1]}`,
        hadPrefill: /[?&]text=/.test(href),
        ctaId: intent.ctaId,
        location: intent.location,
      }));
    }
  };
  const tracked = { [TRACKED_ATTR]: '' };
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className} aria-label={ariaLabel} {...tracked}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} onClick={handleClick} className={className} aria-label={ariaLabel} {...tracked}>
      {children}
    </Link>
  );
}

export default function PromoBanner({ placement, banner, syllabus, fallback, className = '' }: Props): JSX.Element {
  // ── Admin image banner ──────────────────────────────────────────────────
  if (banner && banner.imageUrl) {
    const mobileSrc = banner.mobileImageUrl || banner.imageUrl;
    const hasSeparateMobile = mobileSrc !== banner.imageUrl;
    const images = (
      <>
        {hasSeparateMobile && (
          <Image src={mobileSrc} alt={banner.alt} fill sizes="100vw" className="object-cover sm:hidden" />
        )}
        <Image
          src={banner.imageUrl}
          alt={banner.alt}
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className={`object-cover ${hasSeparateMobile ? 'hidden sm:block' : ''}`}
        />
      </>
    );

    if (!banner.link) {
      return <div className={`${FRAME} ${className}`}>{images}</div>;
    }
    return (
      <TrackedLink
        href={banner.link}
        ariaLabel={banner.alt}
        className={`${FRAME} ${className}`}
        intent={{ ctaId: 'banner', location: `promo_${placement}` }}
        onClick={() =>
          trackPromoBannerClick({ placement, bannerId: banner.id, variant: 'image', cta: 'banner', destination: banner.link })
        }
      >
        {images}
      </TrackedLink>
    );
  }

  if (fallback) return <>{fallback}</>;

  // ── Coded fallback in brand colours ─────────────────────────────────────
  const bannerId = banner?.id ?? null;
  return (
    <div
      className={`${FRAME} flex items-center ${className}`}
      style={{ background: 'linear-gradient(120deg, #024c57 0%, #03798a 100%)' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: 'rgba(94,240,200,0.12)' }} />
      <div className="relative flex w-full flex-col items-start gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <TrackedLink
          href={DEMO_HREF}
          className="text-lg font-extrabold leading-tight text-white hover:underline sm:text-2xl"
          intent={{ kind: 'demo', ctaId: 'book_demo', location: `promo_${placement}` }}
          onClick={() =>
            trackPromoBannerClick({ placement, bannerId, variant: 'fallback', cta: 'book_demo', destination: DEMO_HREF })
          }
        >
          Free Demo Class <span style={{ color: '#ccfbef' }}>— Book Now</span>
        </TrackedLink>
        <div className="flex flex-wrap gap-2">
          <TrackedLink
            href={DEMO_HREF}
            className="inline-flex items-center rounded-lg bg-[#b8531c] px-4 py-2 text-sm font-bold text-white hover:bg-[#8f3f14]"
            intent={{ kind: 'demo', ctaId: 'book_demo_button', location: `promo_${placement}` }}
            onClick={() =>
              trackPromoBannerClick({ placement, bannerId, variant: 'fallback', cta: 'book_demo_button', destination: DEMO_HREF })
            }
          >
            Book Now
          </TrackedLink>
          {syllabus && (
            <TrackedLink
              href={syllabus.href}
              className="inline-flex items-center rounded-lg border border-white/70 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
              intent={{ kind: 'syllabus', ctaId: 'download_syllabus', location: `promo_${placement}` }}
              onClick={() =>
                trackPromoBannerClick({ placement, bannerId, variant: 'fallback', cta: 'download_syllabus', destination: syllabus.href })
              }
            >
              Download Syllabus
            </TrackedLink>
          )}
        </div>
      </div>
    </div>
  );
}
