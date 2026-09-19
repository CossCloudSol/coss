'use client';

import { useEffect, useState } from 'react';
import { submitLead } from '@/lib/submitLead';
import { buildBrochureDelivery } from '@/lib/whatsapp';
import { attachmentUrl } from '@/lib/cloudinary';
import { trackBrochureDownload } from '@/lib/click-tracking';

/* -------------------------------------------------------------------------- */
/*  "Download Brochure" button + popup. Two paths: enter a WhatsApp number    */
/*  (primary — creates a lead, then opens a pre-filled wa.me chat so a staff  */
/*  member can reply with the actual PDF) or skip straight to a plain        */
/*  Cloudinary download (no lead, course-tagged analytics event only).       */
/* -------------------------------------------------------------------------- */

interface BrochureButtonProps {
  courseSlug: string;
  courseTitle: string;
  brochureUrl: string;
}

export default function BrochureButton({ courseSlug, courseTitle, brochureUrl }: BrochureButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);
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
    setPhone('');
    setError(null);
    setSent(false);
  }

  async function handleWhatsAppSubmit(e: React.FormEvent) {
    e.preventDefault();
    const delivery = buildBrochureDelivery(phone, courseTitle);
    if (!delivery.ok) {
      setError(delivery.error);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await submitLead({
      name: 'Brochure Request',
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-500 font-bold text-sm px-6 py-3 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download Brochure
      </button>

      {open && (
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
                  <label htmlFor="brochure-phone" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
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
                    autoFocus
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
      )}
    </>
  );
}
