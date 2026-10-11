import Link from 'next/link';
import type { TopStripData } from '@/lib/top-strip';
import StripRotator from './StripRotator';

const DOT = <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#f3a57a]" />;

/**
 * Dark strip above the header (38px, every public page). Server-rendered at
 * a fixed height, so it never shifts the page; it scrolls away while the
 * main header row sticks. Desktop shows both sides; phones rotate one
 * message at a time (paused under prefers-reduced-motion).
 *
 * Fixed, allowed wording only: no rating, no urgency or seat wording. The
 * batches segment follows the admin Topbar on/off switch and link.
 */
export default function TopStrip({ data }: { data: TopStripData }): JSX.Element {
  const batches = data.showBatches ? (
    <span className="flex min-w-0 items-center gap-2.5">
      {DOT}
      <span className="truncate">New batches every month ·</span>
      <Link href={data.ctaUrl} className="shrink-0 font-bold text-[#f3a57a] underline-offset-2 hover:underline">
        See upcoming dates
      </Link>
    </span>
  ) : null;
  const where = <span className="text-[#c9dbdf]">Dilsukhnagar · Ameerpet · Live online</span>;
  const since = <span className="text-[#c9dbdf]">Since 2010 · 5,000+ students trained</span>;

  return (
    // System font (font-sans): the strip never swaps fonts, so it never shifts.
    <div className="h-[38px] bg-[#0a3d4a] font-sans text-[13px] text-[#e6f0f2] lg:text-sm">
      {/* ≥1024: both sides */}
      <div className="mx-auto hidden h-full max-w-[1280px] items-center justify-between gap-6 px-4 lg:flex">
        <div className="flex min-w-0 items-center">{batches}</div>
        <div className="flex shrink-0 items-center gap-[22px]">
          {where}
          {since}
        </div>
      </div>

      {/* <1024: one line, rotating */}
      <StripRotator className="flex h-full items-center justify-center px-4 lg:hidden">
        {batches && <div data-strip-msg="">{batches}</div>}
        <div data-strip-msg="">{where}</div>
        <div data-strip-msg="">{since}</div>
      </StripRotator>
    </div>
  );
}
