import type { Metadata } from 'next';
import Link from 'next/link';
import EnrollFullForm from '@/components/EnrollFullForm';
import WhatsAppLink from '@/components/WhatsAppLink';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('free-demo-class');
}

const howItWorks = [
  {
    num: '01',
    title: 'Book your slot',
    desc: 'Fill the form. Our counsellor calls within 2 hours to schedule your demo at a time that suits you.',
  },
  {
    num: '02',
    title: 'Attend the demo',
    desc: 'Join a 60-minute live session with a certified trainer. Hands-on labs, real tools, live demonstration.',
  },
  {
    num: '03',
    title: 'Get your roadmap',
    desc: 'After the demo our expert creates a personalised learning path. Zero pressure, no commitment needed.',
  },
];

const whatYouGet = [
  {
    bg: '#FFF7ED', color: '#FF6B2B',
    title: 'Live expert session',
    desc: '60 mins hands-on class with a Microsoft/AWS-certified trainer.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    bg: '#E6FFFA', color: '#0BA5A0',
    title: 'Real tool access',
    desc: 'Live industry tools — AWS Console, Azure, Jenkins & more.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    bg: '#EFF6FF', color: '#2563EB',
    title: 'Course roadmap',
    desc: 'Get a personalised learning path tailored to your goal.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
  },
  {
    bg: '#F3E8FF', color: '#7C3AED',
    title: 'Q&A with trainer',
    desc: 'Ask anything — career switch, salary, syllabus scope.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    bg: '#FFFBEB', color: '#D97706',
    title: 'Placement insights',
    desc: 'See real JDs, salary ranges & companies Coss Cloud Solutions alumni work at.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    bg: '#ECFDF5', color: '#059669',
    title: 'Zero cost',
    desc: 'Completely free — no fees, no hidden charges, no commitment.',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
];

const reviews = [
  {
    name: 'Rahul M.',
    course: 'AWS DevOps',
    text: 'The free demo alone was better than paid classes I tried elsewhere. Got placed in 4 months!',
    rating: 5,
  },
  {
    name: 'Sneha P.',
    course: 'Data Science',
    text: 'I was skeptical about "free demo" but the trainer spent 45 minutes walking through real AWS projects. Enrolled the next day.',
    rating: 5,
  },
  {
    name: 'Kiran T.',
    course: 'Full Stack',
    text: 'The counsellor helped me choose between two courses. No sales pitch — just honest guidance. Great experience.',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Is the demo class really free?',
    a: 'Yes, 100% free. No credit card, no commitment. You just attend, experience the quality, and decide at your own pace.',
  },
  {
    q: 'Online or offline?',
    a: 'Both options are available. You can attend in-person at our Dilsukhnagar or Ameerpet branch, or join via Zoom/Google Meet.',
  },
  {
    q: 'How long is the demo class?',
    a: 'Approximately 60 minutes — 40 min of live training + 20 min open Q&A with the trainer.',
  },
  {
    q: 'Do I need prior experience?',
    a: 'No background knowledge needed. Demo classes are designed for complete beginners as well as working professionals looking to upskill.',
  },
  {
    q: 'When will I get a callback?',
    a: 'Our counsellors typically call within 2 hours of form submission on working days (Mon–Sat, 9 am–7 pm).',
  },
];

export default function FreeDemoClassPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section id="top" className="bg-[#0D1B2A] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 text-xs text-white/50" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span className="mx-2 text-white/30" aria-hidden="true">›</span>
            <span className="text-white/80">Free Demo Class</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* LEFT */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot-pulse inline-block"></span>
                Live sessions available — Book yours today
              </div>

              <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Attend a <span className="text-[#FF6B2B]">Free Demo</span><br />
                Before You Enroll
              </h1>

              <p className="text-slate-400 text-base leading-relaxed mb-8">
                60-minute hands-on session with a certified trainer.
                No slides. No sales pitch. Just real training.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Real tools — AWS Console, Jenkins, Power BI live access',
                  'Personalised career roadmap crafted just for you',
                  'Meet your potential trainer before you commit',
                  'Zero cost — absolutely no commitment required',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-white/[0.08]">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">5,000+</div>
                  <div className="text-slate-500 text-xs">Students trained</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">100%</div>
                  <div className="text-slate-500 text-xs">Free, no catch</div>
                </div>
              </div>
            </div>

            {/* RIGHT — Form card */}
            <div
              className="border border-white/25 rounded-2xl p-6 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <h2 className="font-heading text-lg font-bold text-white mb-1">
                Reserve Your Free Demo Slot
              </h2>
              <p className="text-white/70 text-xs mb-4">
                Fill the form — counsellor calls within 2 hours to schedule.
              </p>

              <div className="ef-glass-ctx">
                <EnrollFullForm />
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#FF6B2B] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">R</div>
                  <div className="w-7 h-7 rounded-full bg-[#0BA5A0] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">S</div>
                  <div className="w-7 h-7 rounded-full bg-[#4D7CFE] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">P</div>
                  <div className="w-7 h-7 rounded-full bg-[#8B5CF6] border-2 border-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center">K</div>
                </div>
                <p className="text-slate-400 text-xs">
                  <span className="text-white font-semibold">5,000+</span> attended this year
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4 bg-[#F0F2F5]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] mb-12">
            How it works — 3 simple steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl border border-black/[0.07] p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0D1B2A] text-white font-heading font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-[#0D1B2A] text-base mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] text-center mb-4">
            What you get in the free demo
          </h2>
          <p className="text-slate-500 text-center text-sm mb-10">
            No slides, no sales pitch — a genuine hands-on session run by certified industry experts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whatYouGet.map((f) => (
              <div key={f.title} className="bg-[#F8FAFC] rounded-2xl border border-black/[0.06] p-6 flex gap-4 items-start">
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
      <section className="py-16 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] text-center mb-10">
            What Students Say After Their Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <div className="text-amber-400 text-base mb-3">{'★'.repeat(r.rating)}</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">&quot;{r.text}&quot;</p>
                <div>
                  <div className="font-semibold text-[#0D1B2A] text-sm">{r.name}</div>
                  <div className="text-slate-400 text-xs">{r.course} Batch</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-[#FF6B2B] text-center mb-3">Common Questions</p>
          <h2 className="font-heading text-2xl font-bold text-[#0D1B2A] text-center mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-center text-sm mb-10">Everything you need to know before booking.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-[#F8FAFC] border border-black/[0.06] rounded-2xl p-5">
                <div className="flex items-start gap-2 mb-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-[#FF6B2B] text-white text-xs font-bold flex items-center justify-center mt-0.5">Q</span>
                  <p className="font-semibold text-[#0D1B2A] text-sm leading-snug">{f.q}</p>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed pl-7">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA STRIP ── */}
      <section className="py-16 px-4 bg-[#FF6B2B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            Your IT career starts with one free class
          </h2>
          <p className="text-white/80 text-base mb-8">
            No fees, no risk, no commitment — just real training that shows you exactly
            what your career could look like.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#top"
              className="bg-white text-[#FF6B2B] font-bold px-8 py-4 rounded-xl text-base hover:bg-orange-50 transition-colors"
            >
              Book My Free Demo Class
            </a>
            <WhatsAppLink
              ctaType="free_demo"
              pageType="static"
              message="Hi Coss Cloud Solutions Team, I'd like to book a free demo class. Could you share the available slots?"
              className="bg-white/15 text-white font-semibold px-8 py-4 rounded-xl text-base border border-white/30 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  );
}
