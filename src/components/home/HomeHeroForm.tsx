'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarCheck, Check, Lock, MapPin, MessageCircle, Monitor, Phone, Star, User, X } from 'lucide-react';
import { submitLead, type Branch } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import CallLink from '@/components/CallLink';
import WhatsAppLink from '@/components/WhatsAppLink';
import { PREFILL_COURSE_EVENT } from '@/components/home/TrackedCta';
import FormPrivacyNote from '@/components/FormPrivacyNote';
import { goToThankYou } from '@/lib/lead-thank-you';
import { PRIMARY_PHONE } from '@/lib/nap';

const FORM_ID = 'home_hero';

// The card stays white in dark mode, so its muted text uses #5e6f74 (5.0:1 on
// white), not #5f7075, which globals.css lightens for dark surfaces.

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

const BRANCHES: Array<{ value: Branch; label: string; sub: string; online: boolean }> = [
  { value: 'Dilsukhnagar', label: 'Dilsukhnagar', sub: 'Classroom', online: false },
  { value: 'Ameerpet', label: 'Ameerpet', sub: 'Classroom', online: false },
  { value: 'Online', label: 'Online', sub: 'Live classes', online: true },
];

const field =
  'flex h-[50px] items-center gap-2.5 rounded-[10px] border border-[#cfdadd] bg-[#f8fafb] px-3.5 text-[#5e6f74] focus-within:border-[#005663] focus-within:ring-2 focus-within:ring-[#005663]/20';
const input = 'field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none placeholder:text-[#5e6f74]';

/**
 * Homepage hero lead form: name, phone and an optional branch. With no branch
 * picked the lead is saved as "undecided" and the counsellor confirms it on
 * the call. A "Book demo" click elsewhere on the page attaches its course.
 * Fires GA4 form_start on first interaction and form_submit on success;
 * submitLead also fires generate_lead as every lead form does.
 */
