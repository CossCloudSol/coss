'use client';

import { useState, type ReactNode } from 'react';

/**
 * Popular / All tabs for the mobile drawer. Both panels are server-rendered
 * and passed in; this only switches which one shows. Popular opens first.
 */
export default function DrawerCourseTabs({ popular, all, popularCount, allCount }: { popular: ReactNode; all: ReactNode; popularCount: number; allCount: number }): JSX.Element {
  const [tab, setTab] = useState<'popular' | 'all'>('popular');
  const base = 'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[10px] text-sm font-bold';
  const on = 'bg-white text-[#0a3d4a] shadow-[0_2px_8px_rgba(10,61,74,.14)] dark:bg-slate-700 dark:text-white';
  const off = 'text-[#4a5c61] dark:text-slate-300';
  return (
    <div className="mm-drawer">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-[1.2px] text-[#4a5c61] dark:text-slate-400">Explore courses</p>
      <div role="tablist" aria-label="Course list" className="mb-3 flex gap-1 rounded-xl bg-[#eaf4f5] p-1 dark:bg-slate-800">
        <button type="button" role="tab" id="drawer-tab-popular" aria-selected={tab === 'popular'} aria-controls="drawer-panel-popular" onClick={() => setTab('popular')} className={`${base} ${tab === 'popular' ? on : off}`}>
          Popular <span className="rounded-full bg-[#fdf0e8] px-2 text-xs text-[#8f3f14]">{popularCount}</span>
        </button>
        <button type="button" role="tab" id="drawer-tab-all" aria-selected={tab === 'all'} aria-controls="drawer-panel-all" onClick={() => setTab('all')} className={`${base} ${tab === 'all' ? on : off}`}>
          All <span className="rounded-full bg-[#e3eaec] px-2 text-xs text-[#4a5c61]">{allCount}</span>
        </button>
      </div>
      <div role="tabpanel" id="drawer-panel-popular" aria-labelledby="drawer-tab-popular" hidden={tab !== 'popular'}>
        {popular}
      </div>
      <div role="tabpanel" id="drawer-panel-all" aria-labelledby="drawer-tab-all" hidden={tab !== 'all'}>
        {all}
      </div>
    </div>
  );
}
