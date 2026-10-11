'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, MessageCircle, X } from 'lucide-react';
import { submitLead, type Branch } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import WhatsAppLink from '@/components/WhatsAppLink';
import { PREFILL_COURSE_EVENT } from '@/components/home/TrackedCta';
import FormPrivacyNote from '@/components/FormPrivacyNote';
import WhatsAppOptIn, { optInFromForm } from '@/components/WhatsAppOptIn';
import { goToThankYou } from '@/lib/lead-thank-you';

const FORM_ID = 'home_hero';

// The card stays white in dark mode, so its muted text uses #5e6f74 (5.0:1 on
// white), not #5f7075, which globals.css lightens for dark surfaces.

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

const BRANCHES: Array<{ value: Branch; label: string }> = [
  { value: 'Dilsukhnagar', label: 'Dilsukhnagar' },
  { value: 'Ameerpet', label: 'Ameerpet' },
  { value: 'Online', label: 'Online' },
];

// Design v4 (Main.dc.html .field): 48px, 1.5px #cfdadd border, 10px radius, 16px text.
const field =
  'flex min-h-12 items-center rounded-[10px] border-[1.5px] border-[#cfdadd] bg-white px-3.5 text-[#17262a] focus-within:border-[#005663] focus-within:ring-2 focus-within:ring-[#005663]/20';
const input = 'field-bare min-w-0 flex-1 border-0 bg-transparent text-base text-[#17262a] outline-none placeholder:text-[#5e6f74]';

export interface NextBatchStrip {
  course: string;
  when: string;
  where: string;
}

/**
 * Homepage hero lead form: name, phone and an optional branch. With no branch
 * picked the lead is saved as "undecided" and the counsellor confirms it on
 * the call. A "Book demo" click elsewhere on the page attaches its course.
 * Fires GA4 form_start on first interaction and form_submit on success;
 * submitLead also fires generate_lead as every lead form does.
 *
 * Design v4 changed the UI only: the submit, consent, WhatsApp opt-in and
 * attribution paths are the same as before.
 */
export default function HomeHeroForm({ nextBatch = null }: { nextBatch?: NextBatchStrip | null }): JSX.Element {
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
      whatsappOptIn: optInFromForm(e.currentTarget),
    });
    if (result.ok) {
      trackFormSubmit(FORM_ID, course || undefined);
      setState({ kind: 'success' });
      goToThankYou('hero');
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  // light-surface: a white card stays light in dark mode, with its own text colours.
  const card =
    'light-surface overflow-hidden rounded-[22px] bg-white shadow-[0_26px_50px_-24px_rgba(5,30,36,0.7)] lg:rounded-[24px] lg:shadow-[0_30px_60px_-24px_rgba(5,30,36,0.6)]';

  const batchStrip = nextBatch && (
    <div className="flex items-center gap-3 border-b border-[#f6d9c6] bg-[#fdf0e8] px-4 py-3 text-[13.5px] leading-[1.35] text-[#26383d] lg:px-[22px] lg:py-3.5 lg:text-sm">
      <span aria-hidden="true" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#b8531c] text-white lg:flex">
        <Calendar className="h-[18px] w-[18px]" />
      </span>
      <p>
        <strong className="font-bold text-[#8f3f14]">Next batch</strong>
        <span className="lg:hidden">: </span>
        <br className="hidden lg:block" />
        {nextBatch.course} · {nextBatch.when} · {nextBatch.where}
      </p>
    </div>
  );

  if (state.kind === 'success') {
    return (
      <div className={card} role="status">
        {batchStrip}
        <div className="p-6 text-center">
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
      </div>
    );
  }

  const busy = state.kind === 'submitting';
  return (
    <div className={card}>
      {batchStrip}
      <form onSubmit={onSubmit} onFocus={markStarted} noValidate className="flex flex-col gap-3 p-4 lg:gap-3.5 lg:p-[22px]" aria-labelledby="hero-form-title">
        <HoneypotField inputRef={honeypotRef} />
        <h2 id="hero-form-title" className="font-heading text-[22px] font-extrabold text-[#0a3d4a] lg:text-2xl">
          Book a free demo class
        </h2>

        {course && (
          <p className="flex items-center justify-between gap-2 rounded-[10px] bg-[#eaf4f5] px-3.5 py-2 text-sm text-[#005663]">
            <span>
              Course: <strong>{course}</strong>
            </span>
            <button type="button" onClick={() => setCourse('')} aria-label="Remove course" className="rounded p-1 hover:bg-white/60">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </p>
        )}

        <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-[#26383d]">
          Your name
          <span className={field}>
            <input
              ref={nameRef}
              className={input}
              placeholder="e.g. Ravi Kumar"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-[#26383d]">
          Mobile number
          <span className="flex gap-2">
            <span aria-hidden="true" className={`${field} w-[62px] shrink-0 justify-center bg-[#f6f9fa] px-0 font-sans text-base lg:w-[66px]`}>
              +91
            </span>
            <span className={`${field} flex-1`}>
              <input
                className={input}
                type="tel"
                inputMode="tel"
                placeholder="10-digit mobile"
                autoComplete="tel-national"
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </span>
          </span>
        </label>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 font-sans text-sm font-medium text-[#26383d]">Learn at</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {BRANCHES.map((b) => {
              const selected = branch === b.value;
              return (
                <button
                  key={b.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setBranch(selected ? null : b.value)}
                  disabled={busy}
                  className={`min-h-11 whitespace-nowrap rounded-full border px-1 font-sans text-[13px] lg:px-1.5 lg:text-sm ${
                    selected
                      ? 'border-[#005663] bg-[#005663] font-bold text-white'
                      : 'border-[#cfdadd] bg-white font-medium text-[#26383d] hover:border-[#005663]'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {state.kind === 'error' && (
          <p className="text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )}

        <WhatsAppOptIn />

        <button
          type="submit"
          disabled={busy}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#b8531c] font-sans text-base font-bold text-white shadow-[0_8px_20px_-10px_rgba(184,83,28,0.8)] transition hover:bg-[#8f3f14] disabled:opacity-60"
        >
          {busy ? 'Booking…' : 'Book my free demo'}
        </button>
        <FormPrivacyNote />

        {/* font-sans on the small flowing lines: no shift when the web font swaps in. */}
        <div className="flex items-center justify-between gap-3 font-sans text-[13px] text-[#4a5c61]">
          <span>No payment needed</span>
          <WhatsAppLink
            ctaType="hero"
            pageType="static"
            message="Hi, I'd like to book a free demo class at Coss Cloud Solutions."
            className="inline-flex min-h-10 items-center gap-1.5 font-bold text-[#005663]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp us
          </WhatsAppLink>
        </div>
      </form>
    </div>
  );
}
