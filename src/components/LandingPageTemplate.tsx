'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LandingPageCourse, safeParseJson } from '@/lib/get-landing-page-data'
import { BranchSettings } from '@/lib/get-branch-settings'
import { sanitizeDescription } from '@/lib/sanitizeDescription'
import type { RelatedCourseItem } from '@/lib/related-courses'
import LandingEnrollForm from '@/components/LandingEnrollForm'
import RelatedCourses from '@/components/RelatedCourses'

interface HiringPartner {
  id: string
  name: string
  logoUrl: string
  altText: string
  website: string
}

export interface FlatSiblingLink {
  slug: string
  title: string
  href: string
}

interface Props {
  course: LandingPageCourse
  branches: BranchSettings[]
  pageSlug: string
  related: RelatedCourseItem[]
  siblings: FlatSiblingLink[]
}

function getSalaryRoles(category: string): Array<{ role: string; salary: string; tiIcon: string; expNote: string }> {
  const cat = category.toLowerCase()
  if (cat.includes('devops')) return [
    { role: 'DevOps Engineer', salary: '₹6–18 LPA', tiIcon: 'ti-settings-automation', expNote: '2–5 yrs exp' },
    { role: 'Cloud DevOps Architect', salary: '₹12–30 LPA', tiIcon: 'ti-settings-automation', expNote: '5–8 yrs exp' },
    { role: 'SRE / Platform Engineer', salary: '₹10–25 LPA', tiIcon: 'ti-settings-automation', expNote: '3–6 yrs exp' },
    { role: 'Release Manager', salary: '₹8–20 LPA', tiIcon: 'ti-briefcase', expNote: '4–7 yrs exp' },
  ]
  if (cat.includes('azure') || cat.includes('aws') || cat.includes('cloud')) return [
    { role: 'Cloud Engineer', salary: '₹6–20 LPA', tiIcon: 'ti-settings-automation', expNote: '2–5 yrs exp' },
    { role: 'Solutions Architect', salary: '₹15–40 LPA', tiIcon: 'ti-settings-automation', expNote: '6–10 yrs exp' },
    { role: 'Cloud Consultant', salary: '₹10–25 LPA', tiIcon: 'ti-briefcase', expNote: '4–7 yrs exp' },
    { role: 'Cloud Administrator', salary: '₹5–15 LPA', tiIcon: 'ti-settings-automation', expNote: '1–3 yrs exp' },
  ]
  if (cat.includes('data') || cat.includes('analytics') || cat.includes('bi')) return [
    { role: 'Data Analyst', salary: '₹5–15 LPA', tiIcon: 'ti-chart-bar', expNote: '1–3 yrs exp' },
    { role: 'Data Engineer', salary: '₹8–25 LPA', tiIcon: 'ti-chart-bar', expNote: '3–6 yrs exp' },
    { role: 'BI Developer', salary: '₹6–18 LPA', tiIcon: 'ti-chart-bar', expNote: '2–5 yrs exp' },
    { role: 'Data Scientist', salary: '₹10–30 LPA', tiIcon: 'ti-brain', expNote: '3–7 yrs exp' },
  ]
  if (cat.includes('python') || cat.includes('full stack') || cat.includes('java')) return [
    { role: 'Backend Developer', salary: '₹5–18 LPA', tiIcon: 'ti-code', expNote: '1–4 yrs exp' },
    { role: 'Full Stack Developer', salary: '₹6–22 LPA', tiIcon: 'ti-code', expNote: '2–5 yrs exp' },
    { role: 'Software Engineer', salary: '₹8–25 LPA', tiIcon: 'ti-code', expNote: '3–6 yrs exp' },
    { role: 'Tech Lead', salary: '₹15–35 LPA', tiIcon: 'ti-code', expNote: '6–10 yrs exp' },
  ]
  if (cat.includes('cyber') || cat.includes('security')) return [
    { role: 'Security Analyst', salary: '₹6–18 LPA', tiIcon: 'ti-shield-lock', expNote: '2–5 yrs exp' },
    { role: 'Ethical Hacker', salary: '₹8–22 LPA', tiIcon: 'ti-shield-lock', expNote: '3–6 yrs exp' },
    { role: 'SOC Analyst', salary: '₹5–15 LPA', tiIcon: 'ti-shield-lock', expNote: '1–4 yrs exp' },
    { role: 'Security Architect', salary: '₹20–50 LPA', tiIcon: 'ti-shield-lock', expNote: '8–12 yrs exp' },
  ]
  return [
    { role: `${category} Analyst`, salary: '₹4–12 LPA', tiIcon: 'ti-briefcase', expNote: '1–3 yrs exp' },
    { role: `${category} Engineer`, salary: '₹6–18 LPA', tiIcon: 'ti-briefcase', expNote: '2–5 yrs exp' },
    { role: `Senior ${category}`, salary: '₹12–25 LPA', tiIcon: 'ti-briefcase', expNote: '5–8 yrs exp' },
    { role: `${category} Consultant`, salary: '₹10–22 LPA', tiIcon: 'ti-briefcase', expNote: '4–7 yrs exp' },
  ]
}

