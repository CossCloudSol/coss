'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { COURSES } from '@/data/courses-data';

/* ─────────────────────────────────────────────────────────────── */
/*  Constants                                                      */
/* ─────────────────────────────────────────────────────────────── */

const APPEAR_DELAY_MS = 3000;
const BRANCHES = ['Dilsukhnagar', 'Ameerpet', 'Online'] as const;
type Branch = (typeof BRANCHES)[number];

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ─────────────────────────────────────────────────────────────── */
/*  Course list — grouped by category, alphabetical within        */
/* ─────────────────────────────────────────────────────────────── */

const coursesByCategory: Array<{ category: string; courses: string[] }> = (() => {
  const map = new Map<string, string[]>();
  for (const c of COURSES) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c.shortTitle);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, courses]) => ({
      category,
      courses: [...courses].sort((a, b) => a.localeCompare(b)),
    }));
})();

/* ─────────────────────────────────────────────────────────────── */
/*  Helpers                                                        */
/* ─────────────────────────────────────────────────────────────── */

function buildWhatsAppUrl(number: string, name: string, course: string): string {
  const digits = number.replace(/\D/g, '');
  const to = digits.length === 12 && digits.startsWith('91') ? digits : `91${digits}`;
  const parts: string[] = ["Hi COSS! I'd like to know more about your courses."];
  if (name.trim()) parts.push(`My name is ${name.trim()}.`);
  if (course) parts.push(`I'm interested in: ${course}.`);
  parts.push('Please get in touch.');
  return `https://wa.me/${to}?text=${encodeURIComponent(parts.join(' '))}`;
}

/* ─────────────────────────────────────────────────────────────── */
/*  WhatsApp SVG icon                                              */
/* ─────────────────────────────────────────────────────────────── */

function WaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Form state                                                     */
/* ─────────────────────────────────────────────────────────────── */

interface FormState {
  name: string;
  phone: string;
  course: string;
  branch: Branch;
}

const defaultForm: FormState = {
  name: '',
  phone: '',
  course: '',
  branch: 'Dilsukhnagar',
};

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                      */
/* ─────────────────────────────────────────────────────────────── */

export default function WhatsAppWidget(): JSX.Element | null {
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const [form, setForm]           = useState<FormState>(defaultForm);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const panelRef    = useRef<HTMLDivElement | null>(null);
  const floatBtnRef = useRef<HTMLButtonElement | null>(null);

  /* 3-second delayed appearance */
  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  /* Escape key closes panel */
  useEffect(() => {
    if (!panelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPanelOpen(false);
        floatBtnRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  /* Focus trap */
  const trapFocus = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => !el.closest('[disabled]'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }, []);

  /* Move focus into panel on open */
  useEffect(() => {
    if (!panelOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const raf = requestAnimationFrame(() => {
      panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [panelOpen]);

  /* Reset form when panel closes */
  useEffect(() => {
    if (!panelOpen) {
      setForm(defaultForm);
      setErrors({});
      setSubmitted(false);
    }
  }, [panelOpen]);

  /* ── Helpers ── */
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '918885166007';
  const directUrl = buildWhatsAppUrl(waNumber, '', '');

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      next.name = 'Please enter your name (min 2 chars)';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10)))
      next.phone = 'Enter a valid 10-digit Indian mobile number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name.trim(),
          phone:    form.phone.trim(),
          course:   form.course || undefined,
          branch:   form.branch,
          formType: 'whatsapp_widget',
        }),
      });
    } catch {
      /* silently continue — open WhatsApp even if DB save fails */
    } finally {
      setSubmitting(false);
    }

    setSubmitted(true);
    const waUrl = buildWhatsAppUrl(waNumber, form.name, form.course);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setPanelOpen(false), 1400);
  }

  function handleSkip() {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    setPanelOpen(false);
  }

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        /* width is auto — sized to content (button or panel) */
      }}
    >
      {/* ── Chat Panel ──────────────────────────────── */}
      {panelOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with COSS on WhatsApp"
          className="wa-panel"
          onKeyDown={trapFocus}
        >
          {/* Header */}
          <div className="wa-panel-header">
            <div className="wa-panel-avatar" aria-hidden="true">C</div>
            <div className="wa-panel-info">
              <div className="wa-panel-name">COSS</div>
              <div className="wa-panel-subtitle">Cloud Solutions</div>
              <div className="wa-panel-online">
                <span className="wa-online-dot" aria-hidden="true" />
                Typically replies within 1 hour
              </div>
            </div>
            <button
              type="button"
              className="wa-close-btn"
              onClick={() => { setPanelOpen(false); floatBtnRef.current?.focus(); }}
              aria-label="Close chat panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          {submitted ? (
            /* ── Success state ── */
            <div className="wa-form-body wa-success" role="status" aria-live="polite">
              <div className="wa-success-icon" aria-hidden="true">{'✓'}</div>
              <p className="wa-success-title">Opening WhatsApp…</p>
              <p className="wa-success-sub">Your details have been saved. We will reach out to you soon!</p>
            </div>
          ) : (
            /* ── Lead capture form ── */
            <form className="wa-form-body" onSubmit={handleSubmit} noValidate>

              {/* Name */}
              <div className="wa-form-field">
                <label className="wa-form-label" htmlFor="wa-name">Your Name *</label>
                <input
                  id="wa-name"
                  className={`wa-form-input${errors.name ? ' wa-input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
                {errors.name && <span className="wa-field-error" role="alert">{errors.name}</span>}
              </div>

              {/* Phone */}
              <div className="wa-form-field">
                <label className="wa-form-label" htmlFor="wa-phone">Phone Number *</label>
                <input
                  id="wa-phone"
                  className={`wa-form-input${errors.phone ? ' wa-input-error' : ''}`}
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={13}
                />
                {errors.phone && <span className="wa-field-error" role="alert">{errors.phone}</span>}
              </div>

              {/* Course */}
              <div className="wa-form-field">
                <label className="wa-form-label" htmlFor="wa-course">Course (optional)</label>
                <select
                  id="wa-course"
                  className="wa-form-input wa-form-select"
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                >
                  <option value="">— Select a Course —</option>
                  {coursesByCategory.map(({ category, courses }) => (
                    <optgroup key={category} label={category}>
                      {courses.map((title) => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="wa-form-field">
                <span className="wa-form-label" id="wa-branch-label">Branch</span>
                <div className="wa-radio-group" role="radiogroup" aria-labelledby="wa-branch-label">
                  {BRANCHES.map((b) => (
                    <label key={b} className="wa-radio-label">
                      <input
                        type="radio"
                        name="wa-branch"
                        value={b}
                        checked={form.branch === b}
                        onChange={() => setForm((f) => ({ ...f, branch: b }))}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="wa-chat-btn"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  'Saving…'
                ) : (
                  <>
                    <WaIcon size={18} />
                    Chat on WhatsApp {'→'}
                  </>
                )}
              </button>

              {/* Skip */}
              <button
                type="button"
                className="wa-skip-link"
                onClick={handleSkip}
              >
                Skip, just chat {'→'}
              </button>

            </form>
          )}
        </div>
      )}

      {/* ── Floating Button ─────────────────────────── */}
      <button
        ref={floatBtnRef}
        type="button"
        className="wa-btn"
        style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
        onClick={() => setPanelOpen((prev) => !prev)}
        aria-label="Chat with us on WhatsApp"
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
      >
        {panelOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#fff' }}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <WaIcon size={28} />
        )}
      </button>
    </div>
  );
}
