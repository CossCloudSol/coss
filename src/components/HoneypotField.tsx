'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { FILL_TIME_FIELD, HONEYPOT_FIELD } from '@/lib/lead-validation';

export type BotFields = { [HONEYPOT_FIELD]: string; [FILL_TIME_FIELD]: number };

/**
 * Bot-protection fields for a public form. The fill timer starts when the form
 * is shown: on mount, or each time `visible` turns true for forms inside a
 * modal or panel. Spread `botFields()` into the request body at submit time.
 */
export function useBotGuard(visible = true): {
  honeypotRef: RefObject<HTMLInputElement>;
  botFields: () => BotFields;
} {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    shownAt.current = visible ? Date.now() : null;
  }, [visible]);

  const botFields = useCallback(
    (): BotFields => ({
      [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
      [FILL_TIME_FIELD]: shownAt.current === null ? 0 : Date.now() - shownAt.current,
    }),
    [],
  );

  return { honeypotRef, botFields };
}

/**
 * Off-screen input that people never see or reach by keyboard, and that
 * screen readers skip. Bots that fill every field fill this one too.
 */
export default function HoneypotField({ inputRef }: { inputRef: RefObject<HTMLInputElement> }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
    >
      <label>
        Website
        <input ref={inputRef} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
