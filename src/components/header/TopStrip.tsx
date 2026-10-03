import Link from 'next/link';
import { Flame, GraduationCap, MapPin, Monitor, Star } from 'lucide-react';
import type { TopStripData } from '@/lib/top-strip';
import StripRotator from './StripRotator';

const ICON = 'h-3.5 w-3.5 shrink-0';
const DIVIDER = <span aria-hidden="true" className="h-3.5 w-px bg-white/25" />;

/**
 * Dark strip above the header (38px, every public page). Server-rendered at
 * a fixed height, so it never shifts the page; it scrolls away while the
 * main header row sticks. Desktop shows every segment; phones rotate one
 * message at a time (paused under prefers-reduced-motion).
 *
 * Allowed claims only. The rating segment renders only with a live Google
 * rating; "Limited seats" only when batch data says a batch is filling up.
 */
export default function TopStrip({ data }: { data: TopStripData }): JSX.Element {
  const batches = data.showBatches ? (
    <span className="flex min-w-0 items-center gap-1.5">
      <Flame className={`${ICON} text-[#f3a57a]`} aria-hidden="true" />
      <span className="truncate">{data.batchesText}</span>
      {data.limitedSeats && <span className="shrink-0 font-bold text-[#f3a57a]">· Limited seats</span>}
      <Link href={data.ctaUrl} className="shrink-0 font-bold text-white underline underline-offset-2 hover:text-[#ffd9c2]">
        {data.ctaLabel}
      </Link>
    </span>
  ) : null;
  const location = (
    <span className="flex items-center gap-1.5">
      <MapPin className={ICON} aria-hidden="true" />
      Hyderabad (Dilsukhnagar &amp; Ameerpet)
    </span>
  );
  const online = (
    <span className="flex items-center gap-1.5">
      <Monitor className={ICON} aria-hidden="true" />
      Live Online
    </span>
  );
  // Google's attribution rule: "on Google" + a link to the listing, or nothing.
  const rating = data.rating?.mapsUri ? (
    <a href={data.rating.mapsUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline" data-google-rating="">
      <Star className={`${ICON} fill-[#f3a57a] text-[#f3a57a]`} aria-hidden="true" />
      {data.rating.rating.toFixed(1)}/5 on Google ({data.rating.count.toLocaleString('en-IN')} {data.rating.count === 1 ? 'review' : 'reviews'})
    </a>
  ) : null;
  const students = (
    <span className="flex items-center gap-1.5">
      <GraduationCap className={ICON} aria-hidden="true" />
      5,000+ students trained
    </span>
  );

  return (
    // System font (font-sans): the strip never swaps fonts, so it never shifts.
    <div className="h-[38px] bg-[#0a3d4a] font-sans text-[13px] text-white">
      {/* ≥1024: every segment */}
      <div className="mx-auto hidden h-full max-w-[1280px] items-center justify-between gap-6 px-4 lg:flex">
        <div className="flex min-w-0 items-center gap-4">
          {batches}
          {batches && DIVIDER}
          {location}
          {DIVIDER}
          {online}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {rating}
          {rating && DIVIDER}
          {students}
        </div>
      </div>

      {/* <1024: one line, rotating */}
      <StripRotator className="flex h-full items-center justify-center px-4 lg:hidden">
        {batches && <div data-strip-msg="">{batches}</div>}
        <div data-strip-msg="">
          <span className="flex items-center gap-3">
            {location}
            {online}
          </span>
        </div>
        {rating && <div data-strip-msg="">{rating}</div>}
        <div data-strip-msg="">{students}</div>
      </StripRotator>
    </div>
  );
}
