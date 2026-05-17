'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COURSES } from '@/data/courses-data';

const CATEGORY_ORDER: ReadonlyArray<string> = [
  'Data, Analytics & BI',
  'Cloud Computing',
  'DevOps & Multi-Cloud',
  'Programming & Full Stack',
  'Data Engineering',
  'Cyber Security & Networking',
  'ERP, CRM & Enterprise Tools',
  'Software Testing & OS',
  'Digital & Design',
  'Professional & Soft Skills',
];

interface CourseEntry { shortTitle: string; slug: string }
interface CategoryGroup { category: string; num: string; courses: CourseEntry[] }

const COURSES_BY_CATEGORY: CategoryGroup[] = (() => {
  const map = new Map<string, CourseEntry[]>();
  for (const cat of CATEGORY_ORDER) map.set(cat, []);
  for (const c of COURSES) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push({ shortTitle: c.shortTitle, slug: c.slug });
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.shortTitle.localeCompare(b.shortTitle));
  }
  const result: CategoryGroup[] = [];
  let idx = 1;
  for (const cat of CATEGORY_ORDER) {
    const bucket = map.get(cat);
    if (bucket && bucket.length > 0) {
      result.push({ category: cat, num: String(idx).padStart(2, '0'), courses: bucket });
      idx++;
    }
  }
  for (const [cat, bucket] of map.entries()) {
    if (!CATEGORY_ORDER.includes(cat) && bucket.length > 0) {
      result.push({ category: cat, num: String(idx).padStart(2, '0'), courses: bucket });
      idx++;
    }
  }
  return result;
})();

export default function CourseAccordionNav({ activeSlug }: { activeSlug: string }): JSX.Element {
  const activeCat = COURSES.find((c) => c.slug === activeSlug)?.category ?? '';
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const g of COURSES_BY_CATEGORY) state[g.category] = g.category === activeCat;
    return state;
  });

  function toggle(category: string) {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  return (
    <nav
      aria-label="All Courses"
      style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-card)', overflow: 'hidden' }}
    >
      <div style={{ background: '#e47538', color: '#fff', padding: '10px 14px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px' }}>
        All Courses
      </div>

      {COURSES_BY_CATEGORY.map((group) => {
        const isOpen = open[group.category] ?? false;
        const panelId  = `acc-panel-${group.category.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        const headerId = `acc-hdr-${group.category.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

        return (
          <div key={group.category} style={{ borderBottom: '1px solid var(--border-card)' }}>

            <div
              id={headerId}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(group.category)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(group.category); } }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', cursor: 'pointer', userSelect: 'none', background: isOpen ? 'var(--primary-light, rgba(228,117,56,0.06))' : 'transparent', transition: 'background 0.2s' }}
            >
              <span
                aria-hidden="true"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px', borderRadius: '4px', background: isOpen ? '#e47538' : 'var(--bg-alt, rgba(0,0,0,0.05))', color: isOpen ? '#fff' : 'var(--text-muted)', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '10px', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
              >
                {group.num}
              </span>

              <span
                style={{ flex: 1, fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '12px', color: isOpen ? '#e47538' : 'var(--text)', transition: 'color 0.2s', lineHeight: '1.35' }}
              >
                {group.category}
              </span>

              <span
                aria-hidden="true"
                style={{ display: 'inline-block', fontSize: '16px', color: isOpen ? '#e47538' : 'var(--text-muted)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease, color 0.2s', lineHeight: 1, flexShrink: 0 }}
              >
                &rsaquo;
              </span>
            </div>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              style={{ maxHeight: isOpen ? `${group.courses.length * 44}px` : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}
            >
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {group.courses.map((course) => {
                  const isActive = course.slug === activeSlug;
                  return (
                    <li key={course.slug}>
                      <Link
                        href={`/${course.slug}`}
                        aria-current={isActive ? 'page' : undefined}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px 9px 24px', fontSize: '13px', fontFamily: isActive ? 'Poppins, sans-serif' : 'Open Sans, sans-serif', fontWeight: isActive ? 600 : 400, color: isActive ? '#e47538' : 'var(--text-muted)', background: isActive ? 'var(--primary-light, rgba(228,117,56,0.08))' : 'transparent', borderLeft: isActive ? '3px solid #e47538' : '3px solid transparent', textDecoration: 'none', transition: 'color 0.15s, background 0.15s, border-color 0.15s' }}
                      >
                        <span>{course.shortTitle}</span>
                        <span aria-hidden="true" style={{ fontSize: '12px', opacity: 0.5 }}>&rsaquo;</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>
        );
      })}
    </nav>
  );
}
