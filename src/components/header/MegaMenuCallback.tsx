'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { submitLead } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import { goToThankYou } from '@/lib/lead-thank-you';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import FormPrivacyNote from '@/components/FormPrivacyNote';
import WhatsAppOptIn, { optInFromForm } from '@/components/WhatsAppOptIn';
import WhatsAppLink from '@/components/WhatsAppLink';

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

const FORM_ID = 'mega_menu_callback';

/**
 * "Not sure which course fits you?" callback form in the Explore Courses
 * panel. Same lead flow as every other form (validation, bot guard,
 * attribution, WhatsApp opt-in, /thank-you); saved as formType "contact"
 * with a message that says where it came from.
 */
export default function MegaMenuCallback(): JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
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
    if (!isValidName(name)) return setState({ kind: 'error', message: NAME_ERROR });
    if (normalizeIndianMobile(phone) === null) return setState({ kind: 'error', message: PHONE_ERROR });
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      // The lead record has no source field; the message tells admin where it came from.
      message: '[mega-menu-callback] Callback requested from the Explore Courses menu',
      formType: 'contact',
      bot: botFields(),
      whatsappOptIn: optInFromForm(e.currentTarget),
    });
    if (result.ok) {
      trackFormSubmit(FORM_ID);
      setState({ kind: 'success' });
      goToThankYou('contact');
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  const busy = state.kind === 'submitting';
  const label = 'flex flex-col gap-[5px] text-xs font-semibold text-[#d6e8eb]';

  return (
    <form
      aria-label="Request a call back"
      onSubmit={onSubmit}
      onFocus={markStarted}
      noValidate
      className="relative flex flex-col gap-[11px] overflow-hidden bg-[linear-gradient(160deg,#00707f,#0a3d4a)] p-[22px] text-white"
    >
      <span aria-hidden="true" className="absolute -right-[60px] -top-[60px] h-[180px] w-[180px] rounded-full border-[30px] border-white/[0.06]" />
      <HoneypotField inputRef={honeypotRef} />
      <span className="relative text-[11px] font-bold tracking-[0.1em] text-[#f3a57a]">FREE CAREER COUNSELLING</span>
      <p className="relative font-heading text-xl font-extrabold leading-tight">Not sure which course fits you?</p>
      <p className="relative text-sm leading-normal text-[#d6e8eb]">Leave your number. A counsellor calls back and matches a course to your background.</p>
      {state.kind === 'success' ? (
        <p role="status" className="relative flex items-center gap-2 rounded-[10px] bg-white/15 px-3.5 py-3 text-sm font-bold">
          <Check className="h-4 w-4" aria-hidden="true" />
          Thanks, a counsellor will call you shortly.
        </p>
      ) : (
        <>
          <label className={`relative ${label}`}>
            Your name
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="e.g. Ravi Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="h-11 rounded-[10px] border-0 bg-white px-3 text-[15px] font-normal text-[#17262a] outline-none placeholder:text-[#5f7075] focus:ring-2 focus:ring-[#f3a57a]"
            />
          </label>
          <label className={`relative ${label}`}>
            Mobile number
            <span className="flex h-11 items-center gap-2 rounded-[10px] bg-white px-3 text-[15px] font-medium text-[#26383d] focus-within:ring-2 focus-within:ring-[#f3a57a]">
              <span aria-hidden="true" className="border-r border-[#cfdadd] pr-2">+91</span>
              <input
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="10-digit mobile"
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
                className="field-bare min-w-0 flex-1 border-0 bg-transparent font-normal text-[#17262a] outline-none placeholder:text-[#5f7075]"
              />
            </span>
          </label>
          {state.kind === 'error' && (
            <p role="alert" className="relative rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-red-700">
              {state.message}
            </p>
          )}
          <div className="relative text-[#d6e8eb]">
            <WhatsAppOptIn />
          </div>
          <button type="submit" disabled={busy} className="relative h-12 rounded-[10px] bg-[#b8531c] text-base font-bold text-white hover:bg-[#8f3f14] disabled:opacity-60">
            {busy ? 'Sending…' : 'Call me back'}
          </button>
        </>
      )}
      <WhatsAppLink
        ctaType="widget"
        message="Hi, I would like help choosing a course."
        className="relative flex min-h-[44px] items-center justify-center gap-2 text-sm font-bold text-white"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5Z" />
        </svg>
        or chat on WhatsApp
      </WhatsAppLink>
      <div className="relative">
        <FormPrivacyNote />
      </div>
    </form>
  );
}
