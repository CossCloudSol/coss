import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { prisma } from '@/lib/db';
import {
  Award,
  BarChart2,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  Clock,
  GraduationCap,
  IndianRupee,
  MessageSquare,
  Monitor,
  Rocket,
  Settings,
  Shield,
  TestTube,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORY_ICONS, DEFAULT_ICON } from '@/lib/category-icons';
import WpImg from '@/components/WpImg';
import HeroEnrollForm from '@/components/HeroEnrollForm';
import { siteImages } from '@/lib/wpImages';

async function getCategories() {
  try {
    return await prisma.courseCategory.findMany({
      where: { status: 'published' },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { courses: { where: { status: 'published' } } } },
      },
    });
  } catch {
    return [];
  }
}

interface Testimonial {
  name: string;
  initials: string;
  role: string;
  stars: number;
  review: string;
  course: string;
  avatarBg: string;
  photoUrl?: string;
}

const testimonials: ReadonlyArray<Testimonial> = [
  {
    name: 'Gopi Krishna',
    initials: 'GK',
    role: 'DevOps Engineer',
    stars: 5,
    review: 'Best institute in Dilsukhnagar with 100% placement assistance. The faculty is experienced and the labs are top-notch. I strongly recommend Coss Cloud Solutions to anyone serious about IT.',
    course: 'DevOps & Cloud',
    avatarBg: 'bg-red-500',
  },
  {
    name: 'Jahnavi S.',
    initials: 'JS',
    role: 'Linux Administrator',
    stars: 5,
    review: 'As someone with minimal Linux exposure, I was hesitant — but Coss made everything easy. Well-structured from fundamentals to advanced topics. Practical sessions really solidified my knowledge.',
    course: 'Linux Administration',
    avatarBg: 'bg-gray-600',
  },
  {
    name: 'Nagoju Uma',
    initials: 'NU',
    role: 'Power BI Analyst',
    stars: 5,
    review: 'Excellent institution with quality teaching and a genuinely supportive learning environment. The trainers go above and beyond. Highly recommended for analytics and BI careers.',
    course: 'Power BI & Analytics',
    avatarBg: 'bg-green-700',
  },
  {
    name: 'Shiva Rani',
    initials: 'SR',
    role: 'Data Science Graduate',
    stars: 5,
    review: 'Well experienced faculty, feasible lab timings, and overall completely satisfied. The course structure is clear and industry-relevant. Thank you Coss — you changed my career trajectory!',
    course: 'Data Science & AI',
    avatarBg: 'bg-purple-500',
  },
];

const blogs = [
  { date: '25 Dec', title: 'SOC Analyst Course Training in Dilsukhnagar Hyderabad',         href: '/blog/soc-analyst-training-hyderabad',                          category: 'Cyber Security',    gradient: 'linear-gradient(135deg,#1a3a5c,#1e5799)' },
  { date: '24 Dec', title: 'Cyber Security Course Training in Dilsukhnagar, Hyderabad',     href: '/blog/cyber-security-training-dilsukhnagar-hyderabad',          category: 'Cyber Security',    gradient: 'linear-gradient(135deg,#0a5260,#0d7a8e)' },
  { date: '04 Dec', title: 'Digital Marketing Course Training in Dilsukhnagar – Hyderabad', href: '/blog/digital-marketing-course-training-dilsukhnagar-hyderabad', category: 'Digital Marketing', gradient: 'linear-gradient(135deg,#5c2a0a,#b0552a)' },
  { date: '25 Nov', title: 'AWS DevOps Multi-Cloud Certification Course in Dilsukhnagar',   href: '/blog/aws-devops-multi-cloud-course-dilsukhnagar',              category: 'Cloud & DevOps',    gradient: 'linear-gradient(135deg,#1a4a2a,#2e7d32)' },
];

/**
 * 22 hiring partners surfaced in the Explore Opportunities section.
 * `logoUrl` is optional — entries without one render the company name as
 * styled text (the cell still keeps its slot in the grid).
 */
interface HiringCompany {
  name: string;
  logoUrl?: string;
}

