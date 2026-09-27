'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

/** Light/dark switch in the footer's bottom bar (the header row has none). */
export default function FooterThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-inherit hover:text-white"
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
