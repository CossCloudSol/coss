import type { SearchIndex } from '@/lib/course-search';
import { categoryMenuStyle, MENU_GROUP_TITLES, type MenuGroup, type MenuIconKey } from '@/lib/menu-icons';
import { resolvePopular, type PopularItem } from '@/lib/popular-courses';
import { finalHref } from '@/lib/redirect-resolve';
import { REDIRECTS } from '../../redirects.config.mjs';

/** Every link in the menu goes straight to its final URL (no 308 hop). */
const final = (path: string) => finalHref(path, REDIRECTS);

export interface MenuCategory {
  slug: string;
  /** The category page, as a final URL. */
  href: string;
  name: string;
  count: number;
  icon: MenuIconKey;
  blurb: string;
  courses: Array<{ id: string; label: string; href: string; track: string; nextBatch: string | null; popular: boolean }>;
}

export interface MenuGroupData {
  group: MenuGroup;
  title: string;
  categories: MenuCategory[];
}

export interface MenuData {
  popular: PopularItem[];
  groups: MenuGroupData[];
}

/** Everything the desktop panel and the mobile drawer show, built once from the catalogue. */
export function buildMenuData(index: SearchIndex): MenuData {
  const popular = resolvePopular(index).items.map((p) => ({ ...p, href: final(p.href) }));
  const popularSlugs = new Set(popular.map((p) => p.courseSlug).filter((s): s is string => !!s));

  const categories: Array<MenuCategory & { group: MenuGroup; order: number }> = index.categories.map((c) => {
    const style = categoryMenuStyle(c.slug);
    return {
      slug: c.slug,
      href: final(`/courses/${c.slug}`),
      name: c.name,
      count: c.count,
      icon: style.icon,
      blurb: style.blurb || `${c.count} ${c.count === 1 ? 'course' : 'courses'}`,
      group: style.group,
      order: style.order,
      courses: index.courses
        .filter((x) => x.categorySlug === c.slug)
        .map((x) => ({ id: x.id, label: x.title, href: final(x.url), track: '', nextBatch: x.nextBatch, popular: popularSlugs.has(x.slug) })),
    };
  });

  const groups: MenuGroupData[] = (['tech', 'business'] as const)
    .map((group) => ({
      group,
      title: MENU_GROUP_TITLES[group],
      categories: categories
        .filter((c) => c.group === group)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map(({ group: _g, order: _o, ...rest }) => rest),
    }))
    .filter((g) => g.categories.length > 0);

  return { popular, groups };
}
