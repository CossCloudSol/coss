import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import GoogleRatingBadge from '@/components/GoogleRatingBadge';
import type { GoogleRating, GoogleReviews } from '@/lib/google-places';
import { CAREER_POINTS, ICON, STEPS } from '@/lib/home-v4';

/* ── How it works + career assistance ─────────────────────────────────── */

export function StepsCareer({ showCareer }: { showCareer: boolean }) {
  return (
    <section id="career" aria-labelledby="how-title" className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-10 lg:flex-row lg:flex-wrap lg:px-8 lg:pt-[88px]">
      <div className="min-w-0 lg:flex-[3_1_560px]">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#b8531c] lg:text-[13px] dark:text-[#f3a57a]">How it works</p>
        <h2 id="how-title" className="mb-4 mt-1.5 font-heading text-[25px] font-extrabold leading-[1.2] text-[#0a3d4a] lg:mb-[26px] lg:mt-2 lg:text-4xl lg:leading-[1.15] dark:text-white">
          From demo class to your first role
        </h2>
        <ol className="grid gap-2.5 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="light-surface relative flex gap-3.5 overflow-hidden rounded-2xl border border-[#e3eaec] bg-white p-4 lg:block lg:rounded-[20px] lg:p-6">
              <span aria-hidden="true" className="absolute right-3.5 top-1.5 hidden font-heading text-[64px] font-extrabold text-[#eef4f5] lg:block">
                {i + 1}
              </span>
              <span aria-hidden="true" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#005663] text-white lg:h-12 lg:w-12 lg:rounded-[14px]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </span>
              <span className="relative block">
                <h3 className="font-heading text-[17px] font-extrabold text-[#0a3d4a] lg:mb-1.5 lg:mt-4 lg:text-[19px]">
                  <span className="sr-only">{i + 1}. </span>
                  {s.title}
                </h3>
                <p className="font-sans text-sm leading-[1.55] text-[#4a5c61] lg:text-[15px]">{s.body}</p>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {showCareer && (
        <div className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#00707f] to-[#0a3d4a] px-[18px] py-[22px] text-white lg:flex-[2_1_380px] lg:gap-4 lg:rounded-[28px] lg:p-[34px]">
          <svg aria-hidden="true" width="260" height="160" viewBox="0 0 260 160" fill="none" className="absolute -right-2.5 bottom-10 hidden opacity-[0.22] lg:block">
            <path d="M0 150 C60 140 80 100 120 96 S180 70 200 40 L250 10" stroke="#fff" strokeWidth="3" />
            <path d="M232 8 h20 v20" stroke="#fff" strokeWidth="3" />
            <circle cx="120" cy="96" r="6" fill="#fff" />
            <circle cx="200" cy="40" r="6" fill="#fff" />
          </svg>
          <span aria-hidden="true" className="hidden h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white/[0.14] lg:flex">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f3a57a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICON.brief} />
            </svg>
          </span>
          <h2 className="relative font-heading text-[21px] font-extrabold lg:text-[28px] lg:leading-[1.2]">
            Career and placement assistance
          </h2>
          <ul className="relative flex flex-col gap-2.5 font-sans text-[15px] lg:gap-3 lg:text-base">
            {CAREER_POINTS.map((c) => (
              <li key={c} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#b8531c] lg:h-6 lg:w-6">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <path d={ICON.check} />
                  </svg>
                </span>
                {c}
              </li>
            ))}
          </ul>
          <p className="relative mt-3 font-sans text-[13px] text-[#cfe7ea] lg:mt-auto lg:border-t lg:border-white/20 lg:pt-3.5 lg:text-sm">
            Placement is not guaranteed.<span className="hidden lg:inline"> We help you prepare and connect.</span>
          </p>
        </div>
      )}
    </section>
  );
}

/* ── Reviews: live Google data only ───────────────────────────────────── */

