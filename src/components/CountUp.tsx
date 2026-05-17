'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface CountUpProps {
  /**
   * The display value, e.g. `"5000+"`, `"100%"`, `"₹3–25L"`. We extract the
   * leading digit run, animate it from 0, and re-attach whatever
   * non-numeric prefix / suffix the original string carries. If no digit
   * run can be parsed we just render the string as-is with no animation.
   */
  value: string;
  /** Animation length in milliseconds. Defaults to 1500 per the spec. */
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface ParsedNumber {
  num: number;
  prefix: string;
  suffix: string;
}

/**
 * Pull the first digit run out of the value. Anything before it becomes
 * `prefix`, anything after becomes `suffix`. Commas inside the digit run are
 * stripped before parsing so "1,200" → 1200.
 */
function parseLeadingNumber(value: string): ParsedNumber | null {
  const match = value.match(/^([^\d]*)(\d[\d,]*)(.*)$/);
  if (!match) return null;
  const prefix = match[1] ?? '';
  const numStr = (match[2] ?? '').replace(/,/g, '');
  const suffix = match[3] ?? '';
  const num = parseInt(numStr, 10);
  if (Number.isNaN(num)) return null;
  return { num, prefix, suffix };
}

/** Cubic ease-out — matches the gentle "settle" feel of most count-up libs. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function CountUp({
  value,
  durationMs = 1500,
  className,
  style,
}: CountUpProps): JSX.Element {
  const parsed = parseLeadingNumber(value);
  const [current, setCurrent] = useState<number>(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const animatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (parsed === null) return;
    const node = ref.current;
    if (node === null) return;

    // Older browsers / SSR-only environments — skip straight to final value.
    if (typeof IntersectionObserver === 'undefined') {
      setCurrent(parsed.num);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (animatedRef.current) continue;
          animatedRef.current = true;

          const start = performance.now();
          const target = parsed.num;
          function step(now: number): void {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / durationMs);
            setCurrent(Math.round(target * easeOutCubic(t)));
            if (t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);

          // Fire once — disconnect so the animation never replays.
          observer.disconnect();
          break;
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [parsed, durationMs]);

  if (parsed === null) {
    // Couldn't extract a number — render the raw string verbatim so the
    // component is a transparent drop-in for arbitrary stat labels.
    return (
      <span ref={ref} className={className} style={style}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className} style={style}>
      {parsed.prefix}
      {current.toLocaleString()}
      {parsed.suffix}
    </span>
  );
}
