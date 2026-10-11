'use client';

import { useRef, useState } from 'react';
import { submitLead } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import FormPrivacyNote from '@/components/FormPrivacyNote';
import WhatsAppOptIn, { optInFromForm } from '@/components/WhatsAppOptIn';
import { goToThankYou } from '@/lib/lead-thank-you';

const FORM_ID = 'home_final_cta';

/**
 * The inline "Your name / Mobile number / Book demo" form of the final banner (Design v4). It goes
 * through the same path as the hero form: validation, honeypot and fill-time guard, submitLead
 * (attribution + GA4 generate_lead), the optional WhatsApp opt-in and the thank-you redirect.
 */
export default function FinalCtaForm(): JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | { error: string }>('idle');
  const started = useRef(false);
  const { honeypotRef, botFields } = useBotGuard();

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackFormStart(FORM_ID);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    markStarted();
    if (!isValidName(name)) return setState({ error: NAME_ERROR });
    if (normalizeIndianMobile(phone) === null) return setState({ error: PHONE_ERROR });
    setState('busy');
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      formType: 'hero',
      bot: botFields(),
      whatsappOptIn: optInFromForm(e.currentTarget),
    });
    if (result.ok) {
      trackFormSubmit(FORM_ID, undefined);
      goToThankYou('hero');
    } else {
      setState({ error: result.message });
    }
  }

  const busy = state === 'busy';
  const field = 'min-h-12 w-full rounded-[10px] border-[1.5px] border-transparent bg-white px-3.5 font-sans text-base text-[#17262a] placeholder:text-[#5e6f74]';
  return (
    <form onSubmit={onSubmit} onFocus={markStarted} noValidate aria-label="Book a free demo class" className="relative flex min-w-0 flex-wrap gap-2.5 rounded-[18px] bg-white/[0.14] p-2.5 text-white lg:flex-[1_1_480px]">
      <HoneypotField inputRef={honeypotRef} />
      <label className="min-w-0 flex-[1_1_150px]">
        <span className="sr-only">Your name</span>
        <input className={field} type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
      </label>
      <label className="min-w-0 flex-[1_1_150px]">
        <span className="sr-only">Mobile number</span>
        <input className={field} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
      </label>
      <button type="submit" disabled={busy} className="min-h-12 flex-[1_1_130px] rounded-xl bg-[#0a3d4a] px-5 font-sans text-[15px] font-bold text-white hover:bg-[#082f39] disabled:opacity-60">
        {busy ? 'Booking…' : 'Book demo'}
      </button>
      {typeof state === 'object' && (
        <p role="alert" className="w-full rounded-lg bg-white px-3 py-2 font-sans text-sm text-red-700">
          {state.error}
        </p>
      )}
      {/* Solid #8f3f14 behind the consent lines: white on the glass over #b8531c is only ~3.9:1. */}
      <div className="w-full rounded-lg bg-[#8f3f14] px-3 py-1">
        <WhatsAppOptIn />
        <FormPrivacyNote />
      </div>
    </form>
  );
}
