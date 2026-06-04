'use client';

import { Calendar, Clock, MapPin, Wifi } from 'lucide-react';
import { buildWhatsAppUrl, batchBookingMessage } from '@/lib/whatsapp';
import { getSeatStatus, formatBatchDate, getBatchStatusBadge } from '@/lib/batch-utils';

export interface BatchCardBatch {
  id: string;
  batchName: string;
  mode: string;
  centre?: string | null;
  startDate: string;
  endDate?: string | null;
  schedule: string;
  totalSeats?: number | null;
  seatsAvailable?: number | null;
  status: string;
  featured: boolean;
  course: {
    title: string;
    category: string;
    categorySlug?: string | null;
  };
}

const SEAT_COLOR_MAP: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  gray: 'text-gray-500 dark:text-gray-400',
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  blue:  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  gray:  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200',
  red:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
}

interface BatchCardProps {
  batch: BatchCardBatch;
}

export default function BatchCard({ batch }: BatchCardProps) {
  const seatStatus = getSeatStatus(batch.mode, batch.seatsAvailable, batch.totalSeats);
  const statusBadge = getBatchStatusBadge(batch.status);
  const formattedDate = formatBatchDate(batch.startDate);

  const bookMsg = batchBookingMessage({
    courseName: batch.course.title,
    mode: batch.mode,
    startDate: formattedDate,
    centre: batch.centre,
    schedule: batch.schedule,
  });
  const enrollMsg = batchBookingMessage({
    courseName: batch.course.title,
    mode: 'Online',
    startDate: formattedDate,
    centre: null,
    schedule: batch.schedule,
  });

  const bookUrl   = buildWhatsAppUrl(bookMsg);
  const enrollUrl = buildWhatsAppUrl(enrollMsg);

  return (
    <article className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
            {batch.course.title}
          </h3>
          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE_COLOR[statusBadge.color] ?? STATUS_BADGE_COLOR.gray}`}>
            {statusBadge.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">{batch.course.category}</p>
      </div>

      {/* Meta grid */}
      <div className="p-5 grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-0.5 text-teal-500 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Start Date</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 text-teal-500 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Schedule</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{batch.schedule}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          {batch.mode === 'Online' ? (
            <Wifi className="w-4 h-4 mt-0.5 text-teal-500 shrink-0" aria-hidden="true" />
          ) : (
            <MapPin className="w-4 h-4 mt-0.5 text-teal-500 shrink-0" aria-hidden="true" />
          )}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Venue</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {batch.mode === 'Online' ? 'Online via Zoom' : (batch.centre ?? 'Coss Cloud Solutions Centre')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
            <span className="text-teal-500 text-sm font-bold">M</span>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Mode</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{batch.mode}</p>
          </div>
        </div>
      </div>

      {/* Seats section */}
      {batch.mode !== 'Online' && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-600 dark:text-gray-300">Seat availability</span>
            <span className={`text-xs font-bold ${SEAT_COLOR_MAP[seatStatus.color] ?? SEAT_COLOR_MAP.gray}`}>
              {seatStatus.label}
            </span>
          </div>
          {seatStatus.type !== 'unknown' && (
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${seatStatus.percent}%`,
                  background: seatStatus.color === 'green' ? '#10b981' : seatStatus.color === 'amber' ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          )}
        </div>
      )}

      {batch.mode === 'Online' && (
        <div className="px-5 pb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
            <Wifi className="w-3 h-3" aria-hidden="true" />
            Unlimited seats
          </span>
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-auto px-5 pb-5 flex flex-col gap-2">
        {(batch.mode === 'Classroom' || batch.mode === 'Hybrid') && (
          <a
            href={bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Book Seat on WhatsApp
          </a>
        )}
        {(batch.mode === 'Online' || batch.mode === 'Hybrid') && (
          <a
            href={enrollUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#e47538' }}
          >
            Enroll Online Class
          </a>
        )}
      </div>
    </article>
  );
}
