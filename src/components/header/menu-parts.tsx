import Link from 'next/link';
import { MENU_ICON_COLORS, MENU_ICON_PATHS, type MenuIconKey } from '@/lib/menu-icons';

/** "Tue 13 Oct" for a batch chip, in IST. */
export function batchChipDate(iso: string | null): string | null {
  if (!iso) return null;
  const parts = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const out = `${get('weekday')} ${get('day')} ${get('month')}`.trim();
  return out || null;
}

/** Weekday / day / month for the "Starting soon" date block, upper case. */
export function batchDateBlock(iso: string): { dow: string; day: string; mon: string } {
  const parts = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).formatToParts(new Date(iso));
  const get = (t: string) => (parts.find((p) => p.type === t)?.value ?? '').toUpperCase();
  return { dow: get('weekday'), day: get('day'), mon: get('month') };
}

/** Decorative stroke icon (24×24 viewBox). */
export function MenuIcon({ icon, size, stroke = 2 }: { icon: MenuIconKey; size: number; stroke?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={MENU_ICON_PATHS[icon]} />
    </svg>
  );
}

/** Coloured rounded tile holding an icon, in the category's colour pair. */
export function IconTile({ icon, size, radius, iconSize }: { icon: MenuIconKey; size: number; radius: number; iconSize: number }): JSX.Element {
  const [bg, ink] = MENU_ICON_COLORS[icon];
  return (
    <span className="mm-tile" style={{ width: size, height: size, borderRadius: radius, background: bg, color: ink }}>
      <MenuIcon icon={icon} size={iconSize} />
    </span>
  );
}

export interface MenuCardData {
  href: string;
  label: string;
  icon: MenuIconKey;
  /** Category / track line. */
  track?: string;
  chips?: readonly string[];
  nextBatch?: string | null;
  popular?: boolean;
}

/**
 * One course card: 54px icon tile, 18px name, track line, chips, chevron.
 * At least 104px tall. The batch chip is left out when there is no batch.
 */
export function MenuCourseCard({ card }: { card: MenuCardData }): JSX.Element {
  const [bg, ink] = MENU_ICON_COLORS[card.icon];
  const batch = batchChipDate(card.nextBatch ?? null);
  const hasChips = (card.chips?.length ?? 0) > 0 || batch || card.popular;
  return (
    <Link href={card.href} className="mm-card">
      <span aria-hidden="true" className="mm-card-shape" style={{ background: bg }} />
      <IconTile icon={card.icon} size={54} radius={16} iconSize={26} />
      <span className="mm-card-body">
        <span className="mm-card-name">{card.label}</span>
        {card.track && <span className="mm-card-track">{card.track}</span>}
        {hasChips && (
          <span className="mm-card-chips">
            {card.chips?.map((c) => (
              <span key={c} className="mm-chip" style={{ background: '#efeafb', color: '#4a3290' }}>
                {c}
              </span>
            ))}
            {batch && (
              <span className="mm-chip" style={{ background: '#e1f0f2', color: '#005663' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M3 4h18v17H3zM3 10h18" />
                </svg>
                Next batch {batch}
              </span>
            )}
            {card.popular && (
              <span className="mm-chip" style={{ background: '#fdf0e8', color: '#8f3f14' }}>
                Popular
              </span>
            )}
          </span>
        )}
      </span>
      <span aria-hidden="true" className="mm-card-chev" style={{ color: ink }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
}
