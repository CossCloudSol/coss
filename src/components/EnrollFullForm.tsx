'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitLead, type Branch } from '@/lib/submitLead';

// `?course=` arrives from a URL and is written to the database as the lead's
// `course` value — it must be a slug shape only, never arbitrary user-editable
// text. Anything that doesn't match is treated as absent.
const COURSE_SLUG_PATTERN = /^[a-z0-9-]{1,100}$/;

function sanitizeCourseSlug(raw: string | null): string | undefined {
  if (!raw) return undefined;
  return COURSE_SLUG_PATTERN.test(raw) ? raw : undefined;
}

const fullFormSchema = z.object({
  name:   z.string().trim().min(2, 'Please enter your full name'),
  phone:  z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
  branch: z.enum(['dilsukhnagar', 'ameerpet', 'online'] as const, 'Please select a branch'),
});

type FullFormValues = z.infer<typeof fullFormSchema>;

const BRANCH_API_VALUE: Record<FullFormValues['branch'], Branch> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet:     'Ameerpet',
  online:       'Online',
};

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

interface EnrollFullFormProps {
  /** Submit button label. Defaults to the site-wide demo-booking copy. */
  submitLabel?: string;
  /** Footnote under the submit button. Defaults to the site-wide demo-booking copy. */
  disclaimer?: string;
}

// useSearchParams() requires a Suspense boundary around the component that
// calls it, or Next.js opts the whole page out of static rendering. This
// keeps that boundary self-contained here instead of pushing it onto every
// page that renders the form.
export default function EnrollFullForm({ submitLabel, disclaimer }: EnrollFullFormProps = {}): JSX.Element {
  return (
    <Suspense fallback={<div className="ef-card" aria-hidden="true" />}>
      <EnrollFullFormFields submitLabel={submitLabel} disclaimer={disclaimer} />
    </Suspense>
  );
}

function EnrollFullFormFields({ submitLabel, disclaimer }: EnrollFullFormProps): JSX.Element {
  const searchParams = useSearchParams();
  const course = sanitizeCourseSlug(searchParams.get('course'));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FullFormValues>({
    resolver: zodResolver(fullFormSchema),
    mode: 'onSubmit',
  });

  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  async function onSubmit(values: FullFormValues): Promise<void> {
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name:     values.name,
      phone:    values.phone,
      branch:   BRANCH_API_VALUE[values.branch],
      course,
      formType: 'full',
    });
    if (result.ok) {
      setState({ kind: 'success' });
      reset();
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  /* ── Success state ── */
  if (state.kind === 'success') {
    return (
      <div className="ef-card ef-success-card">
        <div className="ef-success-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="ef-success-title">Submission Received!</h3>
        <p className="ef-success-msg">
          Our counsellor will call you within <strong>2 hours</strong> on WhatsApp to help you pick the right course.
        </p>
        <div className="ef-success-badges">
          <span>✓ Your data is secure</span>
          <span>✓ No spam calls</span>
        </div>
        <button
          type="button"
          className="ef-another-btn"
          onClick={() => setState({ kind: 'idle' })}
        >
          Send Another Enquiry
        </button>
      </div>
    );
  }

  const isSubmitting = state.kind === 'submitting';

  return (
    <form className="ef-card" onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Name + Phone row */}
      <div className="ef-row-2">
        <div className="ef-field">
          <label className="ef-label" htmlFor="ef-name">Full Name <span className="ef-required">*</span></label>
          <input
            id="ef-name"
            type="text"
            className={`ef-input${errors.name ? ' ef-input-error' : ''}`}
            placeholder="Your full name"
            autoComplete="name"
            disabled={isSubmitting}
            {...register('name')}
          />
          {errors.name && <span className="ef-error" role="alert">{errors.name.message}</span>}
        </div>
        <div className="ef-field">
          <label className="ef-label" htmlFor="ef-phone">Mobile Number <span className="ef-required">*</span></label>
          <div className="ef-phone-wrap">
            <span className="ef-phone-prefix">+91</span>
            <input
              id="ef-phone"
              type="tel"
              className={`ef-input ef-phone-input${errors.phone ? ' ef-input-error' : ''}`}
              placeholder="10-digit number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              disabled={isSubmitting}
              {...register('phone')}
            />
          </div>
          {errors.phone && <span className="ef-error" role="alert">{errors.phone.message}</span>}
        </div>
      </div>

      {/* Branch */}
      <div className="ef-field">
        <span className="ef-label" id="ef-branch-label">Preferred Mode <span className="ef-required">*</span></span>
        <div className="ef-branch-group" role="radiogroup" aria-labelledby="ef-branch-label">
          {(['Dilsukhnagar', 'Ameerpet', 'Online'] as const).map(b => (
            <label key={b} className="ef-branch-option">
              <input
                type="radio"
                value={b.toLowerCase()}
                disabled={isSubmitting}
                {...register('branch')}
              />
              <span className="ef-branch-label-text">{b}</span>
            </label>
          ))}
        </div>
        {errors.branch && <span className="ef-error" role="alert">{errors.branch.message}</span>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="ef-submit-btn"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="ef-spinner" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.08 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            {submitLabel ?? 'Book Free Demo Class'}
          </>
        )}
      </button>

      {/* Error */}
      {state.kind === 'error' && (
        <p className="ef-submit-error" role="alert">{state.message}</p>
      )}

      <p className="ef-disclaimer">
        {disclaimer ?? 'No spam. Instant confirmation via WhatsApp.'}
      </p>
    </form>
  );
}
