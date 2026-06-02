'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import BatchCard, { type BatchCardBatch } from '@/components/BatchCard';

const MODE_FILTERS = ['All', 'Classroom', 'Online', 'Hybrid'];
const CENTRE_FILTERS = ['All', 'Dilsukhnagar', 'Ameerpet'];

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchCardBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter]   = useState('All');
  const [centreFilter, setCentreFilter] = useState('All');

  useEffect(() => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const upcoming = batches.filter((b) => b.status === 'upcoming' || b.status === 'ongoing');
  const filtered = upcoming.filter((b) => {
    const modeMatch   = modeFilter   === 'All' || b.mode   === modeFilter;
    const centreMatch = centreFilter === 'All' || b.centre === centreFilter || (centreFilter === 'Online' && b.mode === 'Online');
    return modeMatch && centreMatch;
  });

  return (
    <main>
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

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex flex-wrap gap-2">
            {MODE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setModeFilter(f)}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[44px]"
                style={
                  modeFilter === f
                    ? { background: '#0f766e', borderColor: '#0f766e', color: '#fff' }
                    : { background: 'var(--bg-card,#fff)', borderColor: '#e5e7eb', color: 'var(--text,#111)' }
                }
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {CENTRE_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCentreFilter(c)}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[44px]"
                style={
                  centreFilter === c
                    ? { background: '#e47538', borderColor: '#e47538', color: '#fff' }
                    : { background: 'var(--bg-card,#fff)', borderColor: '#e5e7eb', color: 'var(--text,#111)' }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-base">
              No upcoming batches right now — contact us to know next dates
            </p>
            <a
              href="https://wa.me/918885166007"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Ask on WhatsApp →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Not finding the right batch? We can arrange custom schedules.
          </p>
          <a
            href="https://wa.me/918885166007"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
