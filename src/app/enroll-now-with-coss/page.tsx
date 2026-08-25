import type { Metadata } from 'next';
import Link from 'next/link';
import HeroEnrollForm from '@/components/HeroEnrollForm';
import CallLink from '@/components/CallLink';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('enroll-now-with-coss');
}

const enrollFeatures = [
  {
    bg: '#FFF7ED',
    color: '#FF6B2B',
    title: 'Industry Certifications',
    desc: 'AWS, Microsoft, Google — globally recognised credentials.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    bg: '#E6FFFA',
    color: '#0BA5A0',
    title: 'Hands-on Labs',
    desc: 'Real tools from day one — no theory-only sessions.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    bg: '#ECFDF5',
    color: '#059669',
    title: '100% Placement Support',
    desc: 'Resume, mock interviews, job portal access until placed.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    bg: '#EFF6FF',
    color: '#2563EB',
    title: 'Expert Trainers',
    desc: 'Certified professionals with 10+ years industry experience.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
  {
    bg: '#F3E8FF',
    color: '#7C3AED',
    title: 'Flexible Batches',
    desc: 'Weekday, weekend, morning & evening — learn your way.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    bg: '#FFFBEB',
    color: '#D97706',
    title: '2 Branches + Online',
    desc: 'Dilsukhnagar, Ameerpet, and live online options.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const enrollTestimonials = [
  {
    stars: 5,
    text: '"Got placed at TCS in 3 months. The hands-on approach made all the difference."',
    name: 'Rahul M.',
    course: 'AWS DevOps Batch',
  },
  {
    stars: 5,
    text: '"Trainers are industry professionals — real projects from day one. Worth every rupee."',
    name: 'Sneha P.',
    course: 'Data Science Batch',
  },
  {
    stars: 5,
    text: '"The free demo alone was better than paid classes I tried elsewhere."',
    name: 'Kiran T.',
    course: 'Full Stack Power BI Batch',
  },
];

export default function EnrollPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section id="top" className="bg-[#0D1B2A] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 text-xs text-white/50" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span className="mx-2 text-white/30" aria-hidden="true">›</span>
            <span className="text-white/80">Enroll Now</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT — Headline + trust */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot-pulse inline-block"></span>
                Admissions Open — June 2026 Batch
              </div>

              <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Start Your <span className="text-[#FF6B2B]">IT Career</span><br />
                in Hyderabad
              </h1>

              <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
                Expert trainers, hands-on labs, and 100% placement support.
                Join 5,000+ students already placed at top companies.
              </p>

              {/* Trust stats row */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B2B' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <div>
                    <div className="text-white font-bold text-sm">5,000+</div>
                    <div className="text-slate-500 text-xs">Students Placed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B2B' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div>
                    <div className="text-white font-bold text-sm">15+ Years</div>
                    <div className="text-slate-500 text-xs">of Excellence</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B2B' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <div>
                    <div className="text-white font-bold text-sm">30+</div>
                    <div className="text-slate-500 text-xs">Courses Offered</div>
                  </div>
                </div>
              </div>

              {/* Social proof avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B2B] border-2 border-[#0D1B2A] flex items-center justify-center text-white text-xs font-bold">R</div>
                  <div className="w-8 h-8 rounded-full bg-[#0BA5A0] border-2 border-[#0D1B2A] flex items-center justify-center text-white text-xs font-bold">S</div>
                  <div className="w-8 h-8 rounded-full bg-[#4D7CFE] border-2 border-[#0D1B2A] flex items-center justify-center text-white text-xs font-bold">P</div>
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] border-2 border-[#0D1B2A] flex items-center justify-center text-white text-xs font-bold">K</div>
                </div>
                <p className="text-slate-400 text-sm">
                  <span className="text-white font-semibold">New students</span> enrolling every week — join them!
                </p>
              </div>
            </div>

            {/* RIGHT — Form card (homepage hero style) */}
            <div>
              <HeroEnrollForm />
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-16 px-4 bg-[#F0F2F5]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] text-center mb-10">
            Why 5,000+ Students Choose Coss Cloud Solutions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollFeatures.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-black/[0.07] p-6 flex gap-4 items-start">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.svg}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A] text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] text-center mb-10">
            What Our Students Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enrollTestimonials.map((t) => (
              <div key={t.name} className="bg-[#F8FAFC] rounded-2xl border border-black/[0.06] p-6">
                <div className="text-amber-400 text-base mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">{t.text}</p>
                <div>
                  <div className="font-semibold text-[#0D1B2A] text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs">{t.course}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANCH LOCATIONS ── */}
      <section className="py-16 px-4 bg-[#0D1B2A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-white text-center mb-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B2B' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Our Branch Locations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6">
              <div className="font-semibold text-white mb-2">Dilsukhnagar Branch</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Flat 109, C.B Eastern Homes, Srinagar Colony, Opposite Chai Vaai Cafe, Dilsukhnagar, Hyderabad – 500060
              </p>
            </div>
            <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6">
              <div className="font-semibold text-white mb-2">Ameerpet Branch</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                #502, Sree Swathi Ankur Building, Besides Aditya Trade Center, Ameerpet, Hyderabad – 500016
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <CallLink number="+918885166007" pageType="static" className="flex items-center gap-2 font-semibold transition-colors" style={{ color: '#FF6B2B' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.08 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              +91 88851 66007
            </CallLink>
            <span className="text-white/30">•</span>
            <CallLink number="+917780727374" pageType="static" className="font-semibold transition-colors" style={{ color: '#FF6B2B' }}>77807 27374</CallLink>
            <span className="text-white/30">•</span>
            <a href="mailto:info@cosscloudsol.com" className="font-semibold transition-colors" style={{ color: '#FF6B2B' }}>info@cosscloudsol.com</a>
          </div>
        </div>
      </section>
    </>
  );
}