const HIRING_COMPANIES: ReadonlyArray<HiringCompany> = [
  { name: 'Google', logoUrl: siteImages.companies.google },
  { name: 'CA' },
  { name: 'ADP', logoUrl: siteImages.companies.adp },
  { name: 'Airtel', logoUrl: siteImages.companies.airtel },
  { name: 'NetEnrich' },
  { name: 'Innominds' },
  { name: 'IBM', logoUrl: siteImages.companies.ibm },
  { name: 'HSBC', logoUrl: siteImages.companies.hsbc },
  { name: 'HCL', logoUrl: siteImages.companies.hcl },
  { name: 'Genpact', logoUrl: siteImages.companies.genpact },
  { name: 'Ericsson', logoUrl: siteImages.companies.ericsson },
  { name: 'Bank of America', logoUrl: siteImages.companies.bankofamerica },
  { name: 'AT&T' },
  { name: 'Oracle', logoUrl: siteImages.companies.oracle },
  { name: 'Pramati' },
  { name: 'Qualcomm' },
  { name: 'Sonata Software', logoUrl: siteImages.companies.sonata },
  { name: 'Synopsys', logoUrl: siteImages.companies.synopsys },
  { name: 'TCS', logoUrl: siteImages.companies.tcs },
  { name: 'Tech Mahindra', logoUrl: siteImages.companies.techM },
  { name: 'Wells Fargo', logoUrl: siteImages.companies.wellsfargo },
  { name: 'Wipro', logoUrl: siteImages.companies.wipro },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home');
}

const CORP_FEATURES: Array<{ Icon: LucideIcon; text: string }> = [
  { Icon: Users,         text: 'Highly Caliber and experienced Faculty.' },
  { Icon: Building,      text: 'Special Batches for Hyderabad Corporate Clients.' },
  { Icon: Award,         text: 'Certified instructor led training.' },
  { Icon: Clock,         text: 'Classes at their flexible timings.' },
  { Icon: Settings,      text: 'Customized approach, week end workshops on advanced technologies.' },
  { Icon: MessageSquare, text: 'Informed by in-depth needs analysis and focus-group discussion.' },
];

const CORP_BADGES: Array<{ label: string; Icon: LucideIcon }> = [
  { label: 'SKILLS',        Icon: BookOpen     },
  { label: 'GROWTH',        Icon: Rocket       },
  { label: 'SUCCESS',       Icon: Award        },
  { label: 'TRANSFORMATION',Icon: GraduationCap},
];

const CORP_BOTTOM_BAR: Array<{ Icon: LucideIcon; title: string; desc: string }> = [
  { Icon: Award,  title: 'EXPERT TRAINERS',    desc: 'Industry-leading professionals.'   },
  { Icon: Shield, title: 'PROVEN RESULTS',     desc: 'Impactful training that delivers.' },
  { Icon: Users,  title: 'TAILORED SOLUTIONS', desc: 'Programs designed for your goals.' },
];

const CORP_QR_SRC =
  'https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=https%3A%2F%2Fwa.me%2F918885166007&bgcolor=ffffff&color=083344&margin=4';

