'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CategoryItem {
  slug: string;
  name: string;
  description: string | null;
  courseCount: number;
  accentGradient: string;
  accentSolid: string;
  accentDark: string;
  iconBg: string;
  icon: string;
  illustration: string;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

const MOBILE_INITIAL = 6;

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleOnMobile = showAll ? categories : categories.slice(0, MOBILE_INITIAL);
  const hasMore = categories.length > MOBILE_INITIAL;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {/* On mobile, show subset; on sm+ show all */}
        {categories.map((cat, idx) => {
          const hiddenOnMobile = !showAll && idx >= MOBILE_INITIAL;
          return (
            <Link
              key={cat.slug}
              href={`/courses/${cat.slug}/`}
              className={`group block rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 border-[var(--cat-accent-light)] dark:border-[var(--cat-accent-dark)] bg-[#161320] hover:shadow-xl${hiddenOnMobile ? ' hidden sm:block' : ''}`}
              style={{
                ['--cat-accent-light' as string]: cat.accentSolid,
                ['--cat-accent-dark' as string]: cat.accentDark,
              }}
            >
              <div className="p-3 sm:p-5 pb-0">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: cat.iconBg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base leading-snug text-white group-hover:text-[var(--cat-accent-light)] dark:group-hover:text-[var(--cat-accent-dark)] transition-colors">
                      {cat.name}
                    </h3>
                    <span
                      className="inline-block mt-1 text-[10px] sm:text-xs font-medium px-2.5 py-0.5 rounded-full text-white"
                      style={{ background: cat.accentGradient }}
                    >
                      {cat.courseCount} {cat.courseCount === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                </div>

                <p
                  className="text-slate-400 text-xs leading-relaxed mb-4 min-h-[2.5rem]"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {cat.description || 'Industry-focused training with placement support in Hyderabad.'}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold transition-colors text-[var(--cat-accent-light)] dark:text-[var(--cat-accent-dark)]">
                    Explore Courses →
                  </span>
                </div>
              </div>

              <div className="relative h-24 sm:h-32 mx-3 mb-3 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.illustration}
                  alt={`${cat.name} illustration`}
                  loading="lazy"
                  className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile-only show-more toggle */}
      {hasMore && (
        <div className="mt-6 flex justify-center sm:hidden">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:border-slate-400 hover:text-white transition-colors"
          >
            {showAll ? 'Show fewer categories ↑' : `Show all ${categories.length} categories ↓`}
          </button>
        </div>
      )}
    </>
  );
}