const CheckIcon = () => (
  <svg className="h-3.5 w-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const PhoneIcon = ({ cls }: { cls?: string }) => (
  <svg className={cls ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const WaIcon = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cls ?? 'h-4 w-4'} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function LandingPageTemplate({ course, branches, pageSlug: _pageSlug, related, siblings }: Props) {
  const [hiringPartners, setHiringPartners] = useState<HiringPartner[]>([])

  useEffect(() => {
    fetch('/api/hiring-partners')
      .then(r => r.json())
      .then(setHiringPartners)
      .catch(console.error)
  }, [])

  type ModuleRaw = { module?: string; title?: string; topics?: string[] }
  const syllabusRaw = safeParseJson<ModuleRaw[]>(course.syllabus, [])
  const curriculum =
    syllabusRaw.length > 0
      ? syllabusRaw.map(m => ({ title: m.module ?? m.title ?? 'Module', topics: m.topics ?? [] }))
      : [
          { title: 'Fundamentals & Core Concepts', topics: ['Introduction & overview', 'Core principles', 'Hands-on setup'] },
          { title: 'Intermediate Techniques', topics: ['Real-world applications', 'Best practices', 'Industry tools'] },
          { title: 'Advanced Implementation', topics: ['Production workflows', 'Performance optimization', 'Project work'] },
          { title: 'Capstone Project', topics: ['End-to-end project', 'Deployment', 'Portfolio ready'] },
        ]

  const dilsukhnagar = branches.find(b => b.branchKey === 'dilsukhnagar')
  const ameerpet = branches.find(b => b.branchKey === 'ameerpet')

  const phone1 = dilsukhnagar?.phone ?? '+91 88851 66007'
  const phone2 = ameerpet?.phone ?? '+91 88851 66007'
  const wa1 = `https://wa.me/${phone1.replace(/\D/g, '')}`

  const h1 = `${course.title} in Hyderabad`
  const categoryName = course.courseCategory?.name ?? course.category
  const titleWithoutTraining = course.title.replace(/\s*Training$/i, '').replace(/\s*Course$/i, '')
  const desc = sanitizeDescription(course.excerpt || course.description)
  const tags = course.tools.slice(0, 5)
  const salaryRoles = getSalaryRoles(categoryName)

  const serviceAreas = [
    ...(dilsukhnagar?.serviceAreas ?? ['Dilsukhnagar', 'LB Nagar', 'Kothapet', 'Nagole']),
    ...(ameerpet?.serviceAreas ?? ['Ameerpet', 'Punjagutta', 'SR Nagar', 'Begumpet']),
  ].slice(0, 6)

  const faqItems = [
    { q: `Who can join the ${course.title} course?`, a: 'This course is open to graduates, working professionals, and career changers. Basic computer knowledge is sufficient for most batches.' },
    { q: `Do you provide placement support after ${titleWithoutTraining} training?`, a: 'Yes. Coss Cloud Solutions provides 100% placement assistance including resume building, LinkedIn optimization, mock interviews, and job referrals to our partner companies in Hyderabad.' },
    { q: `Is the ${course.title} course available online and offline in Hyderabad?`, a: 'Yes. We offer both classroom training at our Dilsukhnagar and Ameerpet centres, and live online training. Students can switch between modes as needed.' },
    { q: `What is the duration of the ${course.title} course?`, a: `The course duration is typically ${course.duration || '3 months'}, with weekday and weekend batch options available.` },
    { q: `Will I get a certificate after completing ${titleWithoutTraining} training?`, a: 'Yes. You will receive a Coss Cloud Solutions course completion certificate. We also prepare you for relevant industry certification exams.' },
    { q: `What is the fee for the ${course.title} course?`, a: `We offer flexible payment options including EMI. Contact our counsellors at ${phone1} for the latest fee structure and available scholarships.` },
    { q: `Is there any prior experience needed for ${course.title}?`, a: 'No prior experience is required for most batches. Our curriculum is designed to take you from the fundamentals to advanced concepts with hands-on projects.' },
    { q: `How many students are placed after ${titleWithoutTraining} training at Coss?`, a: 'We provide 100% placement support to all our graduates. Our students have secured employment at TCS, Infosys, Wipro, Accenture, HCL, and Cognizant.' },
    { q: `Do you offer weekend batches for ${course.title} in Hyderabad?`, a: 'Yes. Weekend batches (Sat–Sun) are available at both Dilsukhnagar and Ameerpet, designed specifically for working professionals.' },
    { q: `Which companies hire ${course.title} professionals in Hyderabad?`, a: 'Top hiring companies include TCS, Infosys, Wipro, Accenture, Capgemini, Tech Mahindra, HCL, Amazon, Microsoft, and numerous MNCs and startups.' },
  ]

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${titleWithoutTraining} Training in Hyderabad`,
    description: desc,
    provider: { '@type': 'Organization', name: 'Coss Cloud Solutions', sameAs: 'https://www.cosscloudsol.com' },
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Blended',
        location: {
          '@type': 'Place',
          name: 'Coss Cloud Solutions Dilsukhnagar',
          address: { '@type': 'PostalAddress', streetAddress: dilsukhnagar?.addressLine1 ?? 'Flat 109, CB Eastern Homes, Kamala Nagar', addressLocality: 'Dilsukhnagar', addressRegion: 'Telangana', postalCode: dilsukhnagar?.pincode ?? '500060', addressCountry: 'IN' },
        },
      },
      {
        '@type': 'CourseInstance',
        courseMode: 'Blended',
        location: {
          '@type': 'Place',
          name: 'Coss Cloud Solutions Ameerpet',
          address: { '@type': 'PostalAddress', streetAddress: ameerpet?.addressLine1 ?? '#502, Sree Swathi Ankur Building', addressLocality: 'Ameerpet', addressRegion: 'Telangana', postalCode: ameerpet?.pincode ?? '500016', addressCountry: 'IN' },
        },
      },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.slice(0, 5).map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const projectCards =
    course.highlights.length >= 4
      ? course.highlights.slice(0, 4)
      : [
          `Build a production-ready ${course.title} pipeline`,
          'Deploy & monitor in a live cloud environment',
          'Automate workflows with industry-standard tooling',
          'Capstone: end-to-end enterprise project',
        ]

  const testimonials = [
    { quote: `I joined Coss's ${course.title} batch in Dilsukhnagar after 4 years in BPO. Got placed at TCS within 2 months of completing the course. The trainers are real industry professionals, not just textbook teachers.`, name: 'Rohit K.', role: 'Engineer, TCS', initials: 'RK', batch: 'Dilsukhnagar', companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg', companyName: 'TCS' },
    { quote: `The ${titleWithoutTraining} training at Coss Ameerpet was exactly what I needed. Got 3 offers within 6 weeks of the placement drives. The practical projects made all the difference in interviews.`, name: 'Priya M.', role: 'Cloud Engineer, Accenture', initials: 'PM', batch: 'Ameerpet', companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg', companyName: 'Accenture' },
    { quote: `I was skeptical about the placement promise but Coss delivered. 3 months after completing ${course.title}, I'm earning 2× my previous salary at Wipro. Best investment I've made in my career.`, name: 'Sai T.', role: 'Senior Engineer, Wipro', initials: 'ST', batch: 'Dilsukhnagar', companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg', companyName: 'Wipro' },
  ]

  const locationData = [
    {
      branchObj: dilsukhnagar,
      fallbackName: 'Coss Cloud Solutions — Dilsukhnagar',
      fallbackAddr1: 'Flat 109, CB Eastern Homes, Kamala Nagar',
      fallbackAddr2: 'Dilsukhnagar, Hyderabad – 500060',
      fallbackPhone: phone1,
    },
    {
      branchObj: ameerpet,
      fallbackName: 'Coss Cloud Solutions — Ameerpet',
      fallbackAddr1: '#502, Sree Swathi Ankur Building',
      fallbackAddr2: 'Besides Aditya Trade Center, Ameerpet, Hyderabad – 500016',
      fallbackPhone: phone2,
    },
  ]

  const salaryIcons = [
    <svg key="gear" className="text-orange-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    <svg key="cloud" className="text-orange-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    <svg key="server" className="text-orange-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    <svg key="branch" className="text-orange-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  ]

  return (
    <div>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="pt-10 pb-0" style={{ background: 'linear-gradient(135deg, #012530 0%, #021e2b 60%, #011820 100%)' }}>
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-[0.1em]">
              ★ Hyderabad&apos;s #1 {categoryName} Institute
            </div>
            <h1 className="font-black text-white leading-[1.08] tracking-tight mb-4">
              <span className="block text-5xl md:text-6xl lg:text-7xl">
                {titleWithoutTraining}
              </span>
              <span className="block text-3xl md:text-4xl font-extrabold mt-2">
                Training in{' '}
                <span className="text-orange-400">Hyderabad</span>
              </span>
            </h1>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map(tag => (
                  <span key={tag} className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 max-w-xl font-medium">{desc}</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
              {[
                'Live instructor-led classes',
                'Hands-on real-time projects',
                '100% placement support',
                `${course.level || 'All levels'} level`,
                `${course.duration || '3 months'} duration`,
                'Lifetime LMS access',
              ].map(chip => (
                <div key={chip} className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </span>
                  {chip}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:sticky lg:top-20 self-start">
            <LandingEnrollForm courseTitle={course.title} duration={course.duration} level={course.level} phone1={phone1} />
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 mt-8 pb-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-4 text-center">
              <strong className="block text-3xl md:text-4xl font-black text-orange-400 leading-none">5,000+</strong>
              <span className="text-xs text-slate-400 font-medium mt-2 block">Students Trained</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-4 text-center">
              <strong className="block text-3xl md:text-4xl font-black text-orange-400 leading-none">100%</strong>
              <span className="text-xs text-slate-400 font-medium mt-2 block">Placement Support</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-4 text-center">
              <strong className="block text-3xl md:text-4xl font-black text-orange-400 leading-none">15+</strong>
              <span className="text-xs text-slate-400 font-medium mt-2 block">Real Projects</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-4 text-center">
              <strong className="block text-3xl md:text-4xl font-black text-orange-400 leading-none">15 Yrs</strong>
              <span className="text-xs text-slate-400 font-medium mt-2 block">In Hyderabad</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: TRUST BAR ────────────────────────────────────────── */}
      <div className="py-10 md:py-14 px-4 md:px-8 bg-white dark:bg-[#0d1b2e] border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">
              Placement network
            </p>
            <h2 className="text-2xl font-semibold mb-2">
              Our hiring partners
            </h2>
            <p className="text-sm text-gray-500">
              500+ students placed across India&apos;s top companies
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border border-gray-200 rounded-xl overflow-hidden bg-white">
            {hiringPartners.map((p, i, all) => {
              const total = all.length
              const isLastColMobile  = (i + 1) % 2 === 0
              const isLastColTablet  = (i + 1) % 3 === 0
              const isLastColDesktop = (i + 1) % 5 === 0
              const lastRowStartMobile  = total - (total % 2 || 2)
              const lastRowStartTablet  = total - (total % 3 || 3)
              const lastRowStartDesktop = total - (total % 5 || 5)
              const isLastRowMobile  = i >= lastRowStartMobile
              const isLastRowTablet  = i >= lastRowStartTablet
              const isLastRowDesktop = i >= lastRowStartDesktop
              return (
                <div
                  key={p.id}
                  className={[
                    'flex items-center justify-center p-5 min-h-[80px] bg-white hover:bg-gray-50 transition-colors',
                    'border-r border-b border-gray-200',
                    isLastColMobile  ? 'border-r-0'    : '',
                    isLastColTablet  ? 'sm:border-r-0' : 'sm:border-r',
                    isLastColDesktop ? 'md:border-r-0' : 'md:border-r',
                    isLastRowMobile  ? 'border-b-0'    : '',
                    isLastRowTablet  ? 'sm:border-b-0' : 'sm:border-b',
                    isLastRowDesktop ? 'md:border-b-0' : 'md:border-b',
                  ].filter(Boolean).join(' ')}
                >
                  {p.logoUrl ? (
                    <img
                      src={p.logoUrl}
                      alt={p.altText || p.name}
                      className="max-h-10 max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-500 text-center leading-tight">
                      {p.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent dark:via-orange-900/30" />

      {/* ── SECTION 3: SALARY ───────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-800 py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">High demand · High paying careers</p>
            <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3" />
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {categoryName} Professionals Are in High Demand
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              India&apos;s top companies are aggressively hiring certified {titleWithoutTraining} professionals.
              Skilled talent with hands-on experience commands salaries well above the industry average —
              making this one of the most rewarding career investments you can make in 2025.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Banking & BFSI', 'Healthcare IT', 'E-commerce', 'FinTech', 'Telecom', 'SaaS'].map(tag => (
                <span key={tag} className="rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-400">{tag}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {salaryRoles.map((role, idx) => (
              <div key={role.role} className="relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 text-center overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:border-orange-300 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-2xl" />
                <div className="w-14 h-14 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                  {salaryIcons[idx % 4]}
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2">{role.role}</div>
                <div className="inline-block bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-black text-xl px-4 py-2 rounded-xl">{role.salary}</div>
                <div className="text-xs text-slate-400 mt-2">{role.expNote}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent dark:via-orange-900/30" />

      {/* ── SECTION 4: WHY COSS ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">Why Choose Us</p>
          <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Why Choose Coss Cloud Solutions for {titleWithoutTraining}?
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-10">Hyderabad&apos;s most trusted IT training institute since 2010</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {([
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>,
                title: 'Expert Trainers',
                body: 'Industry professionals with 10+ years of hands-on experience — not just academic instructors.',
              },
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
                title: 'Hands-On Projects',
                body: 'Work on enterprise-level real projects you can showcase in interviews and on your resume.',
              },
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>,
                title: '100% Placement',
                body: 'Resume review, mock interviews, LinkedIn optimization, and direct referrals to our partner companies.',
              },
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>,
                title: 'Flexible Batches',
                body: 'Weekday and weekend batches at both Dilsukhnagar and Ameerpet. Switch between modes anytime.',
              },
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" /></svg>,
                title: 'Lifetime LMS',
                body: 'All class recordings, notes, code repos, and updated resources — available forever at no extra cost.',
              },
              {
                svg: <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
                title: 'Small Batches',
                body: 'Maximum 20 students per batch so every student gets personal attention and direct trainer access.',
              },
            ] as { svg: React.JSX.Element; title: string; body: string }[]).map((card, index) => (
              <div key={card.title} className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center flex flex-col items-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700">
                <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[11px] font-black text-orange-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-4 flex-shrink-0">
                  {card.svg}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS STRIP ─────────────────────────────────────────────────── */}
      <section className="py-10 md:py-12 px-4 md:px-8 bg-[#0d1b2e] border-y border-slate-700">
        <div className="max-w-[1200px] mx-auto">

          <div className="text-center mb-8">
            <span className="text-xs font-black tracking-[0.12em] uppercase text-orange-500">
              Industry-standard tools
            </span>
            <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Tools &amp; Technologies You Will Master
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Used in real production environments at top companies
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {[
              { name: 'Azure DevOps', abbr: 'Az',  color: '#0078d4', bg: '#003f6b' },
              { name: 'Docker',       abbr: '🐳',  color: '#2496ed', bg: '#0a2d4a' },
              { name: 'Kubernetes',   abbr: 'K8s', color: '#326ce5', bg: '#0d1f4a' },
              { name: 'Terraform',    abbr: 'TF',  color: '#7b42bc', bg: '#2d1050' },
              { name: 'Git & GitHub', abbr: 'Git', color: '#f05032', bg: '#4a1205' },
              { name: 'ARM Templates',abbr: 'ARM', color: '#0078d4', bg: '#003f6b' },
              { name: 'Azure AKS',   abbr: 'AKS', color: '#0078d4', bg: '#003f6b' },
              { name: 'Azure Monitor',abbr: 'Mon', color: '#00b4d8', bg: '#003344' },
              { name: 'Bicep',       abbr: 'Bic', color: '#a78bfa', bg: '#2e1a5e' },
              { name: 'Jenkins',     abbr: 'Jen', color: '#f0d6b7', bg: '#4a2e00' },
            ].map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: tool.bg, borderColor: tool.color + '40' }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: tool.color + '25', color: tool.color }}
                >
                  {tool.abbr}
                </span>
                <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── SECTION 5: CURRICULUM + PROJECTS ───────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Course Curriculum</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{curriculum.length} modules · hands-on labs included</p>
            <div className="space-y-2">
              {curriculum.map((mod, i) => (
                <details key={i} open={i === 0} className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#005663] text-white text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      {mod.title}
                    </span>
                    <svg className="h-4 w-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </summary>
                  <ul className="border-t border-slate-200 px-4 py-3 space-y-2">
                    {mod.topics.map(t => (
                      <li key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#005663] shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Real-Time Industry Projects</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Portfolio-ready projects to showcase in interviews</p>
            <div className="flex flex-col gap-3">
              {projectCards.map((proj, i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
                      P{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{proj}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hands-on implementation with industry-standard tools</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent dark:via-orange-900/30" />

      {/* ── SECTION 6: BATCHES ──────────────────────────────────────────── */}
      <section className="py-10 md:py-16 px-4 md:px-8 bg-[#0d1b2e]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">Enroll Now</p>
          <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
          <h2 className="text-center text-3xl font-extrabold text-white mb-2">Upcoming Batches</h2>
          <p className="text-center text-sm text-slate-400 mt-2 mb-10">Online &amp; classroom at Dilsukhnagar and Ameerpet</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              {
                label: 'Weekday Batch',
                days: 'Mon–Fri',
                rows: [
                  { icon: 'ti-clock', label: 'Time', value: '8:00 PM – 10:00 PM' },
                  { icon: 'ti-map-pin', label: 'Centre', value: 'Dilsukhnagar & Ameerpet' },
                  { icon: 'ti-device-laptop', label: 'Mode', value: 'Online + Classroom' },
                  { icon: 'ti-users', label: 'Batch Size', value: '20 seats max' },
                  { icon: 'ti-calendar', label: 'Duration', value: course.duration || '3 months' },
                ],
                urgency: true,
              },
              {
                label: 'Weekend Batch',
                days: 'Sat–Sun',
                rows: [
                  { icon: 'ti-clock', label: 'Time', value: '10:00 AM – 2:00 PM' },
                  { icon: 'ti-map-pin', label: 'Centre', value: 'Dilsukhnagar & Ameerpet' },
                  { icon: 'ti-device-laptop', label: 'Mode', value: 'Online + Classroom' },
                  { icon: 'ti-users', label: 'Batch Size', value: '20 seats max' },
                  { icon: 'ti-calendar', label: 'Duration', value: course.duration || '3 months' },
                ],
                urgency: false,
              },
            ].map(batch => (
              <div key={batch.label} className="bg-[#112240] border border-slate-700 rounded-2xl overflow-hidden flex flex-col transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
                <div className="bg-[#080f1e] px-5 py-4 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <i className="ti ti-calendar text-orange-400 text-lg" />
                    </div>
                    <span className="text-white font-bold text-base flex items-center gap-2">
                      {batch.urgency
                        ? <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        : <span className="w-2 h-2 rounded-full bg-green-400" />
                      }
                      {batch.label}
                    </span>
                  </div>
                  <span className="bg-orange-500/15 text-orange-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/20">{batch.days}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-2.5">
                    {batch.rows.map(row => (
                      <div key={row.label} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <i className={`ti ${row.icon} text-blue-500 text-base flex-shrink-0`} />
                        <span className="font-semibold text-slate-100">{row.label}:</span> {row.value}
                      </div>
                    ))}
                  </div>
                  {batch.urgency && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5 text-sm text-orange-300 font-semibold flex items-center gap-2">
                      <i className="ti ti-alert-triangle text-orange-500" />Only a few seats remaining!
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <a
                    href="https://www.cosscloudsol.com/free-demo-class"
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-500/20"
                  >
                    Reserve {batch.label.split(' ')[0]} Seat →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent dark:via-orange-900/30" />

      {/* ── SECTION 7: TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-10 md:py-16 px-4 md:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">Student Success Stories</p>
          <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-2">What Our Students Say</h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-10">1,200+ students placed at top companies from our Hyderabad centres</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700 flex flex-col gap-4 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-300">

                {/* Top row — avatar + name + stars */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-md">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quote text */}
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Bottom row — name/role left, company logo right */}
                <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Placed Students</div>
                  </div>
                  <img
                    src={t.companyLogo}
                    alt={t.companyName}
                    className="h-6 w-auto object-contain opacity-80"
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: FAQ ──────────────────────────────────────────────── */}
      <section className="py-10 md:py-16 px-4 md:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">FAQs</p>
          <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-10">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {faqItems.map((item, i) => (
              <details key={i} open={i === 0} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                    {item.q}
                  </span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center transition-transform duration-200 group-open:rotate-45">
                    <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-4 pt-0">
                  <div className="h-px bg-slate-100 dark:bg-slate-700 mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED COURSES ─────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-10 md:py-16 px-4 md:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <RelatedCourses related={related} />
          </div>
        </section>
      )}

      {/* ── OTHER TRAINING INSTITUTES (flat→flat sibling strip) ─────────── */}
      {siblings.length > 0 && (
        <section className="py-10 md:py-16 px-4 md:px-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">Explore More</p>
            <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
            <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-10">Other Training Institutes in Hyderabad</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={s.href}
                  className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center transition-all hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 9: LOCATIONS ────────────────────────────────────────── */}
      <section className="py-10 md:py-16 px-4 md:px-8 bg-[#0d1b2e]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-black tracking-[0.12em] uppercase text-orange-500 mb-0">Find Us</p>
          <span className="block w-8 h-0.5 bg-orange-500 mt-1.5 mb-3 mx-auto" />
          <h2 className="text-center text-3xl font-extrabold text-white mb-2">Our Training Centres in Hyderabad</h2>
          <p className="text-sm text-slate-400 mt-2 text-center mb-10">Two conveniently located centres for {titleWithoutTraining} training</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {locationData.map(({ branchObj, fallbackName, fallbackAddr1, fallbackAddr2, fallbackPhone }) => {
              const branchPhone = branchObj?.phone ?? fallbackPhone
              const branchName = branchObj?.branchName ?? fallbackName
              const addr1 = branchObj?.addressLine1 ?? fallbackAddr1
              const addr2 = branchObj
                ? `${branchObj.addressLine2}, ${branchObj.city} – ${branchObj.pincode}`
                : fallbackAddr2
              return (
                <div key={branchName} className="bg-[#112240] border border-slate-700 rounded-2xl overflow-hidden transition-all hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5">
                  <div className="bg-[#080f1e] px-5 py-4 flex items-center gap-3 border-b border-slate-700">
                    <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-white font-bold text-base">
                      {branchName}
                    </span>
                  </div>
                  <div className="p-5">
                    <div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">{addr1}</p>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">{addr2}</p>
                    </div>
                    <a href={`tel:${branchPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-orange-400 font-bold text-base hover:text-orange-300 transition-colors">
                      <PhoneIcon cls="w-5 h-5 text-orange-400" /> {branchPhone}
                    </a>
                    {(() => {
                      const isDilsukhnagar = branchName.toLowerCase().includes('dilsukhnagar')
                      const mapSrc = (branchObj?.mapEmbedUrl || '') ||
                        (isDilsukhnagar
                          ? 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3808.0!2d78.5262!3d17.3617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDIxJzQyLjEiTiA3OMKwMzEnMzQuMyJF!5e0!3m2!1sen!2sin!4v1234567890'
                          : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.5!2d78.4482!3d17.4375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDI2JzE1LjAiTiA3OMKwMjYnNTMuNSJF!5e0!3m2!1sen!2sin!4v1234567890')
                      return (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-600 h-[160px]">
                          <iframe
                            src={mapSrc}
                            width="100%"
                            height="160"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Coss Cloud Solutions ${isDilsukhnagar ? 'Dilsukhnagar' : 'Ameerpet'}`}
                          />
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-sm text-slate-500 text-center max-w-3xl mx-auto mt-8 leading-relaxed">
            Coss Cloud Solutions offers {titleWithoutTraining} training in Hyderabad across multiple locations including
            Dilsukhnagar, Ameerpet, and nearby areas including {serviceAreas.slice(0, 4).join(', ')}.
            Our certified trainers deliver both classroom and online training with 100% placement support.
          </p>
        </div>
      </section>

      {/* ── SECTION 10: BOTTOM CTA ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-[#080f1e] relative overflow-hidden">
        <div className="max-w-[900px] mx-auto text-center relative z-10">

          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            Ready to Build Your{' '}
            <span className="text-orange-400">{categoryName}</span>{' '}Career?
          </h2>

          <p className="text-slate-400 text-base mb-8">
            Book your FREE demo class today — limited seats per batch!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {[
              { icon: '✓', label: '100% Practical Training' },
              { icon: '✓', label: 'Placement Assistance' },
              { icon: '✓', label: 'Certification Prep' },
              { icon: '✓', label: 'Lifetime LMS Access' },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-4 py-2 text-sm text-slate-200 font-medium">
                <span className="text-orange-400 font-bold">{pill.icon}</span>
                {pill.label}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://www.cosscloudsol.com/free-demo-class"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              Book Free Demo Class
            </a>
            <a
              href={wa1}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-black text-base rounded-xl transition-all flex items-center gap-2.5 shadow-lg shadow-green-600/25 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

        </div>
      </section>


    </div>
  )
}
