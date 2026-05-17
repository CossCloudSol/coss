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
      <h3>Enroll Now with COSS</h3>
      <p>Start your IT career journey today</p>

      <input
        type="text"
        placeholder="Full Name"
        className="form-input"
        autoComplete="name"
        disabled={isSubmitting}
        {...register('name')}
      />
      {errors.name ? (
        <p style={fieldErrorStyle} role="alert">
          {errors.name.message}
        </p>
      ) : null}

      <input
        type="tel"
        placeholder="Mobile Number"
        className="form-input"
        autoComplete="tel"
        inputMode="tel"
        maxLength={10}
        disabled={isSubmitting}
        {...register('phone')}
      />
      {errors.phone ? (
        <p style={fieldErrorStyle} role="alert">
          {errors.phone.message}
        </p>
      ) : null}

      <select
        className="form-input"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        defaultValue=""
        disabled={isSubmitting}
        {...register('inquiryType')}
      >
        <option value="">Inquiry Type</option>
        <option>Course Enquiry</option>
        <option>Demo Class</option>
        <option>Corporate Training</option>
        <option>Placement Assistance</option>
      </select>

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
