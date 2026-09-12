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

const BRANCH_OPTIONS: { value: FullFormValues['branch']; name: string; sub: string; icon: JSX.Element }[] = [
  {
    value: 'dilsukhnagar',
    name: 'Dilsukhnagar',
    sub: 'Classroom',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    ),
  },
  {
    value: 'ameerpet',
    name: 'Ameerpet',
    sub: 'Classroom',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    ),
  },
  {
    value: 'online',
    name: 'Online',
    sub: 'Join anywhere',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    ),
  },
];

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

interface EnrollFullFormProps {
  /** Eyebrow pill above the heading. Pass `null` to omit it entirely. Defaults to the demo-booking copy. */
  eyebrow?: string | null;
  /** Right-aligned status pill with a green dot. Pass `null` to omit it entirely. Defaults to the demo-booking copy. */
  statusPill?: string | null;
  /** Card heading. Pass `null` to omit it entirely. Defaults to the demo-booking copy. */
  heading?: string | null;
  /** Card subtext under the heading. Pass `null` to omit it entirely. Defaults to the demo-booking copy. */
  subtext?: string | null;
  /** Submit button label. Defaults to the site-wide demo-booking copy. */
  submitLabel?: string;
  /** Footnote under the submit button. Defaults to the site-wide demo-booking copy. */
  disclaimer?: string;
}

// useSearchParams() requires a Suspense boundary around the component that
// calls it, or Next.js opts the whole page out of static rendering. This
// keeps that boundary self-contained here instead of pushing it onto every
// page that renders the form.
export default function EnrollFullForm(props: EnrollFullFormProps = {}): JSX.Element {
  return (
    <Suspense fallback={<div className="ef-card" aria-hidden="true" />}>
      <EnrollFullFormFields {...props} />
    </Suspense>
  );
}

function EnrollFullFormFields({
  eyebrow = 'FREE DEMO CLASS',
  statusPill = 'Next batches filling now',
  heading = 'Take the first step toward your IT career',
  subtext = 'Share your details and choose your learning mode. Our advisor will confirm your demo on WhatsApp.',
  submitLabel,
  disclaimer,
}: EnrollFullFormProps): JSX.Element {
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

      {(eyebrow || statusPill) && (
        <div className="ef-header-row">
          {eyebrow && <span className="ef-eyebrow">{eyebrow}</span>}
          {statusPill && (
            <span className="ef-status-pill">
              <span className="ef-status-dot" aria-hidden="true" />
              {statusPill}
            </span>
          )}
        </div>
      )}

      {heading && <h3 className="ef-heading">{heading}</h3>}
      {subtext && <p className="ef-subtext">{subtext}</p>}

      {/* Name + Phone row */}
      <div className="ef-row-2">
        <div className="ef-field">
          <label className="ef-label" htmlFor="ef-name">Full Name <span className="ef-required">*</span></label>
          <div className="ef-input-group">
            <span className="ef-input-icon ef-input-icon-name" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </span>
            <input
              id="ef-name"
              type="text"
              className={`ef-input ef-input-grouped${errors.name ? ' ef-input-error' : ''}`}
              placeholder="Your full name"
              autoComplete="name"
              disabled={isSubmitting}
              {...register('name')}
            />
          </div>
          {errors.name && <span className="ef-error" role="alert">{errors.name.message}</span>}
        </div>
        <div className="ef-field">
          <label className="ef-label" htmlFor="ef-phone">WhatsApp Number <span className="ef-required">*</span></label>
          <div className="ef-input-group">
            <span className="ef-input-icon ef-input-icon-phone" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
            </span>
            <span className="ef-phone-prefix">+91</span>
            <input
              id="ef-phone"
              type="tel"
              className={`ef-input ef-input-grouped ef-phone-input${errors.phone ? ' ef-input-error' : ''}`}
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
        <span className="ef-label" id="ef-branch-label">How would you like to learn? <span className="ef-required">*</span></span>
        <div className="ef-branch-group" role="radiogroup" aria-labelledby="ef-branch-label">
          {BRANCH_OPTIONS.map(opt => (
            <label key={opt.value} className="ef-branch-card">
              <input
                type="radio"
                value={opt.value}
                disabled={isSubmitting}
                className="ef-branch-input"
                {...register('branch')}
              />
              <span className="ef-branch-check" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span className="ef-branch-icon" aria-hidden="true">{opt.icon}</span>
              <span className="ef-branch-name">{opt.name}</span>
              <span className="ef-branch-sub">{opt.sub}</span>
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
            {submitLabel ?? 'Book My FREE Demo'}
          </>
        )}
      </button>

      {/* Error */}
      {state.kind === 'error' && (
        <p className="ef-submit-error" role="alert">{state.message}</p>
      )}

      <div className="ef-trust-strip">
        <span className="ef-trust-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Takes 30 seconds
        </span>
        <span className="ef-trust-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>
          No payment required
        </span>
        <span className="ef-trust-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          WhatsApp confirmation
        </span>
      </div>

      <p className="ef-disclaimer">
        {disclaimer ?? 'No spam. Instant confirmation via WhatsApp.'}
      </p>
    </form>
  );
}
