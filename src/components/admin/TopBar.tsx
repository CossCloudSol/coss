'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';
import NotificationBell from '@/components/admin/NotificationBell';

type TopBarProps = {
  title: string;
  onToggleSidebar?: () => void;
};

function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TopBar({ title, onToggleSidebar }: TopBarProps): JSX.Element {
  const [today, setToday] = useState<string>('');
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    setToday(formatToday());
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#023640] dark:border-[#21262d] bg-[#024c57] dark:bg-[#0d1117] px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onToggleSidebar !== undefined ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open navigation"
            className="lg:hidden -ml-2 rounded-md p-2 text-white/70 hover:text-white dark:text-gray-400 transition-colors hover:bg-white/10 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        <div className="flex items-center">
          <Image
            src="https://res.cloudinary.com/dfditihuw/image/upload/v1782740584/admin-logo-dark.png_vrbcyr.png"
            alt="Coss Cloud Solutions — Institute Management System"
            width={180}
            height={54}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-white/15 border border-white/35 dark:bg-[#0d2a1e] dark:border-[#1b8a6b]">
          <span className="relative inline-flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ef0c8] dark:bg-[#3fb950] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5ef0c8] dark:bg-[#3fb950]" />
          </span>
          <span className="text-[10px] font-medium text-[#5ef0c8] dark:text-[#3fb950]">Live</span>
        </span>
        <span className="hidden text-white/30 dark:text-gray-600 sm:inline" aria-hidden="true">·</span>
        <span
          className="hidden min-w-[8.5rem] text-right text-white/60 dark:text-gray-400 sm:inline"
          suppressHydrationWarning
        >
          {today}
        </span>

        <NotificationBell />

        {/* Dark / light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-md p-1.5 text-white/70 hover:text-white dark:text-[#8b949e] dark:hover:text-[#e6edf3] transition-colors hover:bg-white/10 dark:hover:bg-gray-700"
        >
          {dark
            ? <Sun  className="h-4 w-4" aria-hidden="true" />
            : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
