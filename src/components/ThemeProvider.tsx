'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

// Not 'theme': the old provider wrote that key on every visit, so it doesn't
// record a real choice. This key is written only when the visitor toggles.
const STORAGE_KEY = 'coss-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

/**
 * Theme state. The inline script in app/layout.tsx sets the `dark` class
 * before first paint (saved choice, else the system setting), so there is no
 * flash; this provider only reads that result, never overwrites it on load.
 * Until the visitor picks a theme it keeps following the system setting;
 * a click on the toggle saves the choice.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 'light' for SSR/hydration; synced from the DOM right after mount.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable: follow the system */
    }
    if (saved === 'dark' || saved === 'light') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* not persisted; still applied */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
