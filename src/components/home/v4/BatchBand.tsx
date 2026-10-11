import Link from 'next/link';
import { WA_NUMBER } from '@/lib/whatsapp';
import { bannerStyle, courseLook, dateParts, ICON } from '@/lib/home-v4';

export interface BatchCardData {
  id: string;
  course: string;
  categorySlug: string | null;
  mode: string;
  centre: string | null;
  startDate: Date;
  schedule: string;
  batchName: string;
  trainer: string | null;
}

/** wa.me link for a server-rendered anchor (the click is also logged by the page's CTA script). */
function waHref(message: string): string {
  const digits = WA_NUMBER.replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
  return `https://wa.me/91${ten}?text=${encodeURIComponent(message)}`;
}

function batchType(b: BatchCardData): string {
  if (/sat|sun|weekend/i.test(b.schedule) || /weekend/i.test(b.batchName)) return 'Weekend batch';
  if (/weekday|mon|tue|wed|thu|fri/i.test(b.schedule) || /weekday/i.test(b.batchName)) return 'Weekday batch';
  return 'Batch';
}

/**
 * Upcoming batches (Design v4): the dark band with dot grid and glows, branch tabs, and a card per
 * batch with a date tile. Tabs are radio inputs filtered by `.home-batches` rules in globals.css.
 */
