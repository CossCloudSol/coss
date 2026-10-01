'use client';

import { useRef, useState } from 'react';
import { Check, SearchX } from 'lucide-react';
import { submitLead } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, nameField, normalizeIndianMobile } from '@/lib/lead-validation';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

/**
 * "We couldn't find that course" callback form: name and phone through the
 * normal lead flow (formType course_search), with the search term saved in
 * the lead's message so the counsellor knows what was asked for.
 */
export default function NoResultsLead({
  term,
  formId,
  compact = false,
  children,
}: {
  term: string;
  /** GA4 form_id, e.g. "header_search_no_results". */
  formId: string;
  compact?: boolean;
  /** Extra actions under the form (clear filters, browse links). */
  children?: React.ReactNode;
}): JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const started = useRef(false);
  const { honeypotRef, botFields } = useBotGuard();

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackFormStart(formId);
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
      message: `Searched for a course: "${term.trim().slice(0, 200)}"`,
      formType: 'course_search',
      bot: botFields(),
    });
    if (result.ok) {
      trackFormSubmit(formId);
      setState({ kind: 'success' });
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  const busy = state.kind === 'submitting';
  const input =
    'h-12 min-w-0 rounded-[10px] border border-[#cfdadd] bg-white px-3 text-base text-[#17262a] outline-none placeholder:text-[#5f7075] focus:border-[#005663] focus:ring-2 focus:ring-[#005663]/20';

  return (
    <div className={`flex flex-col gap-3 ${compact ? '' : 'items-center text-center'}`}>
      {!compact && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdf0e8] text-[#b8531c]">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <p className={`font-heading font-extrabold text-[#0a3d4a] dark:text-white ${compact ? 'text-lg' : 'text-[22px]'}`}>
        We couldn&apos;t find that course yet
      </p>
      <p className="max-w-[420px] text-sm leading-relaxed text-[#4a5c61] md:text-[15px] dark:text-slate-300">
        Leave your number and a counsellor will tell you the closest course we run for &ldquo;{term.trim()}&rdquo;.
      </p>
      {state.kind === 'success' ? (
        <p role="status" className="flex items-center gap-2 rounded-[10px] bg-[#e6f0f1] px-3.5 py-2.5 text-sm font-bold text-[#005663]">
          <Check className="h-4 w-4" aria-hidden="true" />
          Thanks, a counsellor will call you shortly.
        </p>
      ) : (
        <form onSubmit={onSubmit} onFocus={markStarted} noValidate className={`flex w-full flex-col gap-2 ${compact ? '' : 'max-w-[480px]'}`}>
          <HoneypotField inputRef={honeypotRef} />
          <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
            <label className="flex">
              <span className="sr-only">Your name</span>
              <input className={`${input} w-full`} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
            </label>
            <label className="flex h-12 items-center gap-2 rounded-[10px] border border-[#cfdadd] bg-white pl-3 focus-within:border-[#005663] focus-within:ring-2 focus-within:ring-[#005663]/20">
              <span className="text-[15px] text-[#26383d]" aria-hidden="true">+91</span>
              <span className="sr-only">Mobile number</span>
              <input
                className="field-bare h-full min-w-0 flex-1 rounded-r-[10px] border-0 bg-transparent pr-3 text-base text-[#17262a] outline-none placeholder:text-[#5f7075]"
                type="tel"
                inputMode="tel"
                placeholder="10-digit mobile"
                autoComplete="tel-national"
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </label>
          </div>
          {state.kind === 'error' && <p className="text-sm text-red-700" role="alert">{state.message}</p>}
          <button type="submit" disabled={busy} className="h-12 rounded-[10px] bg-[#b8531c] text-[15px] font-bold text-white hover:bg-[#8f3f14] disabled:opacity-60">
            {busy ? 'Sending…' : 'Call me back'}
          </button>
        </form>
      )}
      {children}
    </div>
  );
}
