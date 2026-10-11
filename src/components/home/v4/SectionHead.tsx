import type { ReactNode } from 'react';

/** One section rhythm for the homepage: 64px (mobile) / 96px (desktop) padding, one container. */
export const SECTION_PAD = 'py-16 lg:py-24';
export const CONTAINER = 'mx-auto max-w-[1280px] px-4 lg:px-8';
/** Section backgrounds: white / soft tint (and the dark batch band, which has its own). */
export const TONE = {
  white: 'bg-white dark:bg-slate-950',
  tint: 'bg-[#f6f9fa] dark:bg-slate-900',
} as const;
/** The one card: 16px radius, 1px border, soft shadow, 24px padding; hover lift from .home-card. */
export const CARD = 'home-card light-surface rounded-2xl border border-[#e3eaec] bg-white shadow-[0_2px_8px_rgba(10,61,74,0.06)]';
/** Icon tile used inside cards. */
export const ICON_TILE = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl';

interface Props {
  id: string;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  /** Dark or orange surface: white heading, light eyebrow and subtext. */
  onDark?: boolean;
  /** Right-aligned control (link or tabs). */
  action?: ReactNode;
}

/** Eyebrow, H2, one-line subtext: the heading pattern every homepage section uses. */
export default function SectionHead({ id, eyebrow, title, sub, onDark = false, action }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <p className={`font-sans text-xs font-bold uppercase tracking-[0.1em] lg:text-[13px] ${onDark ? 'on-dark-eyebrow' : 'text-[#a8471a] dark:text-[#f3a57a]'}`}>{eyebrow}</p>
        <h2 id={id} className={`mt-2 font-heading text-[27px] font-extrabold leading-[1.15] lg:text-[40px] ${onDark ? 'text-white' : 'text-[#0a3d4a] dark:text-white'}`}>
          {title}
        </h2>
        {sub && <p className={`mt-2 max-w-[640px] font-sans text-base leading-[1.6] lg:text-[17px] ${onDark ? 'on-dark-sub' : 'text-[#4a5c61] dark:text-slate-300'}`}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
