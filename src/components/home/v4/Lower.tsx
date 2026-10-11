import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import GoogleRatingBadge from '@/components/GoogleRatingBadge';
import type { GoogleRating, GoogleReviews } from '@/lib/google-places';
import { CAREER_POINTS, ICON, STEPS } from '@/lib/home-v4';
import SectionHead, { CARD, CONTAINER, ICON_TILE, SECTION_PAD, TONE } from '@/components/home/v4/SectionHead';

/* ── How it works + career assistance ─────────────────────────────────── */

export function StepsCareer({ showCareer }: { showCareer: boolean }) {
  return (
    <section id="career" aria-labelledby="how-title" className={`${TONE.white} ${SECTION_PAD}`}>
      <div className={`${CONTAINER} flex flex-col gap-10 lg:flex-row lg:flex-wrap lg:gap-8`}>
        <div className="min-w-0 lg:flex-[3_1_560px]">
          <SectionHead id="how-title" eyebrow="How it works" title="From demo class to your first role" sub="Three steps, with no payment needed to start." />
          <ol className="mt-8 grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${CARD} flex gap-4 p-5 lg:block lg:p-6`}>
                <span aria-hidden="true" className={`${ICON_TILE} bg-[#005663] text-white`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </span>
                <div>
                  <h3 className="font-heading text-[18px] font-extrabold text-[#0a3d4a] lg:mt-4">
                    <span className="sr-only">{i + 1}. </span>
                    {s.title}
                  </h3>
                  <p className="mt-1.5 font-sans text-[15px] leading-[1.55] text-[#4a5c61]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {showCareer && (
          <div className="on-dark relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#00707f] to-[#0a3d4a] p-6 lg:flex-[2_1_380px] lg:p-8">
            <span aria-hidden="true" className={`${ICON_TILE} bg-white/[0.14]`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f3a57a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICON.brief} />
              </svg>
            </span>
            <h2 className="font-heading text-[22px] font-extrabold text-white lg:text-[28px] lg:leading-[1.2]">Career and placement assistance</h2>
            <ul className="flex flex-col gap-3 font-sans text-base">
              {CAREER_POINTS.map((c) => (
                <li key={c} className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b8531c]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d={ICON.check} />
                    </svg>
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="on-dark-sub mt-auto border-t border-white/20 pt-4 font-sans text-sm">Placement is not guaranteed. We help you prepare and connect.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Reviews: live Google data only ───────────────────────────────────── */

export function ReviewsBanner({ reviews, rating }: { reviews: GoogleReviews | null; rating: GoogleRating | null }) {
  if (!reviews || reviews.reviews.length === 0) return null;
  const listing = rating?.mapsUri ?? reviews.mapsUri;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className={`bg-[#fdf0e8] dark:bg-slate-900 ${SECTION_PAD}`}>
      <div className={CONTAINER}>
        <SectionHead
          id="reviews-title"
          eyebrow="Student reviews"
          title="What students say on Google"
          sub="Reviews as they appear on our Google listing."
          action={
            /* The rating card only exists with live rating data: never a hard-coded figure. */
            rating?.mapsUri ? (
              <div className={`${CARD} flex flex-wrap items-center gap-4 px-4 py-3`}>
                <div>
                  <GoogleRatingBadge rating={rating} className="block font-heading text-lg font-extrabold text-[#0a3d4a] hover:underline" />
                  <p className="font-sans text-sm text-[#4a5c61]">Source: Google</p>
                </div>
                <a
                  href={listing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden min-h-11 items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-5 font-sans text-[15px] font-bold text-[#005663] hover:border-[#005663] lg:inline-flex"
                >
                  Read all on Google
                </a>
              </div>
            ) : undefined
          }
        />

        <div className="mt-8 flex flex-col gap-4 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:gap-6">
          {reviews.reviews.map((r) => (
            <figure key={r.id} className={`${CARD} m-0 flex flex-col gap-3 p-6`}>
              <div className="flex items-center justify-between gap-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="#f3a57a" className="h-7 w-7">
                  <path d={ICON.quote} />
                </svg>
                <span role="img" aria-label={`${r.rating} out of 5 stars`} className="flex shrink-0 gap-px">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-[#b8531c] text-[#b8531c]' : 'text-[#cfdadd]'}`} aria-hidden="true" />
                  ))}
                </span>
              </div>
              <blockquote className="m-0 line-clamp-5 font-sans text-base leading-[1.6] text-[#26383d]">{r.text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-[#f3e4da] pt-4">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#005663] font-sans text-base font-bold text-white">
                  {r.author.charAt(0).toUpperCase()}
                </span>
                <span className="font-sans text-sm">
                  {r.authorUri ? (
                    <a href={r.authorUri} target="_blank" rel="noopener noreferrer" className="block font-bold text-[#17262a] hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <strong className="block text-[#17262a]">{r.author}</strong>
                  )}
                  <span className="text-[#4a5c61]">Google review{r.when ? ` · ${r.when}` : ''}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={listing}
          target="_blank"
          rel="noopener noreferrer"
          className="light-surface mt-5 flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white font-sans text-[15px] font-bold text-[#005663] lg:hidden"
        >
          Read all on Google
        </a>
      </div>
    </section>
  );
}

/* ── Corporate banner ─────────────────────────────────────────────────── */

export function CorporateBanner() {
  return (
    <section id="corporate" aria-labelledby="corporate-title" className={`${TONE.white} ${SECTION_PAD}`}>
      <div className={CONTAINER}>
        <div className="on-dark relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a3d4a] via-[#005663] to-[#00707f] p-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-8 lg:p-12">
          <div className="relative min-w-0 lg:flex-[1_1_480px]">
            <p className="on-dark-eyebrow font-sans text-xs font-bold uppercase tracking-[0.1em] lg:text-[13px]">For companies</p>
            <h2 id="corporate-title" className="mt-2 font-heading text-[26px] font-extrabold leading-[1.2] text-white lg:text-[34px]">
              Training a team?
            </h2>
            <p className="on-dark-sub mt-2 max-w-[560px] font-sans text-base leading-[1.6] lg:text-[17px]">
              Custom programs on-site or live online, built around your team&apos;s stack.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Link
              href="/corporate-training"
              data-cta="corporate_training"
              data-loc="corporate_banner"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#b8531c] px-6 font-sans text-[15px] font-bold text-white hover:bg-[#8f3f14] lg:w-auto"
            >
              Get a training proposal
            </Link>
            <Link
              href="/contact-us"
              data-cta="corporate_talk"
              data-loc="corporate_banner"
              className="hidden min-h-12 items-center justify-center rounded-xl border-[1.5px] border-white/50 px-6 font-sans text-[15px] font-bold text-white hover:border-white lg:inline-flex"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ + latest articles ────────────────────────────────────────────── */

export interface ArticleCardData {
  href: string;
  title: string;
  category: string;
  date: string | null;
  readTime: string | null;
  image: string | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqArticles({ faqs, articles }: { faqs: readonly FaqItem[]; articles: ArticleCardData[] }) {
  return (
    <section aria-labelledby="faq-title" className={`${TONE.tint} ${SECTION_PAD}`}>
      <div className={`${CONTAINER} flex flex-col gap-12 lg:flex-row lg:flex-wrap lg:gap-12`}>
        <div className="min-w-0 lg:flex-[3_1_560px]">
          <SectionHead id="faq-title" eyebrow="FAQ" title="Frequently asked questions" sub="Quick answers before you book a demo." />
          <div className="mt-8 flex flex-col gap-3">
            {faqs.map((f, i) => (
              <details key={f.q} name="home-faq" open={i === 0} className={`${CARD} group`}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 font-sans text-base font-semibold text-[#17262a] lg:min-h-16 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf4f5] text-xl text-[#005663]">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="px-5 pb-5 font-sans text-base leading-[1.6] text-[#4a5c61]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {articles.length > 0 && (
          <div className="hidden min-w-0 lg:block lg:flex-[2_1_340px]">
            <SectionHead id="blog-title" eyebrow="Blog" title="Latest articles" sub="Guides and career advice." />
            <ul className="mt-8 flex flex-col gap-3">
              {articles.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} data-cta="article" data-loc="latest_articles" className={`${CARD} flex items-center gap-4 p-3 hover:border-[#005663]`}>
                    <span aria-hidden="true" className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#005663] [background-image:radial-gradient(rgba(255,255,255,.16)_1px,transparent_1.5px)] [background-size:10px_10px]">
                      {a.image ? (
                        <Image src={a.image} alt="" fill sizes="72px" className="object-cover" />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={ICON.book} />
                        </svg>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-sans text-sm font-semibold text-[#a8471a]">{[a.category, a.date].filter(Boolean).join(' · ')}</span>
                      <span className="line-clamp-2 font-heading text-base font-extrabold leading-[1.35] text-[#0a3d4a]">{a.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog" data-cta="all_articles" data-loc="latest_articles" className="mt-3 inline-flex min-h-11 items-center font-sans text-base font-bold text-[#005663] dark:text-[#5ef0c8]">
              All articles →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
