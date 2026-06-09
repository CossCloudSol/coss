'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitLead, type Branch } from '@/lib/submitLead';

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

// Schema mirrors the unified spec — strict 10-digit phone (we strip & prefix
// `+91` at submit time inside submitLead). The radios on this card only
// surface two branches; we map their lower-case values to the API's enum.
const heroFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
  inquiryType: z.string().optional(),
  branch: z.enum(['dilsukhnagar', 'ameerpet'] as const, { error: 'Please select a branch' }),
});

type HeroFormValues = z.infer<typeof heroFormSchema>;

const BRANCH_API_VALUE: Record<HeroFormValues['branch'], Branch> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
};

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const fieldErrorStyle: React.CSSProperties = {
  color: '#fecaca',
  fontSize: 12,
  margin: '-6px 0 8px',
  lineHeight: 1.3,
};

const branchErrorStyle: React.CSSProperties = {
  color: '#fecaca',
  fontSize: 12,
  margin: '0 0 8px',
  lineHeight: 1.3,
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function HeroEnrollForm(): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    mode: 'onSubmit',
  });

  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  async function onSubmit(values: HeroFormValues): Promise<void> {
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name: values.name,
      phone: values.phone,
      inquiryType: values.inquiryType,
      branch: BRANCH_API_VALUE[values.branch],
      formType: 'hero',
    });
    if (result.ok) {
      setState({ kind: 'success' });
      reset();
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  // Success state — same `enroll-card` container so the page layout doesn't
  // shift when the form is replaced.
  if (state.kind === 'success') {
    return (
      <div className="enroll-card">
        <h3>Thank you!</h3>
        <p style={{ color: '#86efac' }}>
          We&apos;ll contact you on WhatsApp shortly.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '15px',
            marginTop: '12px',
          }}
        >
          SEND ANOTHER ENQUIRY
        </button>
      </div>
    );
  }

  const isSubmitting = state.kind === 'submitting';

  return (
    <form
      className="enroll-card"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={isSubmitting}
    >
      <h3>Enroll Now with Coss Cloud Solutions</h3>
      <p>Start your IT career journey today</p>

      <div className="flex items-stretch gap-0" style={{ marginBottom: 11 }}>
        <div className="flex items-center justify-center w-12 bg-orange-500 rounded-l-lg flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Full Name"
          aria-label="Full Name"
          className="form-input flex-1"
          autoComplete="name"
          disabled={isSubmitting}
          style={{ marginBottom: 0, borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
          {...register('name')}
        />
      </div>
      {errors.name ? (
        <p style={fieldErrorStyle} role="alert">
          {errors.name.message}
        </p>
      ) : null}

      <div className="flex items-stretch gap-0" style={{ marginBottom: 11 }}>
        <div className="flex items-center justify-center w-12 bg-orange-500 rounded-l-lg flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>
        </div>
        <input
          type="tel"
          placeholder="Mobile Number"
          aria-label="Mobile Number"
          className="form-input flex-1"
          autoComplete="tel"
          inputMode="tel"
          maxLength={10}
          disabled={isSubmitting}
          style={{ marginBottom: 0, borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
          {...register('phone')}
        />
      </div>
      {errors.phone ? (
        <p style={fieldErrorStyle} role="alert">
          {errors.phone.message}
        </p>
      ) : null}

      <div className="flex items-stretch gap-0" style={{ marginBottom: 11 }}>
        <div className="flex items-center justify-center w-12 bg-orange-500 rounded-l-lg flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
        </div>
        <select
          className="form-input flex-1"
          aria-label="Inquiry type"
          style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 0, borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
          defaultValue=""
          disabled={isSubmitting}
          {...register('inquiryType')}
        >
          <option value="">Inquiry Type</option>
          <option>Course Enquiry</option>
          <option>Demo Class</option>
          <option>Corporate Training</option>
          <option>Placement Assistance</option>
          <option>IT Certification</option>
          <option>Internship</option>
        </select>
      </div>

      <div className="form-radio-row">
        <label className="form-radio-label">
          <input
            type="radio"
            value="dilsukhnagar"
            style={{ accentColor: '#e8401c' }}
            disabled={isSubmitting}
            {...register('branch')}
          />{' '}
          Dilsukhnagar
        </label>
        <label className="form-radio-label">
          <input
            type="radio"
            value="ameerpet"
            style={{ accentColor: '#e8401c' }}
            disabled={isSubmitting}
            {...register('branch')}
          />{' '}
          Ameerpet
        </label>
      </div>
      {errors.branch ? (
        <p style={branchErrorStyle} role="alert">
          {errors.branch.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          fontSize: '15px',
          opacity: isSubmitting ? 0.85 : 1,
          cursor: isSubmitting ? 'wait' : 'pointer',
        }}
      >
        {isSubmitting ? (
          <>
            <span
              aria-hidden="true"
              className="animate-spin"
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                marginRight: 8,
                verticalAlign: '-2px',
              }}
            />
            Submitting…
          </>
        ) : (
          <>ENROLL NOW →</>
        )}
      </button>

      {state.kind === 'error' ? (
        <p
          role="alert"
          style={{
            color: '#fecaca',
            fontSize: 13,
            margin: '10px 0 0',
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
