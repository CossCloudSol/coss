'use client';

import { useEffect, useRef, useState } from 'react';
import { submitLead } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, nameField, normalizeIndianMobile } from '@/lib/lead-validation';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import { PREFILL_COURSE_EVENT } from '@/components/home/TrackedCta';
import type { CourseGroup } from '@/data/course-options';

const FORM_ID = 'home_hero';

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

const input =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/25';

/**
 * Homepage hero lead form: name, phone, course. Leads are saved with branch
 * "undecided" (the counsellor confirms Dilsukhnagar, Ameerpet or online on
 * the call). Fires GA4 form_start on first interaction and form_submit on
 * success; submitLead also fires generate_lead as every lead form does.
 */
export default function HomeHeroForm({ courseGroups }: { courseGroups: CourseGroup[] }): JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const started = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const { honeypotRef, botFields } = useBotGuard();

  // "Book demo" buttons elsewhere on the page preselect their course here.
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
    if (!nameField.safeParse(name).success) return setState({ kind: 'error', message: NAME_ERROR });
    if (normalizeIndianMobile(phone) === null) return setState({ kind: 'error', message: PHONE_ERROR });
    setState({ kind: 'submitting' });
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      course: course || undefined,
      formType: 'hero',
      bot: botFields(),
    });
    if (result.ok) {
      trackFormSubmit(FORM_ID, course || undefined);
      setState({ kind: 'success' });
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-xl" role="status">
        <p className="text-lg font-bold text-slate-900">Thank you! Your free demo request is in.</p>
        <p className="mt-2 text-sm text-slate-600">A counsellor will call or WhatsApp you shortly to fix a slot.</p>
        <button
          type="button"
          onClick={() => {
            setName('');
            setPhone('');
            setState({ kind: 'idle' });
          }}
          className="mt-4 text-sm font-semibold text-teal-700 underline"
        >
          Book for someone else
        </button>
      </div>
    );
  }

  const busy = state.kind === 'submitting';
  return (
    <form onSubmit={onSubmit} onFocus={markStarted} noValidate className="rounded-2xl bg-white p-5 shadow-xl sm:p-6" aria-labelledby="hero-form-title">
      <HoneypotField inputRef={honeypotRef} />
      <p id="hero-form-title" className="text-lg font-extrabold text-slate-900">Book a free demo class</p>
      <p className="mb-4 mt-1 text-sm text-slate-500">Meet the trainer, see the class, then decide.</p>
      <div className="space-y-3">
        <div>
          <label htmlFor="hero-name" className="sr-only">Full name</label>
          <input
            id="hero-name"
            ref={nameRef}
            className={input}
            placeholder="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="hero-phone" className="sr-only">Mobile number</label>
          <input
            id="hero-phone"
            className={input}
            type="tel"
            inputMode="tel"
            placeholder="Mobile number"
            autoComplete="tel"
            maxLength={15}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="hero-course" className="sr-only">Course</label>
          <select
            id="hero-course"
            className={`${input} ${course ? '' : 'text-slate-400'}`}
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            disabled={busy}
          >
            <option value="">Course you&apos;re interested in</option>
            {/* A "Book demo" click can preselect a course title that isn't in the list. */}
            {course && !courseGroups.some((g) => g.courses.some((c) => c.shortTitle === course)) && (
              <option value={course}>{course}</option>
            )}
            {courseGroups.map((g) => (
              <optgroup key={g.category} label={g.category}>
                {g.courses.map((c) => (
                  <option key={c.slug} value={c.shortTitle}>{c.shortTitle}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      {state.kind === 'error' && (
        <p className="mt-3 text-sm text-red-600" role="alert">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-[#e47538] px-5 py-3.5 text-[15px] font-bold text-white transition hover:opacity-95 disabled:opacity-60"
      >
        {busy ? 'Booking…' : 'Book my free demo'}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">No fee, no commitment. We reply on WhatsApp.</p>
    </form>
  );
}
