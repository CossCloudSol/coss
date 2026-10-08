import type { Metadata } from 'next';
import { Calendar } from 'lucide-react';
import BatchesBoard from './BatchesBoard';
import { findBatches } from '@/lib/batch-queries';
import { buildPageMetadataWithFallback } from '@/lib/get-page-seo';
import type { BatchCardBatch } from '@/components/BatchCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cosscloudsol.com';

// Server-rendered and cached; admin batch edits revalidate it (src/lib/revalidate.ts).
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  // Admin SEO for "batches" wins when set; this is the fallback.
  return buildPageMetadataWithFallback('batches', {
    title: 'Upcoming Batches: IT Courses in Hyderabad',
    description:
      'Start dates, timings and seats for upcoming IT training batches at Coss Cloud Solutions in Dilsukhnagar, Ameerpet and live online.',
    alternates: { canonical: `${SITE_URL}/batches` },
  });
}

export default async function BatchesPage() {
  // Upcoming and ongoing batches, soonest first (src/lib/batch-queries.ts).
  const rows = await findBatches();
  const batches: BatchCardBatch[] = rows.map((b) => ({
    id: b.id,
    batchName: b.batchName,
    mode: b.mode,
    centre: b.centre,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate ? b.endDate.toISOString() : null,
    schedule: b.schedule,
    totalSeats: b.totalSeats,
    seatsAvailable: b.seatsAvailable,
    status: b.status,
    featured: b.featured,
    course: { title: b.course.title, category: b.course.category, categorySlug: b.course.categorySlug },
  }));

  // No main element here: the root layout already wraps every page in one.
  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-16 px-4 md:px-8"
        style={{ background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-[1100px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(79,209,197,0.12)', border: '1px solid rgba(79,209,197,0.28)', color: '#4fd1c5' }}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Training Schedule
          </div>
          <h1 className="font-extrabold text-white leading-tight mb-3" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Upcoming Batches
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Classroom at Dilsukhnagar &amp; Ameerpet · Online via Zoom
          </p>
        </div>
      </section>

      <BatchesBoard batches={batches} />
    </div>
  );
}
