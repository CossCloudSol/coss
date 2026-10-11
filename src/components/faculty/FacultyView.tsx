import Link from 'next/link';
import { optimizeCldUrl } from '@/lib/cloudinary';
import { bannerStyle } from '@/lib/home-v4';
import { getYearsOfExperience, splitCommaList } from '@/lib/trainer-queries';
import { TRACKS, demoLabel, initialsOf, matchCourse, parseTeaches, trackOf, type TrackKey } from '@/lib/faculty';
import { MENU_ICON_COLORS, MENU_ICON_PATHS } from '@/lib/menu-icons';
import { CARD, CONTAINER, SECTION_PAD, TONE } from '@/components/home/v4/SectionHead';
import FacultyDrawerController from '@/components/faculty/FacultyDrawerController';

export interface FacultyTrainer {
  id: string;
  name: string;
  title: string;
  category: string | null;
  skills: string | null;
  teaches: string | null;
  startYear: number | null;
  bio: string | null;
  photoUrl: string | null;
}

interface Props {
  trainers: FacultyTrainer[];
  courses: readonly { title: string; url: string }[];
}

const SKILLS_ON_CARD = 5;

/** A track's label with the menu's icon path and colour pair (ink: banner fill and text on the tint). */
function trackInfo(key: TrackKey) {
  const t = TRACKS.find((x) => x.key === key) ?? TRACKS[TRACKS.length - 1];
  const [tint, ink] = MENU_ICON_COLORS[t.icon];
  return { ...t, tint, ink, path: MENU_ICON_PATHS[t.icon] };
}

