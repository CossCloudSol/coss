'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// The form's code (validation, honeypot, submitLead) loads only when the banner is about to scroll
// into view, so it adds nothing to the main-thread work of the first screen.
const FinalCtaForm = dynamic(() => import('@/components/home/v4/FinalCtaForm'), { ssr: false });

/**
 * Below-the-fold wrapper for the final banner's form. A same-height placeholder holds the space
 * (no layout shift) until an IntersectionObserver says the banner is within 600px of the viewport,
 * or the visitor tabs / taps into it first. Browsers without IntersectionObserver load it at once.
 */
export default function FinalCtaFormLazy(): JSX.Element {
  const [show, setShow] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setShow(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={holder} className="min-h-[148px] min-w-0 lg:flex-[1_1_480px]">
      {show ? <FinalCtaForm /> : null}
    </div>
  );
}
