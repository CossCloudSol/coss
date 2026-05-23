import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';

interface DbCourse {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  duration: string;
  mode: string;
  level: string;
  price: number | null;
  badge: string | null;
  featured: boolean;
}

async function getDbCourses(): Promise<DbCourse[]> {
  const headerList = headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  try {
    const res = await fetch(`${proto}://${host}/api/courses`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.courses ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('courses');
}

const categories = [
  {
    name: 'Data, Analytics & BI',
    emoji: '📊',
    href: '/courses/data-analytics-bi/',
    color: '#4f46e5',
    desc: 'Master Data Science, Machine Learning, Power BI, Tableau, SQL and analytics tools used by top companies.',
    courses: ['Data Science', 'Machine Learning', 'Power BI', 'Tableau', 'Data Analytics', 'AI Training'],
    duration: '3–6 Months',
    level: 'Beginner to Advanced',
  },
  {
    name: 'Cloud Computing',
    emoji: '☁️',
    href: '/courses/cloud-computing/',
    color: '#0891b2',
    desc: 'Learn AWS, Azure, Google Cloud and become a certified cloud professional ready for global IT roles.',
    courses: ['AWS Cloud', 'Microsoft Azure', 'Google Cloud', 'Multi-Cloud', 'Cloud Architecture'],
    duration: '2–4 Months',
    level: 'Beginner to Advanced',
  },
  {
    name: 'DevOps & Multi-Cloud',
    emoji: '⚙️',
    href: '/courses/devops-multi-cloud/',
    color: '#e47538',
    desc: 'Master CI/CD, Docker, Kubernetes, Jenkins, Terraform and modern DevOps engineering practices.',
    courses: ['AWS DevOps', 'Azure DevOps', 'Docker & Kubernetes', 'Terraform', 'Jenkins', 'CI/CD Pipelines'],
    duration: '3–5 Months',
    level: 'Intermediate to Advanced',
  },
  {
    name: 'Programming & Full Stack',
    emoji: '💻',
    href: '/courses/programming-full-stack/',
    color: '#059669',
    desc: 'Build complete web applications with Java, Python, React, Node.js and modern full-stack frameworks.',
    courses: ['Java Full Stack', 'Python Full Stack', 'React.js', 'Node.js', 'Angular', 'MERN Stack'],
    duration: '4–6 Months',
    level: 'Beginner to Advanced',
  },
  {
    name: 'Data Engineering',
    emoji: '🔧',
    href: '/courses/data-engineering/',
    color: '#7c3aed',
    desc: 'Design and build data pipelines with Azure Data Engineer, Spark, Hadoop, and ETL technologies.',
    courses: ['Azure Data Engineer', 'Apache Spark', 'Hadoop', 'ETL Pipelines', 'Big Data', 'PySpark'],
    duration: '3–5 Months',
    level: 'Intermediate',
  },
  {
    name: 'Cyber Security & Networking',
    emoji: '🔒',
    href: '/courses/cyber-security/',
    color: '#b45309',
    desc: 'Become a certified security expert with Ethical Hacking, SOC Analysis, CCNA and network security.',
    courses: ['Ethical Hacking', 'SOC Analyst', 'CCNA', 'Network Security', 'Penetration Testing', 'CEH'],
    duration: '2–4 Months',
    level: 'Beginner to Advanced',
  },
  {
    name: 'ERP, CRM & Enterprise Tools',
    emoji: '🏢',
    href: '/courses/erp-crm-enterprise-tools/',
    color: '#0f766e',
    desc: 'Master enterprise platforms like SAP, Salesforce, Oracle Fusion HCM and business automation tools.',
    courses: ['SAP FICO', 'Salesforce CRM', 'Oracle Fusion HCM', 'SAP HR', 'ServiceNow', 'MS Dynamics'],
    duration: '2–4 Months',
    level: 'Beginner to Advanced',
  },
  {
    name: 'Software Testing & OS',
    emoji: '🧪',
    href: '/courses/software-testing-os/',
    color: '#9333ea',
    desc: 'Learn manual testing, Selenium automation, Linux OS administration and QA methodologies.',
    courses: ['Manual Testing', 'Selenium Automation', 'Linux Administration', 'JIRA', 'API Testing', 'TestNG'],
    duration: '2–3 Months',
    level: 'Beginner to Intermediate',
  },
  {
    name: 'Digital & Design',
    emoji: '🎨',
    href: '/courses/digital-design/',
    color: '#db2777',
    desc: 'Master digital marketing, UI/UX design, graphic design and creative tools for the modern web.',
    courses: ['Digital Marketing', 'SEO & SEM', 'UI/UX Design', 'Graphic Design', 'Social Media Marketing'],
    duration: '2–3 Months',
    level: 'Beginner to Intermediate',
  },
  {
    name: 'Professional & Soft Skills',
    emoji: '🎯',
    href: '/courses/professional-soft-skills/',
    color: '#0284c7',
    desc: 'Build communication skills, MS Office proficiency and English fluency for professional success.',
    courses: ['MS Office', 'Spoken English', 'Communication Skills', 'Tally ERP', 'Business Communication'],
    duration: '1–2 Months',
    level: 'Beginner',
  },
];

const highlights = [
  { icon: '👨‍🏫', label: 'Expert Trainers' },
  { icon: '🛠️', label: 'Hands-on Labs' },
  { icon: '🏆', label: 'Certification' },
  { icon: '🚀', label: '100% Placement' },
  { icon: '📅', label: 'Flexible Batches' },
  { icon: '💰', label: 'Affordable Fees' },
];

export default async function CoursesPage() {
  const dbCourses = await getDbCourses();

  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="30+ INDUSTRY-FOCUSED IT COURSES"
        titlePre="Master In-Demand "
        accentText="IT Skills"
        titleLine2="That Get You Hired"
        subtitle="Explore 30+ hands-on courses in Cloud Computing, DevOps, Data Science, Cyber Security & Full Stack — taught by certified industry experts in Hyderabad."
        stats={[
          { value: '30+',    label: 'COURSES OFFERED' },
          { value: '5,000+', label: 'STUDENTS TRAINED' },
          { value: '4.8★',   label: 'GOOGLE RATING' },
          { value: '100%',   label: 'PLACEMENT SUPPORT' },
        ]}
        ctaText="New batches every week · Register now to reserve your seat"
        breadcrumb={[{ label: 'Courses', href: '/courses/' }]}
      />

      {/* Highlights strip */}
      <div style={{ background: '#e47538', padding: '14px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {highlights.map(h => (
            <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, padding: '2px 0' }}>
              <span>{h.icon}</span> {h.label}
            </div>
          ))}
        </div>
      </div>

      {/* Intro */}
      <div style={{ background: 'var(--bg-alt)', padding: '44px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(228,117,56,0.1)', color: '#e8401c', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>
            AI, Cloud, DevOps & More
          </div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
            Industry-Leading IT Training in Hyderabad
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.75' }}>
            Coss Cloud Solutions offers 30+ industry-focused courses with practical lab sessions, expert trainers and 100% placement support. All programs are designed to make you job-ready from day one.
          </p>
        </div>
      </div>

      {/* DB-Driven Courses (when available) */}
      {dbCourses.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px 0' }}>
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(15,118,110,0.1)', color: '#0f766e', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '8px' }}>
              Available Now
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>
              Enrollable Courses
            </h2>
          </div>
          <div className="course-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
            {dbCourses.map((course) => (
              <div key={course.id} style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '20px 20px 16px' }}>
                  {course.badge && (
                    <span style={{ display: 'inline-block', background: '#e47538', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{course.badge}</span>
                  )}
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>{course.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>⏱ {course.duration}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>🏫 {course.mode}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>📈 {course.level}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.65', flex: 1 }}>{course.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {course.price != null && (
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>₹{course.price.toLocaleString()}</span>
                    )}
                    <Link href={`/courses/${course.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e47538', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', marginLeft: 'auto', textDecoration: 'none' }}>
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Categories */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 20px' }}>
        <div className="course-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px' }}>
          {categories.map(cat => (
            <div key={cat.href} style={{ background: 'var(--bg-card)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 18px rgba(0,0,0,0.08)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ background: `linear-gradient(135deg, #1a1a2e, #0f3460)`, padding: '24px 24px 20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: cat.color, borderRadius: '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {cat.emoji}
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '6px', paddingRight: '56px' }}>{cat.name}</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>⏱ {cat.duration}</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>📈 {cat.level}</span>
                </div>
              </div>
              {/* Card body */}
              <div style={{ padding: '20px 24px', flex: 1 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.65', marginBottom: '16px' }}>{cat.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '20px' }}>
                  {cat.courses.map(c => (
                    <span key={c} style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, border: '1px solid var(--border)' }}>{c}</span>
                  ))}
                </div>
                <Link href={cat.href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e47538', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px' }}>
                  View Courses →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <CtaBanner />
      </div>
    </>
  );
}
