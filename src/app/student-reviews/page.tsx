import type { Metadata } from 'next';
import { HeroBanner, CtaBanner, ResponsivePageStyles } from '@/components/shared';
import { buildPageMetadata } from '@/lib/get-page-seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('student-reviews');
}

const reviews = [
  { name: 'Jahnavi S.', course: 'Linux Administration', rating: 5, date: 'December 2024', review: 'As someone with minimal exposure to Linux, I was hesitant about enrolling, but Coss Cloud Solutions made everything easy to understand. The course was well-structured, starting from fundamental commands to more advanced topics like networking, process management, and security. The practical sessions really solidified my knowledge. This is a fantastic place for both beginners and experienced professionals.', initials: 'JS' },
  { name: 'Gopi Krishna', course: 'AWS Cloud', rating: 5, date: 'November 2024', review: 'Best institute in Dilsukhnagar with 100% placement. I strongly recommend this is the best institute for cloud training. The faculty is excellent and very knowledgeable. Got placed in a good company within a month of completing the course.', initials: 'GK' },
  { name: 'Sheshi Rekha', course: 'Linux Training', rating: 5, date: 'November 2024', review: 'Coss Cloud Solutions in Dilsukhnagar provided an excellent Linux training experience. The instructors were knowledgeable and ensured we understood the core concepts, from the basics of file management to advanced topics like shell scripting and server administration. I appreciated the real-world projects and hands-on labs. Highly recommended!', initials: 'SR' },
  { name: 'HariPrasad P.', course: 'AWS Training', rating: 5, date: 'October 2024', review: 'I have done my training here for AWS. It was very good training with experienced faculty. The practical sessions were very helpful and I learned a lot. I am now confident in working with AWS services.', initials: 'HP' },
  { name: 'Nagoju Uma', course: 'DevOps', rating: 5, date: 'October 2024', review: 'Excellent institution with quality teaching and a supportive learning environment. The DevOps course content is very relevant to current industry requirements. Highly recommended for anyone looking to upskill in DevOps!', initials: 'NU' },
  { name: 'Karthik Chary', course: 'Multiple Courses', rating: 5, date: 'September 2024', review: 'Best IT course center in Dilsukhnagar. Coss Cloud Solutions offers excellent courses in AWS, DevOps, Linux, Python, Java, Data Science, and Data Analytics. The quality of teaching is top-notch and the trainers are very experienced.', initials: 'KC' },
  { name: 'Bekkari Laxmi', course: 'Full Stack Development', rating: 5, date: 'September 2024', review: 'Coss Cloud Solutions at Dilsukhnagar offers a comprehensive full stack development training program tailored for students who want to build strong careers in web development. From a student\'s perspective, the course is well-structured, covering both front-end and back-end technologies. Very happy with the quality of training!', initials: 'BL' },
  { name: 'Shiva Rani', course: 'Data Analytics', rating: 5, date: 'August 2024', review: 'Well experienced faculty, feasible lab timings, overall satisfied completely. The Data Analytics course covered everything I needed — from basics to advanced analytics. Thank you Coss Cloud Solutions for the excellent training!', initials: 'SR' },
  { name: 'King Queen', course: 'Cloud Computing', rating: 4, date: 'August 2024', review: 'Nice institute with good learning skills and lab facility. The cloud computing course was practical and the trainer was very knowledgeable. Good experience overall with supportive staff.', initials: 'KQ' },
  { name: 'Rahul M.', course: 'Cyber Security', rating: 5, date: 'July 2024', review: 'The Ethical Hacking course at Coss Cloud Solutions was absolutely amazing! The trainer explained complex concepts in a very clear and practical way. Got hands-on experience with real tools like Kali Linux and Metasploit. Now working as a Security Analyst. Thank you Coss Cloud Solutions!', initials: 'RM' },
  { name: 'Priya V.', course: 'Digital Marketing', rating: 5, date: 'July 2024', review: 'Great institute for digital marketing training! Learned SEO, Google Ads, Social Media Marketing and Google Analytics in depth. The practical approach helped me understand real campaigns. Now working at a digital agency!', initials: 'PV' },
  { name: 'Suresh K.', course: 'Python Full Stack', rating: 5, date: 'June 2024', review: 'Coss Cloud Solutions is one of the best institutes for Python training in Hyderabad. The trainer was excellent and patient with all doubts. The Django project we built was a great learning experience. Got placed in 3 weeks!', initials: 'SK' },
];