export default function BatchBand({ batches }: { batches: BatchCardData[] }) {
  if (batches.length === 0) return null;
  const branches = ['All', 'Dilsukhnagar', 'Ameerpet', 'Online'] as const;
  return (
    <section id="batches" aria-labelledby="batches-title" className="home-batches relative mt-11 overflow-hidden bg-[#0a3d4a] lg:mt-[72px]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1.5px)] [background-size:20px_20px] lg:[background-size:22px_22px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-[140px] -top-[140px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(0,140,155,0.45),rgba(0,140,155,0)_70%)] lg:-right-40 lg:-top-[200px] lg:h-[560px] lg:w-[560px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-[120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(228,117,56,0.28),rgba(228,117,56,0)_70%)] lg:-bottom-[220px] lg:-left-[120px] lg:h-[520px] lg:w-[520px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-[140px] right-[8%] hidden h-[300px] w-[300px] rounded-full border-[50px] border-white/[0.03] lg:block" />
      <div className="relative mx-auto max-w-[1280px] px-4 py-10 text-white lg:px-8 lg:py-[84px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#f3a57a] lg:text-[13px]">Batch schedule</p>
            <h2 id="batches-title" className="mt-1.5 font-heading text-[27px] font-extrabold leading-[1.15] lg:mt-2 lg:text-[42px]">
              Upcoming batches
            </h2>
            <p className="mt-1.5 font-sans text-[15px] text-[#c9dbdf] lg:mt-2.5 lg:text-[17px]">
              <span className="lg:hidden">Every batch includes class recordings.</span>
              <span className="hidden lg:inline">Pick a start date and timing that fits. Every batch includes class recordings.</span>
            </p>
          </div>
          <div role="radiogroup" aria-label="Branch" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {branches.map((b, i) => (
              <label key={b} className="cursor-pointer">
                <input type="radio" name="batch-branch" value={b} defaultChecked={i === 0} className="peer sr-only" />
                <span className="flex min-h-11 items-center whitespace-nowrap rounded-full border border-white/30 bg-white/[0.06] px-4 font-sans text-sm font-medium text-white peer-checked:border-white peer-checked:bg-white peer-checked:font-bold peer-checked:text-[#0a3d4a] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white lg:px-[18px] lg:text-[15px]">
                  {b}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:mt-10 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] lg:gap-5">
          {batches.map((b) => {
            const look = courseLook(b.categorySlug);
            const parts = dateParts(b.startDate);
            const online = b.mode === 'Online';
            const branch = online ? 'Online' : b.centre ?? '';
            const where = online ? 'Live online' : b.centre ? `${b.centre} classroom` : 'Classroom';
            return (
              <article
                key={b.id}
                data-branch={branch}
                className="light-surface flex flex-col overflow-hidden rounded-[22px] bg-white text-[#17262a] lg:rounded-3xl lg:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
              >
                <div className="relative h-[92px] lg:h-[104px]" style={bannerStyle(look.ink, 16)}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="absolute -right-2.5 -top-3.5 h-[100px] w-[100px] lg:-right-3.5 lg:-top-[18px] lg:h-[120px] lg:w-[120px]">
                    <path d={look.path} />
                  </svg>
                  <span className="absolute bottom-3 right-3.5 inline-flex items-center rounded-full bg-white/[0.18] px-2.5 py-[5px] font-sans text-xs font-bold text-white lg:bottom-auto lg:left-5 lg:right-auto lg:top-[18px] lg:gap-1.5 lg:py-1.5">
                    {online ? 'Live online' : 'Classroom'}
                  </span>
                  <div className="absolute -bottom-[30px] left-4 flex h-[72px] w-[66px] flex-col items-center justify-center rounded-2xl bg-white leading-none shadow-[0_10px_22px_-10px_rgba(5,30,36,0.5)] lg:-bottom-[34px] lg:left-5 lg:h-20 lg:w-[74px] lg:rounded-[18px] lg:shadow-[0_12px_26px_-10px_rgba(5,30,36,0.45)]">
                    <span className="font-sans text-[10px] font-bold tracking-[0.08em] text-[#b8531c] lg:text-[11px]">{parts.dow}</span>
                    <span className="my-[3px] font-heading text-[26px] font-extrabold text-[#0a3d4a] lg:text-[30px]">{parts.day}</span>
                    <span className="font-sans text-[10px] font-bold tracking-[0.08em] text-[#4a5c61] lg:text-[11px]">{parts.mon}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-10 lg:gap-3.5 lg:px-5 lg:pb-5 lg:pt-[46px]">
                  <div>
                    <p className="font-sans text-[12.5px] font-semibold text-[#4a5c61] lg:text-[13px]">{batchType(b)}</p>
                    <h3 className="mt-[3px] font-heading text-[19px] font-extrabold leading-tight text-[#0a3d4a] lg:mt-1 lg:text-xl">{b.course}</h3>
                  </div>
                  <ul className="flex flex-col gap-1.5 border-t border-dashed border-[#dbe5e7] pt-2.5 font-sans text-sm text-[#26383d] lg:gap-2.5 lg:pt-3">
                    <li className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf4f5] text-[#005663] lg:flex">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={ICON.clock} /></svg>
                      </span>
                      <span>
                        {b.schedule}
                        <span className="lg:hidden"> · {where}</span>
                      </span>
                    </li>
                    <li className="hidden items-center gap-2.5 lg:flex">
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf4f5] text-[#005663]">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={ICON.pin} /></svg>
                      </span>
                      {where}
                    </li>
                    {b.trainer && (
                      <li className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf4f5] text-[#005663] lg:flex">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={ICON.user} /></svg>
                        </span>
                        Trainer: {b.trainer}
                      </li>
                    )}
                  </ul>
                  <div className="mt-auto flex gap-2">
                    <a
                      href="#enroll-form"
                      data-cta="reserve_seat"
                      data-loc="upcoming_batches"
                      data-prefill={b.course}
                      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#b8531c] px-3 font-sans text-[15px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(184,83,28,0.8)] hover:bg-[#8f3f14]"
                    >
                      Reserve my seat
                    </a>
                    <a
                      href={waHref(`Hi, I'd like to know more about the ${b.course} batch starting ${parts.day} ${parts.mon}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ask about the ${b.course} batch on WhatsApp`}
                      data-cta="batch_whatsapp"
                      data-loc="upcoming_batches"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f6ec] text-[#0f5a2c]"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={ICON.whatsapp} /></svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-[18px] flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-8">
          <Link
            href="/batches"
            data-cta="all_batches"
            data-loc="upcoming_batches"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-white/40 bg-white/[0.08] px-[22px] font-sans text-[15px] font-bold text-white hover:border-white lg:w-auto"
          >
            See all upcoming batches<span className="hidden lg:inline">&nbsp;→</span>
          </Link>
          <span className="hidden font-sans text-[15px] text-[#c9dbdf] lg:inline">
            Need a custom timing?{' '}
            <a
              href={waHref('Hi, I need a custom batch timing at Coss Cloud Solutions.')}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="custom_timing_whatsapp"
              data-loc="upcoming_batches"
              className="font-bold text-[#f3a57a]"
            >
              Ask on WhatsApp
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