export default function HomeHeroForm(): JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState<Branch | null>(null);
  const [course, setCourse] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const started = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const { honeypotRef, botFields } = useBotGuard();

  // "Book demo" / "Reserve a seat" buttons elsewhere on the page attach their course here.
  useEffect(() => {
    function onPrefill(e: Event) {
      const c = (e as CustomEvent<{ course?: string }>).detail?.course;
      if (c) setCourse(c);
      setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 400);
    }
    window.addEventListener(PREFILL_COURSE_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_COURSE_EVENT, onPrefill);
  }, []);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackFormStart(FORM_ID);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    markStarted();
    if (!isValidName(name)) return setState({ kind: 'error', message: NAME_ERROR });
    if (normalizeIndianMobile(phone) === null) return setState({ kind: 'error', message: PHONE_ERROR });
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      course: course || undefined,
      branch: branch ?? undefined,
      formType: 'hero',
      bot: botFields(),
    });
    if (result.ok) {
      trackFormSubmit(FORM_ID, course || undefined);
      setState({ kind: 'success' });
      goToThankYou('hero');
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  const card = 'rounded-[20px] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-7';

  if (state.kind === 'success') {
    return (
      <div className={`${card} text-center`} role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f0f1] text-[#005663]">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-3 text-xl font-extrabold text-[#0a3d4a]">Your free demo request is in</p>
        <p className="mt-2 text-sm text-[#4a5c61]">A counsellor will call or WhatsApp you shortly to fix a slot.</p>
        <button
          type="button"
          onClick={() => {
            setName('');
            setPhone('');
            setBranch(null);
            setCourse('');
            setState({ kind: 'idle' });
          }}
          className="mt-4 text-sm font-bold text-[#b8531c] underline"
        >
          Book for someone else
        </button>
      </div>
    );
  }

  const busy = state.kind === 'submitting';
  return (
    <form onSubmit={onSubmit} onFocus={markStarted} noValidate className={`${card} flex flex-col gap-4`} aria-labelledby="hero-form-title">
      <HoneypotField inputRef={honeypotRef} />
      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#fdf0e8] px-3 py-1 text-xs font-bold tracking-[0.6px] text-[#8f3f14]">
          <Star className="h-3.5 w-3.5" aria-hidden="true" />
          FREE DEMO CLASS
        </span>
        <h2 id="hero-form-title" className="font-heading text-[22px] font-extrabold text-[#0a3d4a] sm:text-[26px]">
          Book your free demo class
        </h2>
      </div>

      {course && (
        <p className="flex items-center justify-between gap-2 rounded-[10px] bg-[#e6f0f1] px-3.5 py-2 text-sm text-[#005663]">
          <span>
            Course: <strong>{course}</strong>
          </span>
          <button type="button" onClick={() => setCourse('')} aria-label="Remove course" className="rounded p-1 hover:bg-white/60">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </p>
      )}

      <label className={field}>
        <User className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="sr-only">Your name</span>
        <input
          ref={nameRef}
          className={input}
          placeholder="Your name, e.g. Ravi Kumar"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </label>

      <label className={field}>
        <Phone className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="border-r border-[#cfdadd] pr-2.5 text-[15px] font-medium text-[#26383d]" aria-hidden="true">+91</span>
        <span className="sr-only">Mobile number</span>
        <input
          className={input}
          type="tel"
          inputMode="tel"
          placeholder="10-digit mobile number"
          autoComplete="tel-national"
          maxLength={15}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={busy}
        />
      </label>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 font-sans text-[13px] font-bold text-[#26383d]">
          How would you like to learn? <span className="font-normal text-[#5e6f74]">(optional)</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {BRANCHES.map((b) => {
            const selected = branch === b.value;
            const Icon = b.online ? Monitor : MapPin;
            return (
              <button
                key={b.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setBranch(selected ? null : b.value)}
                disabled={busy}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center sm:min-h-[64px] ${
                  selected
                    ? 'border-2 border-[#b8531c] bg-[#fdf0e8] text-[#8f3f14]'
                    : 'border border-[#cfdadd] bg-white text-[#26383d] hover:border-[#005663]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-bold sm:text-[13px]">{b.label}</span>
                <span className="hidden text-[11px] text-[#5e6f74] sm:block">{b.sub}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {state.kind === 'error' && (
        <p className="text-sm text-red-700" role="alert">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex h-14 items-center justify-center gap-2.5 rounded-xl bg-[#b8531c] font-heading text-[17px] font-extrabold text-white shadow-[0_8px_20px_rgba(184,83,28,0.35)] transition hover:bg-[#8f3f14] disabled:opacity-60 sm:text-lg"
      >
        <CalendarCheck className="h-5 w-5" aria-hidden="true" />
        {busy ? 'Booking…' : 'Book My Free Demo'}
        {!busy && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
      </button>
      <FormPrivacyNote />

      {/* font-sans on the small flowing lines: no shift when the web font swaps in. */}
      <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-sans text-[13px] text-[#4a5c61]">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-[15px] w-[15px] text-[#005663]" aria-hidden="true" />
          No payment to book
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-[15px] w-[15px] text-[#005663]" aria-hidden="true" />
          Your number stays private
        </span>
      </p>

      <div className="flex items-center gap-3 text-xs text-[#5e6f74]">
        <span className="h-px flex-1 bg-[#e3eaec]" />
        or talk to us now
        <span className="h-px flex-1 bg-[#e3eaec]" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <WhatsAppLink
          ctaType="hero"
          pageType="static"
          message="Hi, I'd like to book a free demo class at Coss Cloud Solutions."
          className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] bg-[#e7f6ec] text-sm font-bold text-[#0f5a2c] hover:bg-[#d6efdf]"
        >
          <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
          WhatsApp us
        </WhatsAppLink>
        <CallLink
          number={PRIMARY_PHONE}
          pageType="static"
          className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] border border-[#cfdadd] text-sm font-bold text-[#005663] hover:border-[#005663]"
        >
          <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
          Call a counsellor
        </CallLink>
      </div>
    </form>
  );
}
