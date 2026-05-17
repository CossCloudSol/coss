'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const corporateFormSchema = z.object({
  companyName:   z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  phone: z.string().refine(v => /^[6-9]\d{9}$/.test(v.replace(/\D/g,'')), { message: 'Enter a valid 10-digit mobile number' }),
  email:       z.string().email('Enter a valid email address'),
  trainingTopic: z.string().min(2, 'Please mention the training topic'),
  teamSize:    z.string().min(1, 'Team size is required'),
  message:     z.string().optional(),
});

type CorporateFormValues = z.infer<typeof corporateFormSchema>;

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
  borderRadius: '16px',
  padding: '32px',
  color: '#fff',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.07)',
  color: '#fff',
  fontSize: '13px',
  marginBottom: '10px',
  outline: 'none',
  fontFamily: 'Open Sans, sans-serif',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  color: '#aaa',
};

const fieldErrorStyle: React.CSSProperties = {
  color: '#fecaca',
  fontSize: 11,
  margin: '-6px 0 8px',
};

export default function CorporateForm(): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorporateFormValues>({
    resolver: zodResolver(corporateFormSchema),
    mode: 'onSubmit',
  });

  const [state, setState] = useState<FormState>({ kind: 'idle' });

  async function onSubmit(values: CorporateFormValues): Promise<void> {
    setState({ kind: 'submitting' });
    let res: Response | undefined;
    try {
      res = await fetch('/api/corporate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName:   values.companyName,
          contactPerson: values.contactPerson,
          phone:         values.phone.replace(/\D/g, ''),
          email:         values.email,
          trainingTopic: values.trainingTopic,
          teamSize:      values.teamSize,
          message:       values.message ?? '',
        }),
      });
    } catch (err) {
      console.error('[CorporateForm] POST /api/corporate-leads failed:', err);
      setState({ kind: 'error', message: 'Network error. Please try again.' });
      return;
    }
    if (!res.ok) {
      console.error('[CorporateForm] /api/corporate-leads non-OK response:', res.status, res.statusText);
      setState({ kind: 'error', message: 'Something went wrong. Please try again.' });
      return;
    }
    setState({ kind: 'success' });
    reset();
  }

  if (state.kind === 'success') {
    return (
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '6px', color: '#fff' }}>
          Proposal request received
        </h3>
        <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '22px' }}>
          Our team will contact you within 24 hours with a customised training proposal.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          style={{ background: '#e8401c', color: '#fff', padding: '11px 24px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  const isSubmitting = state.kind === 'submitting';

  return (
    <form style={cardStyle} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '6px', color: '#fff' }}>
        Corporate Training Enquiry
      </h3>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '22px' }}>
        Get a customized training proposal
      </p>

      <input type="text" placeholder="Company Name" style={inputStyle} autoComplete="organization" disabled={isSubmitting} {...register('companyName')} />
      {errors.companyName ? <p style={fieldErrorStyle} role="alert">{errors.companyName.message}</p> : null}

      <input type="text" placeholder="Contact Person" style={inputStyle} autoComplete="name" disabled={isSubmitting} {...register('contactPerson')} />
      {errors.contactPerson ? <p style={fieldErrorStyle} role="alert">{errors.contactPerson.message}</p> : null}

      <input type="tel" placeholder="Mobile Number" style={inputStyle} autoComplete="tel" disabled={isSubmitting} {...register('phone')} />
      {errors.phone ? <p style={fieldErrorStyle} role="alert">{errors.phone.message}</p> : null}

      <input type="email" placeholder="Email Address" style={inputStyle} autoComplete="email" disabled={isSubmitting} {...register('email')} />
      {errors.email ? <p style={fieldErrorStyle} role="alert">{errors.email.message}</p> : null}

      <input type="text" placeholder="Training Topic (e.g. AWS, DevOps, Python)" style={inputStyle} disabled={isSubmitting} {...register('trainingTopic')} />
      {errors.trainingTopic ? <p style={fieldErrorStyle} role="alert">{errors.trainingTopic.message}</p> : null}

      <select style={selectStyle} disabled={isSubmitting} {...register('teamSize')}>
        <option value="">Team Size</option>
        <option value="1-5">1–5 employees</option>
        <option value="6-15">6–15 employees</option>
        <option value="16-30">16–30 employees</option>
        <option value="31-50">31–50 employees</option>
        <option value="50+">50+ employees</option>
      </select>
      {errors.teamSize ? <p style={fieldErrorStyle} role="alert">{errors.teamSize.message}</p> : null}

      <textarea placeholder="Additional requirements (optional)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} disabled={isSubmitting} {...register('message')} />

      {state.kind === 'error' && (
        <p style={{ color: '#fecaca', fontSize: 13, margin: '12px 0 0' }} role="alert">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ width: '100%', background: '#e8401c', color: '#fff', padding: '13px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSubmitting ? 0.8 : 1 }}
      >
        {isSubmitting && (
          <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} aria-hidden="true" />
        )}
        {isSubmitting ? 'Sending…' : 'Request Training Proposal'}
      </button>
    </form>
  );
}