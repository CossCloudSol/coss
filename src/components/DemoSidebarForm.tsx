'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitLead, type Branch } from '@/lib/submitLead';
import { COURSES } from '@/data/courses-data';

/* -------------------------------------------------------------------------- */
/*  Course options — grouped by category, both sorted alphabetically          */
/* -------------------------------------------------------------------------- */

const COURSES_BY_CATEGORY: Array<{ category: string; courses: Array<{ shortTitle: string; slug: string }> }> = (() => {
  const map = new Map<string, Array<{ shortTitle: string; slug: string }>>();
  for (const c of COURSES) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push({ shortTitle: c.shortTitle, slug: c.slug });
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, courses]) => ({
      category,
      courses: [...courses].sort((a, b) => a.shortTitle.localeCompare(b.shortTitle)),
    }));
})();

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

const demoFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
  course: z.string().optional(),
  branch: z.enum(['dilsukhnagar', 'ameerpet', 'online'] as const, 'Please select a branch'),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

const BRANCH_API_VALUE: Record<DemoFormValues['branch'], Branch> = {
  dilsukhnagar: 'Dilsukhnagar',
  ameerpet: 'Ameerpet',
  online: 'Online',
};

/* -------------------------------------------------------------------------- */
/*  Inline styles                                                              */
/* -------------------------------------------------------------------------- */

const sidebarInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: '13px',
  marginBottom: '10px',
  outline: 'none',
  fontFamily: 'Open Sans, sans-serif',
};

const enrollBtn: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  background: 'var(--primary)',
  color: '#fff',
  padding: '12px',
  borderRadius: '6px',
  fontFamily: 'Poppins, sans-serif',
  fontWeight: 700,
  fontSize: '14px',
  width: '100%',
  border: 'none',
  cursor: 'pointer',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--secondary)',
  borderRadius: '12px',
  padding: '24px',
  color: '#fff',
  marginBottom: '20px',
};

const fieldErrorStyle: React.CSSProperties = {
  color: '#fecaca',
  fontSize: 11,
  margin: '-6px 0 8px',
  lineHeight: 1.3,
};

/* Inline styles for the course select.
   Tailwind [&>option] variants are not reliably compiled and browsers
   (especially Chrome/Edge on Windows) ignore CSS on <option> elements
   when the native dropdown is open.  Inline styles are the only
   cross-browser-safe solution for a dark-card select. */
const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#ffffff',
  backgroundColor: '#0a5260',
  fontSize: '13px',
  marginBottom: '10px',
  outline: 'none',
  fontFamily: 'Open Sans, sans-serif',
};

const optionStyle: React.CSSProperties = {
  color: 'var(--text)',
  backgroundColor: '#ffffff',
};

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface DemoSidebarFormProps {
  /** Prefills the course field and hides the course select entirely. */
  course?: string;
  /** Overrides the subtitle under the "Book a free demo class" heading. */
  subtitle?: string;
}

export default function DemoSidebarForm({ course, subtitle }: DemoSidebarFormProps = {}): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    mode: 'onSubmit',
  });

  const [state, setState] = useState<SubmitState>({ kind: 'idle' });
  const selectedBranch = watch('branch');

  async function onSubmit(values: DemoFormValues): Promise<void> {
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name: values.name,
      phone: values.phone,
      course: course ?? values.course,
      branch: BRANCH_API_VALUE[values.branch],
      formType: 'demo',
    });
    if (result.ok) {
      setState({ kind: 'success' });
      reset();
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  if (state.kind === 'success') {
    return (
      <div style={cardStyle}>
        <h3
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: '17px',
            marginBottom: '4px',
            color: '#fff',
          }}
        >
          Thank you!
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '12px',
            marginBottom: '14px',
            lineHeight: 1.6,
          }}
        >
          We&apos;ll contact you on WhatsApp shortly.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          style={enrollBtn}
        >
          Send Another Enquiry
        </button>
      </div>
    );
  }

  const isSubmitting = state.kind === 'submitting';

  return (
    <form style={cardStyle} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: '17px',
          marginBottom: '4px',
          color: '#fff',
        }}
      >
        Book a free demo class
      </h3>
      <p
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px',
          marginBottom: '16px',
        }}
      >
        {subtitle ?? 'Start your IT career with Coss Cloud Solutions'}
      </p>

      <input
        type="text"
        placeholder="Full Name"
        style={sidebarInput}
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
        style={sidebarInput}
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

      {!course && (
        <select
          style={selectStyle}
          aria-label="Select a course"
          defaultValue=""
          disabled={isSubmitting}
          {...register('course')}
        >
          <option value="" style={optionStyle}>— Select a Course —</option>
          {COURSES_BY_CATEGORY.map(({ category, courses }) => (
            <optgroup key={category} label={category}>
              {courses.map(({ shortTitle, slug }) => (
                <option key={slug} value={shortTitle} style={optionStyle}>
                  {shortTitle}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}

      <label
        id="demo-branch-label"
        style={{
          display: 'block',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '8px',
        }}
      >
        Which centre suits you?
      </label>
      <div
        role="radiogroup"
        aria-labelledby="demo-branch-label"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        {(
          [
            { value: 'dilsukhnagar', label: 'Dilsukhnagar' },
            { value: 'ameerpet', label: 'Ameerpet' },
            { value: 'online', label: 'Online' },
          ] as const
        ).map(({ value, label }) => {
          const isSelected = selectedBranch === value;
          return (
            <label
              key={value}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: '6px',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                background: isSelected ? 'rgba(228,117,56,0.18)' : 'rgba(255,255,255,0.06)',
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 400,
                transition: 'border-color 0.15s, background 0.15s, color 0.15s',
              }}
            >
              <input
                type="radio"
                value={value}
                style={{ accentColor: 'var(--primary)' }}
                disabled={isSubmitting}
                {...register('branch')}
              />
              {label}
            </label>
          );
        })}
      </div>
      {errors.branch ? (
        <p style={{ ...fieldErrorStyle, margin: '-6px 0 10px' }} role="alert">
          {errors.branch.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          ...enrollBtn,
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
                width: 12,
                height: 12,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                marginRight: 6,
                verticalAlign: '-2px',
              }}
            />
            Submitting...
          </>
        ) : (
          <>Book my free demo</>
        )}
      </button>

      {state.kind === 'error' ? (
        <p
          role="alert"
          style={{
            color: '#fecaca',
            fontSize: 12,
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
