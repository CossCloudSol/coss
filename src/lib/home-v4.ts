/**
 * Homepage, Design v4 (design-ref Main.dc.html / Mobile.dc.html): the data the sections share.
 * Colours come from the menu's category pairs (menu-icons.ts), so the homepage, the menu and the
 * course pages stay one palette.
 */
import { categoryMenuStyle, MENU_ICON_COLORS, MENU_ICON_PATHS, type MenuIconKey } from '@/lib/menu-icons';

/** Popular-courses tabs. A category not listed is shown under "All" only. */
export const POPULAR_GROUPS = [
  { key: 'ai-data', label: 'AI & Data', slugs: ['artificial-intelligence-training', 'data-analytics-bi', 'data-engineering', 'quantum-computing'] },
  { key: 'cloud-devops', label: 'Cloud & DevOps', slugs: ['cloud-computing', 'devops-multi-cloud', 'software-testing-os'] },
  { key: 'cyber', label: 'Cyber Security', slugs: ['cyber-security'] },
  { key: 'full-stack', label: 'Full Stack', slugs: ['programming-full-stack'] },
  { key: 'marketing-hr', label: 'Marketing & HR', slugs: ['digital-design', 'human-resource'] },
] as const;

export function groupKeyOf(categorySlug: string | null | undefined): string {
  return POPULAR_GROUPS.find((g) => (g.slugs as readonly string[]).includes(categorySlug ?? ''))?.key ?? 'other';
}

export interface CourseLook {
  icon: MenuIconKey;
  path: string;
  /** Dark ink: banner fill and tile icon colour. */
  ink: string;
  /** Light tint: tag chips and track tiles. */
  tint: string;
}

export function courseLook(categorySlug: string | null | undefined): CourseLook {
  const icon = categoryMenuStyle(categorySlug).icon;
  const [tint, ink] = MENU_ICON_COLORS[icon];
  return { icon, path: MENU_ICON_PATHS[icon], ink, tint };
}

/** Dot-grid banner fill used behind every course and batch head (design `banner()`). */
export function bannerStyle(ink: string, dot = 16): React.CSSProperties {
  return {
    backgroundColor: ink,
    backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 1px, transparent 1.5px)',
    backgroundSize: `${dot}px ${dot}px`,
  };
}

// Icon paths the design uses that the menu set does not have.
export const ICON = {
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.2 13.9 7 22l5-3 5 3-1.2-8.1',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  brief: 'M3 7h18v13H3zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM20 17v4H6.5A2.5 2.5 0 0 1 4 19.5',
  play: 'M5 3l14 9-14 9V3z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  flask: 'M9 3h6M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 9V3',
  cal: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  whatsapp: 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5Z',
  check: 'm5 12 5 5 9-10',
  quote: 'M3 21c3 0 7-1 7-8V5H3v8h4c0 4-2 5-4 5zM14 21c3 0 7-1 7-8V5h-7v8h4c0 4-2 5-4 5z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16 8l-6 2-2 6 6-2z',
} as const;

/** Hero stat cards. Allowed claims only: since 2010, 5,000+ students trained, 50+ hiring partners, 1-year LMS access. */
export const HERO_STATS = [
  { value: '2010', label: 'Training since', icon: ICON.award },
  { value: '5,000+', label: 'Students trained', icon: ICON.users },
  { value: '50+', label: 'Hiring partners', icon: ICON.brief },
  { value: '1 year', label: 'LMS access', icon: ICON.book },
] as const;

/** Floating icons around the hero form (design `orbit`): [desktop position, mobile position, icon]. */
export const ORBIT = [
  { desktop: 'left-2 top-[120px]', mobile: 'left-[14px] top-[10px]', icon: 'cloud' },
  { desktop: 'right-1.5 top-[30px]', mobile: 'right-[18px] top-1', icon: 'ai' },
  { desktop: 'left-[60px] top-6', mobile: 'left-[120px] top-0', icon: 'cyber' },
  { desktop: '-right-2 bottom-[150px]', mobile: 'right-24 top-3.5', icon: 'data' },
  { desktop: 'left-4 bottom-[130px]', mobile: 'hidden', icon: 'prog' },
] as const satisfies readonly { desktop: string; mobile: string; icon: MenuIconKey }[];

export const HERO_POPULAR = ['Artificial Intelligence', 'AWS DevOps', 'Data Science', 'Cyber Security', 'Python Full Stack'] as const;

export const DESIGN_HEADLINE = 'Launch your IT career with live, hands-on training';
export const DESIGN_SUBTEXT =
  'Trainer-led courses in Cloud, DevOps, AI, Data, Cyber Security and Full Stack. Learn in class at Dilsukhnagar or Ameerpet, or join live online.';

export const STEPS = [
  { title: 'Book a free demo', body: 'Meet the trainer and see how classes run. No payment needed.', icon: ICON.play },
  { title: 'Choose how you learn', body: 'Classroom at Dilsukhnagar or Ameerpet, or live online.', icon: ICON.monitor },
  { title: 'Learn with labs', body: 'Hands-on practice, class recordings and 1-year LMS access.', icon: ICON.flask },
] as const;

export const CAREER_POINTS = ['Resume building', 'Mock interviews', 'Interview preparation', 'Referrals to our 50+ hiring partners'] as const;

/** Day-of-week / day / month for a batch date, in IST (the date cards use these). */
export function dateParts(d: Date): { dow: string; day: string; mon: string } {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...o }).format(d);
  return { dow: f({ weekday: 'short' }).toUpperCase(), day: f({ day: 'numeric' }), mon: f({ month: 'short' }).toUpperCase() };
}