export function ReviewsBanner({ reviews, rating }: { reviews: GoogleReviews | null; rating: GoogleRating | null }) {
  if (!reviews || reviews.reviews.length === 0) return null;
  const listing = rating?.mapsUri ?? reviews.mapsUri;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative mt-10 overflow-hidden bg-[#fdf0e8] dark:bg-slate-900 lg:mt-[88px]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(184,83,28,0.12)_1px,transparent_1.5px)] [background-size:20px_20px] lg:[background-size:22px_22px] dark:hidden" />
      <svg aria-hidden="true" width="260" height="220" viewBox="0 0 24 24" fill="rgba(184,83,28,.08)" className="pointer-events-none absolute right-10 top-5 hidden lg:block dark:hidden">
        <path d={ICON.quote} />
      </svg>
      <div className="relative mx-auto max-w-[1280px] px-4 py-9 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#8f3f14] lg:text-[13px] dark:text-[#f3a57a]">Student reviews</p>
            <h2 id="reviews-title" className="mt-1.5 font-heading text-[25px] font-extrabold leading-[1.15] text-[#0a3d4a] lg:mt-2 lg:text-[42px] dark:text-white">
              What students say on Google
            </h2>
          </div>
          {/* The rating card only exists with live rating data: never a hard-coded figure. */}
          {rating?.mapsUri && (
            <div className="light-surface flex flex-wrap items-center gap-3 rounded-[14px] bg-white px-3.5 py-3 lg:gap-4 lg:rounded-[18px] lg:px-[18px] lg:py-3.5 lg:shadow-[0_16px_30px_-24px_rgba(143,63,20,0.6)]">
              <span aria-hidden="true" className="hidden h-11 w-11 items-center justify-center rounded-full bg-[#eaf4f5] font-sans text-xl font-extrabold text-[#005663] lg:flex">
                G
              </span>
              <div>
                <GoogleRatingBadge rating={rating} className="block font-heading text-base font-extrabold text-[#0a3d4a] hover:underline lg:text-lg" />
                <p className="font-sans text-[13px] text-[#4a5c61]">Source: Google</p>
              </div>
              <a
                href={listing}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden min-h-11 items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white px-[22px] font-sans text-[15px] font-bold text-[#005663] hover:border-[#005663] lg:inline-flex"
              >
                Read all on Google
              </a>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2.5 lg:mt-9 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:gap-5">
          {reviews.reviews.map((r) => (
            <figure key={r.id} className="light-surface m-0 flex flex-col gap-2 rounded-[18px] bg-white p-[18px] lg:gap-4 lg:rounded-[22px] lg:p-[26px] lg:shadow-[0_20px_40px_-32px_rgba(143,63,20,0.7)]">
              <div className="flex items-center justify-between gap-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="#f3a57a" className="h-[26px] w-[26px] lg:h-[34px] lg:w-[34px]">
                  <path d={ICON.quote} />
                </svg>
                <span role="img" aria-label={`${r.rating} out of 5 stars`} className="flex shrink-0 gap-px">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-[#b8531c] text-[#b8531c]' : 'text-[#cfdadd]'}`} aria-hidden="true" />
                  ))}
                </span>
              </div>
              <blockquote className="m-0 line-clamp-5 font-sans text-[15px] leading-[1.55] text-[#26383d] lg:text-base lg:leading-[1.6]">{r.text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 lg:border-t lg:border-[#f3e4da] lg:pt-3.5">
                <span aria-hidden="true" className="hidden h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#005663] font-sans text-base font-bold text-white lg:flex">
                  {r.author.charAt(0).toUpperCase()}
                </span>
                <span className="font-sans text-sm">
                  {r.authorUri ? (
                    <a href={r.authorUri} target="_blank" rel="noopener noreferrer" className="block font-bold text-[#17262a] hover:underline lg:text-[15px]">
                      {r.author}
                    </a>
                  ) : (
                    <strong className="block text-[#17262a] lg:text-[15px]">{r.author}</strong>
                  )}
                  <span className="text-[13px] text-[#4a5c61]">Google review{r.when ? ` · ${r.when}` : ''}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <a
          href={listing}
          target="_blank"
          rel="noopener noreferrer"
          className="light-surface mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-[#cfdadd] bg-white font-sans text-[15px] font-bold text-[#005663] lg:hidden"
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
    <section id="corporate" aria-labelledby="corporate-title" className="mx-auto max-w-[1280px] px-4 pt-8 lg:px-8 lg:pt-[88px]">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#0a3d4a] via-[#005663] to-[#00707f] px-[18px] py-6 text-white lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-8 lg:rounded-[30px] lg:p-[52px]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1.5px)] [background-size:20px_20px] lg:block" />
        <svg aria-hidden="true" viewBox="0 0 420 200" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2" className="pointer-events-none absolute -right-5 bottom-0 h-[110px] w-[240px] lg:right-0 lg:h-[200px] lg:w-[420px]">
          <path d="M10 200V120h50v80M60 200V70h70v130M130 200V100h40v100M170 200V40h80v160M250 200V90h50v100M300 200V60h60v140M360 200V110h50v90" />
        </svg>
        <div className="relative min-w-0 lg:flex-[1_1_480px]">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-[#f3a57a] lg:text-[13px]">For companies</p>
          <h2 id="corporate-title" className="mb-1.5 mt-1.5 font-heading text-[22px] font-extrabold lg:mb-2.5 lg:mt-2 lg:text-4xl lg:leading-[1.2]">
            Training a team?
          </h2>
          <p className="max-w-[560px] font-sans text-[15px] leading-[1.6] text-[#d6e8eb] lg:text-[17px]">
            <span className="lg:hidden">Custom programs on-site or live online.</span>
            <span className="hidden lg:inline">Custom corporate programs in Cloud, DevOps, Data and AI, delivered on-site or live online and built around your team&apos;s stack.</span>
          </p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <Link
            href="/corporate-training"
            data-cta="corporate_training"
            data-loc="corporate_banner"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#b8531c] px-[22px] font-sans text-[15px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(184,83,28,0.8)] hover:bg-[#8f3f14] lg:w-auto"
          >
            Get a training proposal
          </Link>
          <Link
            href="/contact-us"
            data-cta="corporate_talk"
            data-loc="corporate_banner"
            className="hidden min-h-12 items-center justify-center rounded-xl border-[1.5px] border-white/40 bg-white/[0.08] px-[22px] font-sans text-[15px] font-bold text-white hover:border-white lg:inline-flex"
          >
            Talk to us
          </Link>
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
    <section aria-labelledby="faq-title" className="mx-auto flex max-w-[1280px] flex-col gap-9 px-4 pt-9 lg:flex-row lg:flex-wrap lg:gap-11 lg:px-8 lg:pt-[88px]">
      <div className="min-w-0 lg:flex-[3_1_560px]">
        <p className="hidden font-sans text-[13px] font-bold uppercase tracking-[0.1em] text-[#b8531c] lg:block dark:text-[#f3a57a]">FAQ</p>
        <h2 id="faq-title" className="mb-3.5 font-heading text-[25px] font-extrabold text-[#0a3d4a] lg:mb-[22px] lg:mt-2 lg:text-4xl lg:leading-[1.15] dark:text-white">
          <span className="lg:hidden">Questions</span>
          <span className="hidden lg:inline">Frequently asked questions</span>
        </h2>
        <div className="flex flex-col gap-2 lg:gap-2.5">
          {faqs.map((f, i) => (
            <details key={f.q} name="home-faq" open={i === 0} className="light-surface group rounded-[14px] border border-[#e3eaec] bg-white lg:rounded-2xl">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-sans text-[15px] font-semibold text-[#17262a] lg:min-h-[62px] lg:gap-4 lg:px-[22px] lg:text-[17px] [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf4f5] text-lg text-[#005663] lg:h-8 lg:w-8 lg:text-xl">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="px-4 pb-4 font-sans text-[15px] leading-[1.55] text-[#4a5c61] lg:px-[22px] lg:pb-5 lg:text-base lg:leading-[1.6]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {articles.length > 0 && (
        <div className="hidden min-w-0 lg:block lg:flex-[2_1_340px]">
          <p className="font-sans text-[13px] font-bold uppercase tracking-[0.1em] text-[#b8531c] dark:text-[#f3a57a]">Blog</p>
          <h2 id="blog-title" className="mb-[22px] mt-2 font-heading text-[30px] font-extrabold leading-[1.2] text-[#0a3d4a] dark:text-white">
            Latest articles
          </h2>
          <ul className="flex flex-col gap-3">
            {articles.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  data-cta="article"
                  data-loc="latest_articles"
                  className="light-surface flex items-center gap-3.5 rounded-2xl border border-[#e3eaec] bg-white p-3 hover:border-[#005663]"
                >
                  <span aria-hidden="true" className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#005663] [background-image:radial-gradient(rgba(255,255,255,.16)_1px,transparent_1.5px)] [background-size:10px_10px]">
                    {a.image ? (
                      <Image src={a.image} alt="" fill sizes="72px" className="object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICON.book} />
                      </svg>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-sans text-[13px] font-semibold text-[#b8531c]">
                      {[a.category, a.date].filter(Boolean).join(' · ')}
                    </span>
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
    </section>
  );
}
