'use client';

import { Children, useEffect, useState, type ReactNode } from 'react';

const INTERVAL_MS = 4000;

/**
 * Shows one of its children at a time and rotates every 4 s (phones). Stops
 * under prefers-reduced-motion and while hovered or focused. Visibility is
 * pure CSS on data-active (globals.css), so all messages stay in the HTML.
 */
export default function StripRotator({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  const count = Children.toArray(children).filter(Boolean).length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  return (
    <div
      data-strip-rotator=""
      data-active={active}
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {children}
    </div>
  );
}
