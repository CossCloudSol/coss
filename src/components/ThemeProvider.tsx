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
 * Theme state. Light by default: the inline script in app/layout.tsx sets the
 * `dark` class before first paint only when the visitor chose dark with the
 * toggle ('coss-theme' === 'dark'), so there is no flash; this provider only
 * reads that result. The system setting is never followed. A click on the
 * toggle applies and saves the choice.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 'light' for SSR/hydration; synced from the DOM right after mount.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
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
