'use client';

import { useEffect, useState } from 'react';
import { submitLead } from '@/lib/submitLead';
import { buildBrochureDelivery } from '@/lib/whatsapp';
import { attachmentUrl } from '@/lib/cloudinary';
import { trackBrochureDownload } from '@/lib/click-tracking';

/* -------------------------------------------------------------------------- */
/*  "Download Brochure" trigger + popup. Two paths: enter a WhatsApp number   */
/*  (primary — creates a lead, then opens a pre-filled wa.me chat so a staff  */
/*  member can reply with the actual PDF) or skip straight to a plain        */
/*  Cloudinary download (no lead, course-tagged analytics event only).       */
/*                                                                            */
/*  Two trigger visuals share one modal + one set of state/handlers (via     */
/*  useBrochureModal/BrochureModal below) so there's a single source of      */
/*  truth for the popup logic:                                               */
/*    - BrochureButton (default export): desktop promo card                  */
/*    - BrochureMobileTab: fixed right-edge tab, mobile-only                  */
/* -------------------------------------------------------------------------- */

interface BrochureButtonProps {
  courseSlug: string;
  courseTitle: string;
  brochureUrl: string;
}

function useBrochureModal({ courseSlug, courseTitle, brochureUrl }: BrochureButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setName('');
    setPhone('');
    setError(null);
    setSent(false);
  }

  async function handleWhatsAppSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    const delivery = buildBrochureDelivery(phone, courseTitle);
    if (!delivery.ok) {
      setError(delivery.error);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await submitLead({
      name: name.trim(),
      phone: delivery.normalizedPhone,
      course: courseTitle,
      branch: 'Online',
      formType: 'brochure_request',
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSent(true);
    window.open(delivery.waLink, '_blank', 'noopener,noreferrer');
    setTimeout(close, 1400);
  }

  function handleSkip() {
    trackBrochureDownload(courseSlug, courseTitle);
    window.open(attachmentUrl(brochureUrl), '_blank', 'noopener,noreferrer');
    close();
  }

  return { open, setOpen, name, setName, phone, setPhone, error, submitting, sent, close, handleWhatsAppSubmit, handleSkip };
}

type BrochureModalState = ReturnType<typeof useBrochureModal>;

function BrochureModal({ courseTitle, modal }: { courseTitle: string; modal: BrochureModalState }) {
  const { open, name, setName, phone, setPhone, error, submitting, sent, close, handleWhatsAppSubmit, handleSkip } = modal;
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Get the ${courseTitle} brochure`}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white pr-4">
            Get the {courseTitle} Brochure
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {sent ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 py-6 text-center" role="status" aria-live="polite">
            Opening WhatsApp… we&apos;ll send the syllabus there shortly.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Share your WhatsApp number and we&apos;ll send the syllabus PDF there — or just download it now.
            </p>
            <form onSubmit={(e) => void handleWhatsAppSubmit(e)} noValidate>
              <label htmlFor="brochure-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Your Name
              </label>
              <input
                id="brochure-name"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <label htmlFor="brochure-phone" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 mt-3">
                WhatsApp Number
              </label>
              <input
                id="brochure-phone"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white font-bold text-sm px-6 py-3 transition-colors"
              >
                {submitting ? 'Sending…' : 'Send via WhatsApp'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full mt-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Just download the PDF →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const DOWNLOAD_ICON_PATH = 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3';

/** Desktop promo card — replaces the plain outlined trigger in the sidebar. */
export default function BrochureButton({ courseSlug, courseTitle, brochureUrl }: BrochureButtonProps): JSX.Element {
  const modal = useBrochureModal({ courseSlug, courseTitle, brochureUrl });

  return (
    <>
      <button
        type="button"
        onClick={() => modal.setOpen(true)}
        aria-label={`Download the ${courseTitle} brochure`}
        className="w-full text-left rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={DOWNLOAD_ICON_PATH} />
            </svg>
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] text-[10px] font-extrabold tracking-wide px-2.5 py-1 uppercase">
            Free PDF
          </span>
        </div>
        <h3 className="text-[15px] font-extrabold text-[var(--text)] mb-1">Download Brochure</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">Get the syllabus PDF for {courseTitle}</p>
        <span className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-white font-bold text-sm px-5 py-2.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={DOWNLOAD_ICON_PATH} />
          </svg>
          Download Now
        </span>
      </button>

      <BrochureModal courseTitle={courseTitle} modal={modal} />
    </>
  );
}

/**
 * Mobile-only trigger: a tab fixed to the right edge, vertically centered.
 * Independent of `.page-with-sidebar` — renders regardless of that
 * container's mobile display:none rule, so it needs its own mount point
 * outside the sidebar column (see the two course detail pages).
 */
export function BrochureMobileTab({ courseSlug, courseTitle, brochureUrl }: BrochureButtonProps): JSX.Element {
  const modal = useBrochureModal({ courseSlug, courseTitle, brochureUrl });

  return (
    <>
      <button
        type="button"
        onClick={() => modal.setOpen(true)}
        aria-label={`Download the ${courseTitle} brochure`}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1 rounded-l-2xl bg-[var(--secondary)] text-white px-2 py-3 shadow-lg active:opacity-90"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={DOWNLOAD_ICON_PATH} />
        </svg>
        <span className="text-[10px] font-bold leading-[1.15] text-center">
          Download<br />Brochure
        </span>
      </button>

      <BrochureModal courseTitle={courseTitle} modal={modal} />
    </>
  );
}
