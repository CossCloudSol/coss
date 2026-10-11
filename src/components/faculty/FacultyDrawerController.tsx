'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { submitLead } from '@/lib/submitLead';
import { NAME_ERROR, PHONE_ERROR, isValidName, normalizeIndianMobile } from '@/lib/lead-checks';
import { trackFormStart, trackFormSubmit } from '@/lib/click-tracking';
import HoneypotField, { useBotGuard } from '@/components/HoneypotField';
import FormPrivacyNote from '@/components/FormPrivacyNote';
import WhatsAppOptIn, { optInFromForm } from '@/components/WhatsAppOptIn';
import { goToThankYou } from '@/lib/lead-thank-you';

const FORM_ID = 'faculty_demo';

/** The drawer's demo form: the same lead path as the hero form (validation, honeypot, attribution, WhatsApp opt-in, thank-you). */
function DemoForm({ trainer, label }: { trainer: string; label: string }) {
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
      message: `Free demo with ${trainer} (from the Faculty page)`,
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
  const field = 'min-h-12 w-full rounded-[10px] border-[1.5px] border-[#cfdadd] bg-white px-3 font-sans text-base text-[#17262a] placeholder:text-[#5e6f74]';
  return (
    <form onSubmit={onSubmit} onFocus={markStarted} noValidate aria-label={`Book a free demo with ${trainer}`} className="light-surface flex flex-col gap-2.5">
      <HoneypotField inputRef={honeypotRef} />
      <p className="font-heading text-lg font-extrabold text-[#0a3d4a]">Attend a free demo with {label.replace(/^Demo with /, '')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label>
          <span className="sr-only">Your name</span>
          <input data-demo-name="" className={field} type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </label>
        <label>
          <span className="sr-only">Mobile number</span>
          <input className={field} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
        </label>
      </div>
      <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-[#b8531c] px-5 font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14] disabled:opacity-60">
        {busy ? 'Booking…' : 'Book my free demo'}
      </button>
      {typeof state === 'object' && (
        <p role="alert" className="rounded-lg bg-[#fbe9ec] px-3 py-2 font-sans text-sm text-[#8a2236]">
          {state.error}
        </p>
      )}
      <WhatsAppOptIn />
      <FormPrivacyNote />
    </form>
  );
}

/**
 * One controller for every profile drawer on /faculty: opens the trainer's <dialog> from any
 * [data-open-profile] button, closes it on a backdrop click, and mounts the demo form (a portal into
 * that drawer's slot) only while the drawer is open, so the page hydrates one form at most.
 */
export default function FacultyDrawerController(): JSX.Element | null {
  const [open, setOpen] = useState<{ slot: HTMLElement; mount: HTMLElement; trainer: string; label: string } | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLElement>('[data-open-profile]');
      if (btn) {
        const dlg = document.getElementById(`profile-${btn.dataset.openProfile}`) as HTMLDialogElement | null;
        if (!dlg || typeof dlg.showModal !== 'function') return;
        const slot = dlg.querySelector<HTMLElement>('[data-demo-slot]');
        const mount = slot?.querySelector<HTMLElement>('[data-demo-mount]');
        if (slot && mount) {
          slot.setAttribute('data-live', '');
          setOpen({ slot, mount, trainer: slot.dataset.trainer ?? '', label: slot.dataset.label ?? '' });
        }
        dlg.showModal();
        if (btn.hasAttribute('data-focus-form')) {
          requestAnimationFrame(() => {
            slot?.scrollIntoView({ block: 'center' });
            slot?.querySelector<HTMLInputElement>('[data-demo-name]')?.focus({ preventScroll: true });
          });
        }
        return;
      }
      // A click on the backdrop lands on the <dialog> itself.
      if (target instanceof HTMLDialogElement && target.classList.contains('fac-drawer')) target.close();
    }
    function onClose(e: Event) {
      if ((e.target as HTMLElement).classList?.contains('fac-drawer')) {
        (e.target as HTMLElement).querySelector('[data-demo-slot]')?.removeAttribute('data-live');
        setOpen(null);
      }
    }
    document.addEventListener('click', onClick);
    document.addEventListener('close', onClose, true);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('close', onClose, true);
    };
  }, []);

  if (!open) return null;
  return createPortal(<DemoForm trainer={open.trainer} label={open.label} />, open.mount);
}
