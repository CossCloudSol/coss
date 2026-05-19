'use client';

import { useState } from 'react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontFamily: 'Poppins, sans-serif',
  fontWeight: 600, color: 'var(--text)', marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: '8px',
  border: '1.5px solid var(--border)', background: 'var(--bg-alt)',
  color: 'var(--text)', fontSize: '14px', outline: 'none',
  fontFamily: 'Open Sans, sans-serif',
};

export default function ContactForm() {
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch]   = useState('Dilsukhnagar');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, subject, branch, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        const errs = data.errors
          ? (Object.values(data.errors) as string[][]).flat().join(', ')
          : (data.error ?? 'Something went wrong');
        setErrorMsg(errs);
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '48px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>Message Sent!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Our team will get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Mobile Number *</label>
          <input type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Email Address</label>
        <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Subject</label>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
          <option value="">Select Subject</option>
          <option>Course Enquiry</option>
          <option>Demo Class Request</option>
          <option>Corporate Training</option>
          <option>Placement Query</option>
          <option>Fee &amp; Schedule</option>
          <option>Other</option>
        </select>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Preferred Branch</label>
        <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
          {(['Dilsukhnagar', 'Ameerpet', 'Online'] as const).map(b => (
            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)' }}>
              <input type="radio" name="branch" value={b} checked={branch === b} onChange={() => setBranch(b)} style={{ accentColor: '#e8401c' }} /> {b}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: status === 'error' ? '12px' : '20px' }}>
        <label style={labelStyle}>Message *</label>
        <textarea placeholder="Write your message here..." rows={4} value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      {status === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#b91c1c', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'loading'}
        style={{ display: 'block', width: '100%', textAlign: 'center', background: status === 'loading' ? '#aaa' : '#e8401c', color: '#fff', padding: '14px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
      >
        {status === 'loading' ? '⏳ Sending…' : 'Send Message →'}
      </button>
    </div>
  );
}