const courseStats = [
  { course: 'Cloud Computing', students: '800+', rating: 4.9 },
  { course: 'DevOps', students: '600+', rating: 4.8 },
  { course: 'Data Science', students: '700+', rating: 4.9 },
  { course: 'Full Stack Dev', students: '900+', rating: 4.8 },
  { course: 'Cyber Security', students: '400+', rating: 4.9 },
  { course: 'Digital Marketing', students: '500+', rating: 4.7 },
];

export default function StudentReviewsPage() {
  return (
    <>
      <ResponsivePageStyles />
      <HeroBanner
        badge="1,200+ VERIFIED GOOGLE REVIEWS"
        titlePre="Rated "
        accentText="4.9 Stars"
        titleLine2="by 5,000+ Real Students"
        subtitle="Read verified reviews from students who trained at COSS Cloud Solutions — 98% recommend us for IT training, placements & career transformation."
        stats={[
          { value: '4.9/5',  label: 'OVERALL RATING' },
          { value: '1,200+', label: 'GOOGLE REVIEWS' },
          { value: '98%',    label: 'RECOMMEND COSS CLOUD SOLUTIONS' },
          { value: '5,000+', label: 'STUDENTS TRAINED' },
        ]}
        ctaText="Join 5,000+ students who transformed their IT careers"
        breadcrumb={[{ label: 'About Us', href: '/about-us/' }, { label: 'Student Reviews', href: '/student-reviews/' }]}
      />

      {/* Overall rating */}
      <div style={{ background: 'var(--bg-alt)', padding: '48px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '20px', padding: '36px 48px', boxShadow: 'var(--shadow-md)', marginBottom: '36px' }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '72px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>4.9</div>
            <div style={{ color: '#f5a623', fontSize: '28px', margin: '4px 0' }}>★★★★★</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>Based on 1200+ reviews on Google</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {[{ n: '5000+', l: 'Students Trained' }, { n: '4.9/5', l: 'Average Rating' }, { n: '1200+', l: 'Google Reviews' }, { n: '98%', l: 'Recommend Coss Cloud Solutions' }].map(s => (
              <div key={s.l} style={{ background: 'var(--primary)', color: '#fff', padding: '14px 22px', borderRadius: '12px', textAlign: 'center', minWidth: '130px' }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 800 }}>{s.n}</div>
                <div style={{ fontSize: '12px', opacity: 0.88, marginTop: '2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course ratings */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 0' }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '20px' }}>Ratings by Course</h2>
        <div className="corp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '48px' }}>
          {courseStats.map(c => (
            <div key={c.course} style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '16px 18px', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{c.course}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{c.students} Students</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--primary)' }}>{c.rating}</div>
                <div style={{ color: '#f5a623', fontSize: '12px' }}>★★★★★</div>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews grid */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>Student Testimonials</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: 'var(--text)' }}>What Our Students Say</h2>
        </div>

        <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {reviews.map(r => (
            <div key={r.name + r.course} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-card)', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ color: '#f5a623', fontSize: '13px' }}>{'★'.repeat(r.rating)}</div>
                <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, border: '1px solid var(--border)' }}>{r.course}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '14px', flex: 1 }}>&quot;{r.review}&quot;</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{r.initials}</div>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{r.name}</div>
                  </div>
                </div>
                <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to Google Reviews */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a href="https://www.google.com/search?q=Coss+Cloud+Solutions+Hyderabad+reviews" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '2px solid var(--primary)', color: 'var(--primary)', padding: '12px 28px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>
            📍 Read All 1200+ Reviews on Google
          </a>
        </div>

        <CtaBanner />
      </div>
      <div style={{ height: '48px' }} />
    </>
  );
}