export default async function HomePage() {
  const categories = await getCategories();
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section" aria-label="Hero">

        {/* Decorative orbs rendered via CSS classes */}
        <div className="hero-orb-right" aria-hidden="true" />
        <div className="hero-orb-left"  aria-hidden="true" />
        <div className="hero-bg-sweep"  aria-hidden="true" />

        {/* Circuit / tech line traces — valid SVG coordinates only */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.18, zIndex: 0 }}
        >
          <defs>
            <linearGradient id="hg-teal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="hg-orange" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#e47538" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#e47538" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Left-side teal circuit traces */}
          <g stroke="url(#hg-teal)" strokeWidth="1.4" fill="none">
            <polyline points="0,80 90,80 120,50 300,50" />
            <circle cx="300" cy="50" r="4" fill="#4fd1c5" fillOpacity="0.6" stroke="none" />
            <polyline points="0,180 55,180 85,150 210,150 240,120" />
            <circle cx="210" cy="150" r="3" fill="#4fd1c5" fillOpacity="0.5" stroke="none" />
            <polyline points="0,300 42,300 72,270 180,270" />
            <circle cx="180" cy="270" r="3" fill="#4fd1c5" fillOpacity="0.4" stroke="none" />
          </g>
          {/* Right-side orange circuit traces (fixed pixel coords from right edge ~1200px) */}
          <g stroke="url(#hg-orange)" strokeWidth="1.4" fill="none">
            <polyline points="1200,60 1110,60 1080,90 1080,190" />
            <circle cx="1200" cy="60" r="4" fill="#e47538" fillOpacity="0.6" stroke="none" />
            <polyline points="1200,250 1140,250 1110,220 980,220" />
            <circle cx="1200" cy="250" r="3" fill="#e47538" fillOpacity="0.5" stroke="none" />
          </g>
          {/* Hexagonal accent shapes */}
          <g fill="none" strokeWidth="1.2">
            <polygon stroke="#4fd1c5" strokeOpacity="0.25" points="55,28 77,16 99,28 99,52 77,64 55,52" />
            <polygon stroke="#e47538" strokeOpacity="0.2" points="1090,340 1112,328 1134,340 1134,364 1112,376 1090,364" />
          </g>
          {/* Floating accent dots */}
          <circle cx="420" cy="110" r="2.5" fill="#4fd1c5" fillOpacity="0.5" />
          <circle cx="310" cy="290" r="2" fill="#e47538" fillOpacity="0.45" />
          <circle cx="900" cy="80"  r="3" fill="#4fd1c5" fillOpacity="0.3" />
          <circle cx="760" cy="350" r="2" fill="#fff" fillOpacity="0.2" />
        </svg>

        <div className="hero-inner">

          {/* Left: copy + CTAs */}
          <div>
            <div className="hero-badge" role="text">#1 IT Training Institute in Hyderabad</div>

            <h1 className="hero-title">
              Launch Your IT Career —{' '}
              <span>Get Job-Ready in 90 Days</span>
            </h1>

            <p className="hero-desc">
              Join&nbsp;<strong style={{ color: '#ffb07a' }}>5,000+ students</strong> trained by
              Microsoft &amp; AWS certified instructors. Practical labs, real projects, and direct
              placement support with 22+ top IT hiring companies in Hyderabad.
            </p>

            {/* Primary + Secondary CTAs — min 48px tap targets */}
            <div className="hero-btns">
              <Link href="/free-demo-class/" className="btn-primary hero-cta-primary">
                Book a Free Demo Class →
              </Link>
              <a
                href="https://wa.me/918885166007"
                className="btn-outline-dark hero-cta-secondary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Talk to a counselor on WhatsApp"
              >
                {/* WhatsApp icon — inline SVG, no extra package needed */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.554 4.11 1.522 5.836L0 24l6.335-1.499A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 01-5.003-1.365l-.36-.214-3.727.881.936-3.618-.235-.372A9.764 9.764 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.431 0 9.818 4.388 9.818 9.818 0 5.431-4.387 9.818-9.818 9.818z" />
                </svg>
                Talk To Counselor
              </a>
            </div>

            {/* Stats row — 4-col desktop, 2×2 mobile */}
            <div className="hero-stats" aria-label="Quick stats">
              {([
                { Icon: Users,    number: '5000+', label: 'Students Trained' },
                { Icon: BookOpen, number: '30+',   label: 'Courses' },
                { Icon: Award,    number: '100%',  label: 'Placement Support' },
                { Icon: Calendar, number: '15+',   label: 'Years Experience' },
              ] as const).map(({ Icon, number, label }) => (
                <div key={label} className="hero-stat-item">
                  <Icon size={26} className="hero-stat-icon" aria-hidden="true" />
                  <div className="hero-stat-number">{number}</div>
                  <div className="hero-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: enroll form */}
          <div>
            <HeroEnrollForm />
          </div>
        </div>
      </section>

      {/* ── Course Categories ── */}
      <section className="section section-light" aria-label="Course categories">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">30+ Courses Available</div>
            <h2 className="section-title">Build Skills Employers Demand</h2>
            <p className="section-subtitle">
              Industry-focused training in Hyderabad — practical labs, expert trainers, real placement outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const c = cat.color ?? '#0e7490';
              const Icon = CATEGORY_ICONS[cat.slug] ?? DEFAULT_ICON;
              return (
                <article key={cat.slug} className="course-card-v2">
                  <div
                    className="course-card-v2-banner"
                    style={{ background: `linear-gradient(135deg, ${c}cc 0%, ${c} 100%)` }}
                  >
                    <div className="course-card-v2-icon" aria-hidden="true">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div className="course-card-v2-body">
                    <h3 className="course-card-v2-title">{cat.name}</h3>
                    <p className="course-card-v2-desc">{cat.description ?? ''}</p>

                    <div className="course-card-v2-pills">
                      <span className="course-pill">
                        <BookOpen className="w-3 h-3" aria-hidden="true" />
                        {cat._count.courses} Courses
                      </span>
                    </div>

                    <Link
                      href={`/courses/${cat.slug}/`}
                      className="course-card-v2-cta"
                      style={{ background: c }}
                    >
                      Explore Courses →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="center-btn">
            <Link href="/courses/" className="btn-primary" style={{ display: 'inline-flex' }}>
              View All 30+ Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── Corporate Training (homepage section) ── */}
      <section className="py-16 px-4 md:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #061c26 0%, #083344 55%, #0a3d4f 100%)' }}>

        {/* Section-level decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.12), transparent 70%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(228,117,56,0.10), transparent 70%)' }} />
          {/* Subtle dot-grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="corp-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1.2" fill="#4fd1c5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#corp-dots)" />
          </svg>
        </div>

        <div className="max-w-[1100px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-[52%_44%] gap-10 items-center">

            {/* ── LEFT — Professional illustrated card ── */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ border: '1px solid rgba(79,209,197,0.22)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}
            >
              {/* Visual area — CSS/SVG background, no external image */}
              <div
                className="relative overflow-hidden flex flex-col justify-between p-6"
                style={{
                  minHeight: '340px',
                  background: 'linear-gradient(135deg, #071e28 0%, #0c3a4c 55%, #0e4d63 100%)',
                }}
              >
                {/* Decorative circuit-style SVG */}
                <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="cg" width="48" height="48" patternUnits="userSpaceOnUse">
                      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#4fd1c5" strokeWidth="0.6" strokeOpacity="0.12"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cg)" />
                  {/* Circuit traces */}
                  <g stroke="#4fd1c5" strokeWidth="1.5" strokeOpacity="0.18" fill="none">
                    <polyline points="0,80 60,80 80,60 200,60" />
                    <polyline points="200,60 200,30 260,30" />
                    <circle cx="200" cy="60" r="3" fill="#4fd1c5" fillOpacity="0.3" strokeOpacity="0" />
                    <polyline points="0,160 40,160 60,140 160,140 180,120" />
                    <circle cx="160" cy="140" r="3" fill="#4fd1c5" fillOpacity="0.3" strokeOpacity="0" />
                  </g>
                  {/* Bottom-right circuit */}
                  <g stroke="#e47538" strokeWidth="1.5" strokeOpacity="0.15" fill="none">
                    <polyline points="500,320 420,320 400,300 400,260" />
                  </g>
                  {/* Decorative hexagons */}
                  <g fill="none" stroke="#4fd1c5" strokeOpacity="0.1" strokeWidth="1">
                    <polygon points="320,20 340,8 360,20 360,44 340,56 320,44" />
                    <polygon points="280,180 300,168 320,180 320,204 300,216 280,204" />
                  </g>
                </svg>

                {/* Teal glow orb top-right */}
                <div aria-hidden="true" className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.18), transparent 70%)' }} />
                {/* Orange glow orb bottom-left */}
                <div aria-hidden="true" className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(228,117,56,0.15), transparent 70%)' }} />

                {/* Top row: label + logo */}
                <div className="relative flex items-start justify-between z-10">
                  <div
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(228,117,56,0.15)', border: '1px solid rgba(228,117,56,0.35)', color: '#e47538' }}
                  >
                    <Building className="w-3 h-3" aria-hidden="true" />
                    Corporate Programs
                  </div>
                  <WpImg
                    src={siteImages.logo}
                    alt="Coss Cloud Solutions"
                    style={{
                      height: '36px',
                      width: 'auto',
                      objectFit: 'contain',
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                    }}
                  />
                </div>

                {/* Headline */}
                <div className="relative z-10 mt-5">
                  <p
                    className="font-extrabold leading-tight text-white"
                    style={{ fontSize: 'clamp(22px, 3vw, 32px)', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                  >
                    BUILDING SKILLS.<br />
                    <span style={{ color: '#4fd1c5' }}>DRIVING SUCCESS.</span>
                  </p>
                  <div className="mt-2 h-0.5 w-16 rounded-full" style={{ background: 'linear-gradient(to right, #e47538, transparent)' }} />
                </div>

                {/* Badge pills */}
                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                  {CORP_BADGES.map(({ label, Icon }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                      style={{ background: 'rgba(79,209,197,0.12)', border: '1px solid rgba(79,209,197,0.3)' }}
                    >
                      <Icon className="w-3 h-3" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                      {label}
                    </span>
                  ))}
                </div>

                {/* QR code */}
                <div className="relative z-10 mt-5">
                  <div className="inline-flex flex-col items-center rounded-2xl px-4 py-3" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CORP_QR_SRC} alt="Scan QR to WhatsApp" width={96} height={96} loading="lazy" />
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#25D366" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="text-xs font-bold" style={{ color: '#083344' }}>Scan to WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar — 3 stat columns */}
              <div
                className="grid grid-cols-3"
                style={{ background: '#05202e', borderTop: '1px solid rgba(79,209,197,0.18)' }}
              >
                {CORP_BOTTOM_BAR.map(({ Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="p-3 text-center"
                    style={i < 2 ? { borderRight: '1px solid rgba(79,209,197,0.15)' } : undefined}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                    <p className="text-white font-bold text-xs mb-0.5">{title}</p>
                    <p className="text-xs" style={{ color: '#94a3b8', lineHeight: '1.4' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT — Text Content ── */}
            <div className="flex flex-col justify-center">
              <h2 className="font-extrabold text-white" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>
                Corporate Training
              </h2>

              {/* Orange divider */}
              <div className="h-1 w-14 rounded-full mt-3 mb-3" style={{ background: '#e47538' }} />

              {/* Subheading */}
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#e47538', letterSpacing: '0.12em' }}>
                Transform Your Workforce Skills
              </p>

              {/* Body copy */}
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#b0cdd6' }}>
                We deliver top-quality training programs meeting client
                organization requirements. Excellent corporate trainers in
                current IT industry within limited budgets.
              </p>

              {/* Features grid — 6 items, 2 cols */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {CORP_FEATURES.map(({ Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{ background: '#0f4a5c', border: '1px solid rgba(79,209,197,0.2)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#4fd1c5' }} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold leading-snug" style={{ color: '#d1e8ee' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href="/corporate-training/"
                className="inline-flex items-center justify-center font-bold uppercase tracking-wide rounded-xl mt-7 px-7 py-3 transition-opacity hover:opacity-90"
                style={{ background: '#f5a623', color: '#1a1a2e', width: 'fit-content' }}
              >
                <BarChart2 className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                Start Your Career Today
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="wcu-section" aria-label="Why choose us" id="why-choose-us">
        {/* Decorative backgrounds */}
        <div className="wcu-dot-grid" aria-hidden="true" />
        <div className="wcu-wave" aria-hidden="true" />

        <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Header ── */}
          <div className="section-header">
            <div className="section-tag">WHY CHOOSE US</div>
            <h2 className="wcu-heading">
              Everything You Need to{' '}
              <span style={{ color: 'var(--primary)' }}>Succeed</span> in IT
            </h2>
            <p className="section-subtitle">
              Expert instruction, hands-on labs, and end-to-end career support — all under one roof
            </p>
          </div>

          {/* ── Stats Bar ── */}
          <div className="wcu-stats-bar">
            {[
              { Icon: Users,     number: '5,000+', label: 'Students Trained'     },
              { Icon: Briefcase, number: '200+',   label: 'Hiring Partners'      },
              { Icon: Award,     number: '100%',   label: 'Placement Assistance' },
              { Icon: Shield,    number: '15+',    label: 'Years Experience'     },
            ].map(({ Icon, number, label }, i) => (
              <div key={label} className="wcu-stat-item">
                {i > 0 && <div className="wcu-stat-divider" aria-hidden="true" />}
                <div className="wcu-stat-icon-wrap" aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="wcu-stat-number">{number}</div>
                  <div className="wcu-stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Feature Cards ── */}
          <div className="wcu-cards-layout">

            {/* Left — tall featured card */}
            <div className="wcu-featured-card">
              <div className="wcu-feat-icon-wrap" aria-hidden="true">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="wcu-feat-illustration" aria-hidden="true">
                <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="wcu-feat-svg">
                  <rect x="20" y="40" width="140" height="85" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <rect x="28" y="50" width="124" height="12" rx="3" fill="rgba(255,255,255,0.18)"/>
                  <rect x="28" y="68" width="56" height="32" rx="4" fill="rgba(228,117,56,0.5)"/>
                  <rect x="92" y="68" width="60" height="14" rx="3" fill="rgba(255,255,255,0.15)"/>
                  <rect x="92" y="86" width="40" height="14" rx="3" fill="rgba(255,255,255,0.10)"/>
                  <rect x="28" y="107" width="124" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
                  <polygon points="90,8 130,26 90,44 50,26" fill="rgba(255,255,255,0.9)"/>
                  <rect x="122" y="26" width="3" height="18" rx="1.5" fill="rgba(255,255,255,0.7)"/>
                  <ellipse cx="123.5" cy="45" rx="5" ry="4" fill="var(--primary)"/>
                  <path d="M70 35 Q90 44 110 35" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <h3 className="wcu-feat-title">Expert Trainers</h3>
              <div className="wcu-orange-bar" aria-hidden="true" />
              <p className="wcu-feat-desc">
                Learn from certified professionals with real-world experience in top IT companies.
              </p>
              <Link href="/courses/" className="wcu-feat-cta">
                Learn from the Best →
              </Link>
            </div>

            {/* Right — 2×2 + 1 grid */}
            <div className="wcu-right-grid">
              {([
                { Icon: Monitor,      WaterIcon: TestTube,  title: 'Hands-On Labs',        desc: 'Train on real-time projects using industry-standard tools — live lab access included in every course.' },
                { Icon: Calendar,     WaterIcon: Clock,     title: 'Flexible Batches',      desc: 'Weekday, weekend, morning, and evening options — learn without disrupting your current schedule.' },
                { Icon: IndianRupee,  WaterIcon: Briefcase, title: 'Affordable Fees + EMI', desc: 'Premium-quality training at accessible prices, with easy EMI options available.' },
                { Icon: Award,        WaterIcon: Shield,    title: 'Industry Certifications', desc: 'Earn globally recognised AWS, Azure, Google Cloud, and other certifications.' },
                { Icon: Briefcase,    WaterIcon: Users,     title: '100% Placement Support', desc: 'Resume building, mock interviews, and direct connections with 200+ top IT hiring companies.' },
              ] as const).map(({ Icon, WaterIcon, title, desc }) => (
                <div key={title} className="wcu-small-card">
                  <div className="wcu-small-icon-wrap" aria-hidden="true">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="wcu-small-title">{title}</h4>
                  <div className="wcu-orange-bar" aria-hidden="true" />
                  <p className="wcu-small-desc">{desc}</p>
                  <WaterIcon className="wcu-watermark" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom Banner ── */}
          <div className="wcu-banner">
            <div className="wcu-banner-left">
              <div className="wcu-banner-rocket" aria-hidden="true">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="wcu-banner-title">Start Your Career Transformation Today</p>
                <p className="wcu-banner-sub">
                  Get the skills, confidence, and support you need to build a successful IT career.
                </p>
              </div>
            </div>
            <div className="wcu-banner-btns">
              <Link href="/courses/" className="wcu-banner-btn-primary">
                Explore Courses →
              </Link>
              <Link href="/contact-us/" className="wcu-banner-btn-outline">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Talk to Counselor
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Explore Opportunities ── */}
      <section
        className="py-20 px-4 md:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0d2237 55%, #091520 100%)' }}
        aria-label="Hiring partners"
      >
        {/* Decorative glows + dot-grid */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-48 left-1/4 w-[480px] h-[480px] rounded-full opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #14b8a6, transparent 70%)' }} />
          <div className="absolute -bottom-48 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="opp-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1.2" fill="#14b8a6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#opp-dots)" />
          </svg>
        </div>

        <div className="max-w-[1100px] mx-auto relative">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.28)', color: '#2dd4bf' }}
            >
              <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
              200+ Hiring Partners
            </div>
            <h2 className="font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>
              Our Graduates Get Hired at{' '}
              <span style={{ color: '#2dd4bf' }}>Top Companies</span>
            </h2>
            <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: '#94a3b8' }}>
              From resume prep to mock interviews — we connect you directly with recruiters.
              5,000+ alumni now work at companies like these.
            </p>
          </div>

          {/* ── Trust stats row ── */}
          <div
            className="grid grid-cols-3 max-w-xl mx-auto mb-10 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {([
              { value: '200+',  label: 'Hiring Partners',    color: '#2dd4bf' },
              { value: '5,000+', label: 'Students Placed',   color: '#fff'    },
              { value: '100%',  label: 'Placement Support',  color: '#fb923c' },
            ] as const).map(({ value, label, color }, i) => (
              <div
                key={label}
                className="py-4 text-center"
                style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,0.08)' } : undefined}
              >
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Logo grid — white cards on dark bg so original logo colours show ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {HIRING_COMPANIES.map((company) => (
              <div
                key={company.name}
                title={company.name}
                className="flex items-center justify-center h-[76px] px-4 rounded-xl bg-white transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}
              >
                {company.logoUrl !== undefined ? (
                  <WpImg
                    src={company.logoUrl}
                    alt={company.name}
                    style={{
                      maxHeight: '40px',
                      width: 'auto',
                      maxWidth: '108px',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-center text-gray-700">
                    {company.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Conversion CTA ── */}
          <div className="mt-12 text-center">
            <p className="text-sm mb-5" style={{ color: '#64748b' }}>
              Ready to land your name on this list?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/free-demo-class/"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #e47538 0%, #f5a623 100%)', color: '#fff', boxShadow: '0 4px 20px rgba(228,117,56,0.4)' }}
              >
                <Rocket className="w-4 h-4" aria-hidden="true" />
                Start Your IT Career — Book Free Demo Class
              </Link>
              <Link
                href="/placements/"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-4 font-semibold text-sm transition-all hover:bg-white/10"
                style={{ color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }}
              >
                View Placement Stories →
              </Link>
            </div>
            <p className="text-xs mt-4" style={{ color: '#475569' }}>
              No fees · No commitment · Just one free class
            </p>
          </div>

        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section section-light" aria-label="Student testimonials">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Student Reviews</div>
            <h2 className="section-title">What Our Students Say</h2>
            <div className="w-24 h-0.5 bg-teal-500 mx-auto mt-3 mb-3" aria-hidden="true" />
            {/* Aggregate rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="css-stars" aria-label="5 out of 5 stars" role="img">★★★★★</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>4.9 / 5 — 200+ Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <article key={t.name} className="testimonial-card-v2" aria-label={`Review by ${t.name}`}>
                {/* Header */}
                <div className="testimonial-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {t.photoUrl !== undefined ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photoUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className={`${t.avatarBg} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`} aria-hidden="true">
                        {t.initials}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.role}</p>
                    </div>
                  </div>
                  {/* Google G */}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>

                {/* CSS-only star rating */}
                <div className="css-stars" style={{ marginTop: '12px' }} aria-label={`${t.stars} out of 5 stars`} role="img">
                  {'★'.repeat(t.stars)}
                </div>

                <p className="testimonial-text">&quot;{t.review}&quot;</p>

                <span className="testimonial-course-badge">{t.course}</span>
              </article>
            ))}
          </div>

          <div className="center-btn">
            <Link href="/student-reviews/" style={{ color: 'var(--primary)', fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '14px', border: '2px solid var(--primary)', padding: '11px 26px', borderRadius: '6px', display: 'inline-block' }}>
              Read All Reviews →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Blog / Resources ── */}
      <section className="section section-white" aria-label="Latest blog posts">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Resources</div>
            <h2 className="section-title">Latest From Our Blog</h2>
            <p className="section-subtitle">
              Expert insights, course guides, and career tips from the Coss team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {blogs.map((post) => {
              const [day, mon] = post.date.split(' ');
              return (
                <Link key={post.href} href={post.href} className="blog-card">
                  <div className="blog-card-img" style={{ background: post.gradient }}>
                    <div className="blog-date-badge" aria-label={post.date}>
                      <span className="blog-date-day">{day}</span>
                      <span className="blog-date-mon">{mon.toUpperCase()}</span>
                    </div>
                    <p className="blog-card-brand">Coss Cloud Solutions</p>
                    <h3 className="blog-card-img-title">{post.title}</h3>
                    <span className="blog-card-pill">{post.category}</span>
                  </div>
                  <div className="blog-card-body">
                    <h3>{post.title}</h3>
                    <span className="blog-read-more">Read More →</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="center-btn">
            <Link href="/blog/" className="btn-primary" style={{ display: 'inline-flex' }}>
              View All Posts
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
