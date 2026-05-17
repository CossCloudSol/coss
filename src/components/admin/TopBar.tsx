'use client';

import { Menu, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';

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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onToggleSidebar !== undefined ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open navigation"
            className="lg:hidden -ml-2 rounded-md p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative inline-flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Live</span>
        </span>
        <span className="hidden text-gray-300 dark:text-gray-600 sm:inline" aria-hidden="true">·</span>
        <span
          className="hidden min-w-[8.5rem] text-right text-gray-500 dark:text-gray-400 sm:inline"
          suppressHydrationWarning
        >
          {today}
        </span>

        {/* Dark / light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-md p-1.5 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {dark
            ? <Sun  className="h-4 w-4" aria-hidden="true" />
            : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
