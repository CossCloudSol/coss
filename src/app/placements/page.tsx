import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, MessageCircle, HeartHandshake, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import { buildPageMetadata } from '@/lib/get-page-seo';
import { findBatches } from '@/lib/batch-queries';
import { formatBatchDate } from '@/lib/batch-utils';
import WhatsAppLink from '@/components/WhatsAppLink';
import EnrollFullForm from '@/components/EnrollFullForm';

export const revalidate = 86400;
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('placements');
}

const SUPPORT_BLOCKS = [
  {
    icon: FileText,
    title: 'Resume built around what you can do',
    body: "We rewrite your CV around the projects you complete in class — the tools you used, the problems you solved, the things an interviewer will actually ask about. Reviewed by the trainer who taught you.",
  },
  {
    icon: MessageCircle,
    title: 'Mock interviews with real questions',
    body: "Technical rounds with your trainer, HR rounds with our placement team. You'll be asked the questions Hyderabad employers are asking right now, and you'll get told plainly where you're weak.",
  },
  {
    icon: HeartHandshake,
    title: 'Referrals to our hiring network',
    body: "We share profiles with 50+ hiring partners across Hyderabad. A referral is not a job offer — it's your CV landing in front of a person instead of a portal.",
  },
  {
    icon: RefreshCw,
    title: "Support that doesn't expire",
    body: 'Finished six months ago and struggling? Come back. Sit in on a revision batch, redo a mock interview, get your CV looked at again. No time limit, no extra fee.',
  },
];

export default async function PlacementsPage() {
  const batches = await findBatches();

  return (
    <>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '56px 20px 48px', color: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: '18px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>Placements</span>
          </nav>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px,4.5vw,42px)', lineHeight: 1.2, marginBottom: '16px', color: '#fff' }}>
            Placement assistance, without the fine print
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15.5px', lineHeight: '1.75', maxWidth: '640px', marginBottom: '28px' }}>
            Every institute in Hyderabad advertises 100% placement. We&apos;d rather show you exactly what our career support includes, and let you judge whether it&apos;s worth your time.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <Link
              href="/free-demo-class/"
              style={{ background: '#e47538', color: '#fff', padding: '13px 28px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14.5px', textDecoration: 'none' }}
            >
              Book a free demo class
            </Link>
            <WhatsAppLink
              ctaType="hero"
              pageType="static"
              message="Hi, I'd like to know more about placement support at Coss."
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '13px 28px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14.5px', border: '1px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}
            >
              Ask us on WhatsApp
            </WhatsAppLink>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
            Training IT professionals in Hyderabad since 2010 · 5,000+ students trained
          </p>
        </div>
      </div>

      {/* Section 1 — What you actually get */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)' }}>
              What our career support includes
            </h2>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '36px' }}>
            This starts while you&apos;re still learning, not after you finish.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {SUPPORT_BLOCKS.map(block => {
              const Icon = block.icon;
              return (
                <div key={block.title} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '26px', border: '1px solid var(--border-card)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(15,118,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Icon size={20} color="#0f766e" aria-hidden="true" />
                  </div>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15.5px', color: 'var(--text)', marginBottom: '8px' }}>
                    {block.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7' }}>
                    {block.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2 — What we don't promise */}
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderLeft: '4px solid #64748b', borderRadius: '14px', padding: '32px' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
            What we don&apos;t promise
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.85', marginBottom: '14px' }}>
            We don&apos;t guarantee placement, and we&apos;d be careful with any institute that does. Whether you get hired depends on your skills, your interview performance, and what companies are hiring the month you finish — and no training centre controls those.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.85' }}>
            What we control is preparation. We do that thoroughly, for every student, for as long as you need it.
          </p>
        </div>
      </div>

      {/* Section 3 — Next batches */}
      <div style={{ background: 'var(--bg-alt)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)' }}>
              Next batches
            </h2>
          </div>

          {batches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Calendar size={32} color="var(--text-muted)" aria-hidden="true" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                No batches currently scheduled — ask us for the next available date.
              </p>
              <WhatsAppLink
                ctaType="batches_page"
                pageType="static"
                message="Hi, I'd like to know the next available batch dates at Coss."
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
              >
                Ask on WhatsApp
              </WhatsAppLink>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {batches.map(batch => {
                const formattedDate = formatBatchDate(batch.startDate);
                const branchLabel = batch.mode === 'Online' ? 'Online' : (batch.centre ?? 'Coss Cloud Solutions');
                const hasRealSeatCount = batch.mode !== 'Online' && batch.seatsAvailable != null;
                const message = `Hi, I'd like to know about the ${batch.course.title} batch starting ${formattedDate} at ${branchLabel}.`;

                return (
                  <div
                    key={batch.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '18px 22px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                        {batch.course.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {formattedDate} · {batch.schedule} · {branchLabel}
                        {hasRealSeatCount && (
                          <> · {batch.seatsAvailable} seat{batch.seatsAvailable === 1 ? '' : 's'} available</>
                        )}
                      </p>
                    </div>
                    <WhatsAppLink
                      ctaType="batch"
                      pageType="static"
                      message={message}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Ask about this batch
                    </WhatsAppLink>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Section 4 — Enquiry form */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '56px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
            Talk to our placement team
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Tell us where you are and what you&apos;re aiming for. We&apos;ll tell you honestly whether we can help.
          </p>
        </div>
        <EnrollFullForm submitLabel="Request a callback" disclaimer="No spam. We'll reply on WhatsApp." />
      </div>

      {/* Section 5 — Close */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '56px 20px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
            Come and see for yourself
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: '1.75', marginBottom: '26px' }}>
            Sit in on a class before you decide anything. Sixty minutes, a real trainer, real tools, no cost and no commitment. Then ask us anything you like about placement support.
          </p>
          <Link
            href="/free-demo-class/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: 'var(--primary)', padding: '13px 30px', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14.5px', textDecoration: 'none' }}
          >
            Book a free demo class <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