function Photo({ t, size, track, className = '' }: { t: FacultyTrainer; size: number; track: TrackKey; className?: string }) {
  const info = trackInfo(track);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white font-heading font-extrabold shadow-[0_10px_22px_-8px_rgba(10,61,74,0.4)] ${className}`}
      style={{ width: size, height: size, background: info.tint, color: info.ink, fontSize: size * 0.3 }}
    >
      {t.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={optimizeCldUrl(t.photoUrl, { width: size * 2, height: size * 2, crop: 'fill', gravity: 'face' })} alt={t.name} width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span role="img" aria-label={`Initials of ${t.name}`}>{initialsOf(t.name)}</span>
      )}
    </span>
  );
}

function Experience({ years }: { years: number | null }) {
  if (years === null || years <= 0) return null;
  return (
    <span className="light-surface flex items-center gap-2 rounded-[14px] border border-[#e3eaec] bg-white px-3 py-2 shadow-[0_8px_18px_-12px_rgba(10,61,74,0.5)]">
      <span className="font-heading text-[22px] font-extrabold text-[#0a3d4a]">{years}+</span>
      <span className="font-sans text-[13px] font-semibold leading-tight text-[#4a5c61]">
        years industry
        <br />
        experience
      </span>
    </span>
  );
}

/** Topic chips: a chip links (with an arrow) only when it names a published course; any other topic is a plain chip. */
function TopicChips({ topics, courses }: { topics: string[]; courses: Props['courses'] }) {
  if (topics.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {topics.map((c) => {
        const course = matchCourse(c, courses);
        return (
          <li key={c}>
            {course ? (
              <Link href={course.url} data-cta="faculty_course" data-loc="faculty" className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#fdf0e8] px-3 font-sans text-sm font-bold text-[#8f3f14] hover:bg-[#f9e1d1]">
                {c} <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span className="inline-flex min-h-9 items-center rounded-full border border-[#e3eaec] bg-[#f4f7f8] px-3 font-sans text-sm font-medium text-[#26383d]">{c}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const LABEL = 'font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#4a5c61]';

/**
 * /faculty (Design v4, Faculty.dc.html): hero banner, track filter chips, a card per trainer and a
 * profile drawer per trainer. Server HTML; the filter is native radio inputs + CSS :has() (globals.css
 * ".fac"), the drawers are <dialog> elements opened by one small client controller that also mounts
 * the demo form. Allowed claims only; experience comes from the admin's career start year.
 */
export default function FacultyView({ trainers, courses }: Props) {
  const rows = trainers.map((t) => ({
    t,
    track: trackOf(t.category, t.title),
    years: getYearsOfExperience(t.startYear),
    skills: splitCommaList(t.skills),
    teaches: parseTeaches(t.teaches),
  }));
  const present = TRACKS.filter((tr) => rows.some((r) => r.track === tr.key));

  return (
    <>
      <section className="on-dark relative overflow-hidden bg-gradient-to-br from-[#0a3d4a] via-[#005663] to-[#00707f]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1.5px)] [background-size:22px_22px]" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-[120px] -top-40 h-[420px] w-[420px] rounded-full border-[80px] border-white/[0.04]" />
        <div className={`relative ${CONTAINER} flex flex-wrap items-center gap-10 py-12 lg:py-16`}>
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
            <nav aria-label="Breadcrumb" className="on-dark-sub font-sans text-sm">
              <Link href="/" className="font-semibold text-white hover:underline">Home</Link> / Faculty
            </nav>
            <h1 className="font-heading text-[34px] font-extrabold leading-[1.1] text-white lg:text-[52px]">Meet your trainers</h1>
            <p className="on-dark-sub max-w-[620px] font-sans text-base leading-[1.6] lg:text-lg">
              The trainers behind Coss Cloud Solutions: practitioners who teach from real project work, in Dilsukhnagar, Ameerpet and live online.
            </p>
            <ul className="mt-1 flex flex-wrap gap-2.5 font-sans text-sm font-semibold">
              {[`${trainers.length} trainers`, 'Classroom + live online', 'Free demo with the trainer'].map((p) => (
                <li key={p} className="rounded-full bg-white/[0.12] px-3.5 py-2 text-white">{p}</li>
              ))}
            </ul>
          </div>
          <div className="light-surface flex w-full max-w-[400px] flex-[1_1_340px] flex-col gap-3 rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#a8471a]">Free demo class</p>
            <p className="font-heading text-[21px] font-extrabold leading-[1.25] text-[#0a3d4a]">Sit in on a class with the trainer before you join</p>
            <Link href="/free-demo-class" data-cta="book_demo" data-loc="faculty_hero" className="flex min-h-12 items-center justify-center rounded-xl bg-[#b8531c] px-5 font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14]">
              Book a free demo
            </Link>
            <Link href="/contact-us" className="flex min-h-11 items-center justify-center font-sans text-sm font-bold text-[#005663]">
              or contact us
            </Link>
          </div>
        </div>
      </section>

      <section className={`fac ${TONE.tint} ${SECTION_PAD} !pt-10`} aria-labelledby="faculty-list-title">
        <div className={CONTAINER}>
          <h2 id="faculty-list-title" className="sr-only">Our trainers</h2>
          {rows.length === 0 ? (
            <p className="text-center text-[#4a5c61]">Trainer profiles are coming soon.</p>
          ) : (
            <>
              {present.length > 1 && (
                <div role="radiogroup" aria-label="Filter by track" className="flex flex-wrap items-center gap-2">
                  <span className="mr-1.5 font-sans text-sm font-bold text-[#26383d] dark:text-slate-200">Filter by track</span>
                  {[{ key: 'all', label: 'All' }, ...present].map((tr, i) => (
                    <label key={tr.key} className="cursor-pointer">
                      <input type="radio" name="fac-track" value={tr.key} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="light-surface flex min-h-11 items-center whitespace-nowrap rounded-full border border-[#cfdadd] bg-white px-[18px] font-sans text-[15px] font-medium text-[#26383d] peer-checked:border-[#005663] peer-checked:bg-[#005663] peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005663]">
                        {tr.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rows.map(({ t, track, years, skills }) => {
                  const info = trackInfo(track);
                  const shown = skills.slice(0, SKILLS_ON_CARD);
                  return (
                    <li key={t.id} id={`trainer-${t.id}`} data-track={track} className="scroll-mt-24">
                      <article className={`${CARD} flex h-full flex-col overflow-hidden`}>
                        <div className="relative h-[118px]" style={bannerStyle(info.ink, 14)}>
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className="absolute -right-4 -top-[18px] h-[130px] w-[130px]">
                            <path d={info.path} />
                          </svg>
                          <span className="absolute left-[22px] top-[18px] font-sans text-xs font-bold uppercase tracking-[0.08em] text-white">{info.label}</span>
                        </div>
                        <div className="flex flex-1 flex-col gap-4 px-[22px] pb-[22px]">
                          <div className="relative -mt-[52px] flex items-end justify-between gap-3">
                            <Photo t={t} size={104} track={track} />
                            <Experience years={years} />
                          </div>
                          <div>
                            <h3 className="font-heading text-[22px] font-extrabold leading-tight text-[#0a3d4a]">{t.name}</h3>
                            <p className="mt-1.5 font-sans text-[15px] leading-[1.45] text-[#4a5c61]">{t.title}</p>
                          </div>
                          {skills.length > 0 && (
                            <div className="flex flex-col gap-2">
                              <p className={LABEL}>Expertise</p>
                              <ul className="flex flex-wrap items-center gap-1.5">
                                {shown.map((s) => (
                                  <li key={s} className="rounded-lg px-2.5 py-[5px] font-sans text-[13px] font-semibold" style={{ background: info.tint, color: info.ink }}>{s}</li>
                                ))}
                                {skills.length > SKILLS_ON_CARD && (
                                  <li>
                                    <button type="button" data-open-profile={t.id} className="min-h-9 rounded-lg px-2.5 font-sans text-[13px] font-bold text-[#005663] hover:underline">
                                      + {skills.length - SKILLS_ON_CARD} more
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-2 pt-1.5">
                            <button type="button" data-open-profile={t.id} data-focus-form="" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#b8531c] px-3 py-2 text-center leading-tight font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14]">
                              {demoLabel(t.name)}
                            </button>
                            <button type="button" data-open-profile={t.id} className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-4 font-sans text-[15px] font-bold text-[#005663] hover:border-[#005663]">
                              View profile
                            </button>
                          </div>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>

              <div className="fac-cta on-dark relative mt-8 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a3d4a] to-[#005663] p-8 lg:p-10">
                <div className="min-w-0 flex-[1_1_420px]">
                  <p className="on-dark-eyebrow font-sans text-[13px] font-bold uppercase tracking-[0.1em]">Not sure who to learn from?</p>
                  <h2 className="mt-2 max-w-[560px] font-heading text-[26px] font-extrabold leading-[1.2] text-white lg:text-[30px]">
                    Tell us your goal. We will match you with the right course and trainer.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact-us" data-cta="counselling" data-loc="faculty_cta" className="inline-flex min-h-12 items-center rounded-xl bg-[#b8531c] px-6 font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14]">
                    Free counselling call
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Profile drawers: native <dialog> (focus trap, Esc and backdrop come with it), full text in the HTML. */}
      {rows.map(({ t, track, years, skills, teaches }) => {
        const info = trackInfo(track);
        return (
          <dialog key={t.id} id={`profile-${t.id}`} aria-label={`Profile of ${t.name}`} className="fac-drawer">
            <div className="relative h-[150px] shrink-0" style={bannerStyle(info.ink, 14)}>
              <span className="absolute left-7 top-6 font-sans text-xs font-bold uppercase tracking-[0.08em] text-white">{info.label}</span>
              <form method="dialog" className="absolute right-4 top-4">
                <button type="submit" aria-label="Close profile" className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 text-white hover:bg-black/45">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </form>
            </div>
            <div className="flex flex-col gap-5 px-7 pb-8">
              <Photo t={t} size={120} track={track} className="relative -mt-[60px]" />
              <div className="flex flex-col gap-2">
                <h2 className="font-heading text-[28px] font-extrabold leading-tight text-[#0a3d4a]">{t.name}</h2>
                <p className="font-sans text-[15px] leading-[1.5] text-[#4a5c61]">{t.title}</p>
                {years !== null && years > 0 && <p className="self-start rounded-full bg-[#e1f0f2] px-3 py-1.5 font-sans text-sm font-bold text-[#005663]">{years}+ years industry experience</p>}
              </div>
              {t.bio && <p className="whitespace-pre-line font-sans text-[15px] leading-[1.65] text-[#26383d]">{t.bio}</p>}
              {skills.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className={LABEL}>Expertise</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <li key={s} className="rounded-lg border border-[#e3eaec] bg-[#f4f7f8] px-2.5 py-1.5 font-sans text-sm text-[#26383d]">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {teaches.topics.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className={LABEL}>Teaches</p>
                  <TopicChips topics={teaches.topics} courses={courses} />
                </div>
              )}
              {teaches.approach && (
                <div className="flex flex-col gap-2">
                  <h3 className={LABEL}>Teaching approach</h3>
                  <p className="font-sans text-[15px] leading-[1.65] text-[#26383d]">{teaches.approach}</p>
                </div>
              )}
              <div data-demo-slot={t.id} data-trainer={t.name} data-label={demoLabel(t.name)} className="rounded-[18px] bg-[#eaf4f5] p-[18px]">
                <div data-demo-fallback="">
                  <p className="font-heading text-lg font-extrabold text-[#0a3d4a]">Attend a free demo with {demoLabel(t.name).replace(/^Demo with /, '')}</p>
                  <Link href="/free-demo-class" className="mt-1 inline-flex min-h-11 items-center font-sans text-sm font-bold text-[#8f3f14] underline">Book on the free demo page</Link>
                </div>
                <div data-demo-mount="" />
              </div>
            </div>
          </dialog>
        );
      })}
      <FacultyDrawerController />
    </>
  );
}
