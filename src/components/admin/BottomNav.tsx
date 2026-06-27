'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS, getActiveGroup, type NavGroup } from './navGroups';
import MobileDrawer from './MobileDrawer';

export default function BottomNav(): JSX.Element {
  const pathname = usePathname() ?? '';
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState<NavGroup | null>(null);

  useEffect(() => {
    setOpenGroupId(null);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = openGroupId !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openGroupId]);

  const activeGroupId = getActiveGroup(pathname);

  const handleTabPress = (id: string): void => {
    const group = NAV_GROUPS.find(g => g.id === id) ?? null;
    if (group !== null) setCurrentGroup(group);
    setOpenGroupId(prev => (prev === id ? null : id));
  };

  return (
    <div className="lg:hidden">
      {/* Bottom nav bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d0d7de] bg-white dark:border-[#21262d] dark:bg-[#161b22]"
      >
        <div className="flex h-14">
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = activeGroupId === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleTabPress(group.id)}
                aria-label={group.label}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1"
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 h-1 w-1 rounded-full bg-[#0f6e56] dark:bg-[#1b8a6b]"
                  />
                )}
                <Icon
                  size={22}
                  className={
                    isActive
                      ? 'text-[#0f6e56] dark:text-[#1b8a6b]'
                      : 'text-[#8c8fa8] dark:text-[#8b949e]'
                  }
                />
                <span
                  className={`text-[9px] leading-none ${
                    isActive
                      ? 'text-[#0f6e56] dark:text-[#1b8a6b]'
                      : 'text-[#8c8fa8] dark:text-[#8b949e]'
                  }`}
                >
                  {group.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Slide-up drawer */}
      <MobileDrawer
        group={currentGroup}
        isOpen={openGroupId !== null}
        onClose={() => setOpenGroupId(null)}
      />
    </div>
  );
}
