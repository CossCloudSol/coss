'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import BatchCard, { type BatchCardBatch } from '@/components/BatchCard';
import WhatsAppLink from '@/components/WhatsAppLink';

const MODE_FILTERS = ['All', 'Classroom', 'Online', 'Hybrid'];
const CENTRE_FILTERS = ['All', 'Dilsukhnagar', 'Ameerpet'];

/** The /batches filters and batch grid. The batches come server-rendered from the page. */
export default function BatchesBoard({ batches }: { batches: BatchCardBatch[] }) {
  const [modeFilter, setModeFilter]   = useState('All');
  const [centreFilter, setCentreFilter] = useState('All');

  const filtered = batches.filter((b) => {
    const modeMatch   = modeFilter   === 'All' || b.mode   === modeFilter;
    const centreMatch = centreFilter === 'All' || b.centre === centreFilter || (centreFilter === 'Online' && b.mode === 'Online');
    return modeMatch && centreMatch;
  });

  return (
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

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <p className="text-gray-500 dark:text-gray-400 text-base">
            No upcoming batches right now — contact us to know next dates
          </p>
          <WhatsAppLink
            ctaType="batches_page"
            pageType="static"
            message="Hi Coss Cloud Solutions Team, I don't see any upcoming batches listed right now. Could you share the next available dates?"
            className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Ask on WhatsApp →
          </WhatsAppLink>
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
        <WhatsAppLink
          ctaType="batches_page"
          pageType="static"
          message="Hi Coss Cloud Solutions Team, I couldn't find a batch that fits my schedule. Could we arrange a custom schedule?"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#25D366' }}
        >
          Ask on WhatsApp
        </WhatsAppLink>
      </div>
    </div>
  );
}
