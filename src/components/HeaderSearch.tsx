'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export const SEARCH_PLACEHOLDER = 'Search courses: AWS, Python, Cyber Security…';

/**
 * Header course search: a plain GET form to /courses?q=, so it works before
 * (and without) JavaScript. Ctrl K / ⌘K focuses it from anywhere on the page.
 */
export default function HeaderSearch({
  autoFocus = false,
  shortcut = true,
  className = '',
}: {
  autoFocus?: boolean;
  /** Listen for Ctrl K / ⌘K and show the hint (desktop box only). */
  shortcut?: boolean;
  className?: string;
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!shortcut) return;
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcut]);

  return (
    <form
      action="/courses"
      method="get"
      role="search"
      aria-label="Search courses"
      className={`flex h-[46px] items-center gap-2.5 rounded-xl border border-[#cfdadd] bg-[#f4f7f8] pl-4 pr-1.5 text-[#6b7d82] focus-within:border-[#005663] focus-within:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:focus-within:bg-slate-900 ${className}`}
    >
      <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label="Search courses"
        placeholder={SEARCH_PLACEHOLDER}
        autoComplete="off"
        className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#17262a] outline-none placeholder:text-[#6b7d82] dark:text-slate-100"
      />
      {shortcut && (
        <kbd className="hidden shrink-0 rounded-md border border-[#cfdadd] bg-white px-1.5 py-0.5 font-sans text-[11px] font-bold text-[#6b7d82] xl:inline dark:border-slate-600 dark:bg-slate-900">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      )}
    </form>
  );
}
