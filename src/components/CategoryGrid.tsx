'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Cloud,
  Code2,
  Database,
  Palette,
  Rocket,
  Settings,
  Shield,
  Stethoscope,
  TestTube2,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Mirrors the slug→icon convention already used in category-icons.ts and
// CategoryIconDisplay.tsx elsewhere in the app, extended with the two
// categories (AI, medical coding) those maps don't cover yet.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'artificial-intelligence-training': BrainCircuit,
  'data-analytics-bi': BarChart2,
  'cloud-computing': Cloud,
  'devops-multi-cloud': Settings,
  'programming-full-stack': Code2,
  'data-engineering': Database,
  'cyber-security': Shield,
  'erp-crm-enterprise-tools': Building2,
  'software-testing-os': TestTube2,
  'digital-design': Palette,
  'professional-soft-skills': Users,
  'human-resource': Briefcase,
  'quantum-computing': Rocket,
  'medical-coding': Stethoscope,
};
const DEFAULT_CATEGORY_ICON: LucideIcon = BookOpen;

interface CategoryItem {
  slug: string;
  name: string;
  description: string | null;
  courseCount: number;
  accentGradient: string;
  accentSolid: string;
  accentDark: string;
  iconBg: string;
  illustration: string;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

const MOBILE_INITIAL = 6;

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = categories.length > MOBILE_INITIAL;

  return (
    <>
      <div className="cat-grid">
        {categories.map((cat, idx) => {
          const hiddenOnMobile = !showAll && idx >= MOBILE_INITIAL;
          const Icon = CATEGORY_ICONS[cat.slug] ?? DEFAULT_CATEGORY_ICON;

          return (
            <Link
              key={cat.slug}
              href={`/courses/${cat.slug}/`}
              aria-label={`${cat.name} — ${cat.courseCount} ${cat.courseCount === 1 ? 'course' : 'courses'}`}
              className={`cat-card cat-card-shimmer group relative flex flex-col [-webkit-tap-highlight-color:transparent] rounded-[20px] border bg-[rgba(16,24,40,0.88)] border-white/[0.06] backdrop-blur-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-white/[0.12] hover:shadow-[0_16px_48px_rgba(0,0,0,0.8)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 transition-[transform,box-shadow,border-color] duration-300 ease-out focus-visible:outline-none focus-visible:-translate-y-1.5 motion-reduce:focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]${hiddenOnMobile ? ' hidden sm:flex' : ''}`}
            >
              <div className="cat-row1 flex items-center">
                <div
                  className="cat-icon shrink-0 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,.3)] transition-transform duration-300 ease-out group-hover:scale-105"
                  style={{ background: cat.accentGradient }}
                  aria-hidden="true"
                >
                  <Icon className="cat-icon-svg text-white" aria-hidden="true" />
                </div>
                <h3 className="cat-title line-clamp-2 font-bold text-[#f1f5f9]" style={{ lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {cat.name}
                </h3>
              </div>

              <div className="cat-footer mt-auto flex items-center justify-between border-t border-white/[0.04]">
                <span className="cat-count flex items-center gap-1.5 font-semibold text-[#94a3b8]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                  {cat.courseCount} {cat.courseCount === 1 ? 'course' : 'courses'}
                </span>

                <span className="cat-explore inline-flex items-center gap-1 rounded-full px-2.5 py-[0.2rem] font-bold bg-white/[0.03] group-hover:bg-white/[0.06] text-[#60a5fa] group-hover:text-[#93bbfc] transition-all duration-300 ease-out">
                  Explore
                  <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </span>
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
