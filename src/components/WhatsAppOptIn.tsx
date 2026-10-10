'use client';

import { useId } from 'react';

export const WHATSAPP_OPT_IN_LABEL = 'Send me batch updates on WhatsApp (optional)';

/**
 * Optional WhatsApp opt-in for lead forms. Unticked by default; the lead stores the opt-in
 * (and its time) only when it is ticked. Two ways to use it:
 *  - inside a form read with FormData (useLeadForm): leave `checked` out; the box posts
 *    whatsappOptIn=yes only when ticked;
 *  - in a form that keeps its own state: pass `checked` and `onChange`.
 * The whole row is the label, at least 44px tall, so it is easy to tap. Takes the form's
 * text colour; a fixed-white card must carry the `light-surface` class (see globals.css).
 */
export default function WhatsAppOptIn({
  checked,
  onChange,
  style,
}: {
  checked?: boolean;
  onChange?: (value: boolean) => void;
  style?: React.CSSProperties;
}) {
  const id = useId();
  const controlled = checked !== undefined;
  return (
    <label
      htmlFor={id}
      className="wa-optin"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '44px',
        cursor: 'pointer',
        fontSize: '13px',
        lineHeight: 1.4,
        // No inline colour: the label inherits the surface's colour, and
        // `.light-surface .wa-optin` in globals.css pins it on a white card.
        textAlign: 'left',
        ...style,
      }}
    >
      <input
        id={id}
        type="checkbox"
        name="whatsappOptIn"
        value="yes"
        {...(controlled ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) } : { defaultChecked: false })}
        style={{ width: '18px', height: '18px', margin: 0, flexShrink: 0, accentColor: '#005663', colorScheme: 'light', cursor: 'pointer' }}
      />
      <span>{WHATSAPP_OPT_IN_LABEL}</span>
    </label>
  );
}

/** For forms that keep their own state: read the box from the submitted form (call before any await). */
export function optInFromForm(form: EventTarget | null): boolean {
  return typeof HTMLFormElement !== 'undefined' && form instanceof HTMLFormElement && new FormData(form).get('whatsappOptIn') === 'yes';
}
