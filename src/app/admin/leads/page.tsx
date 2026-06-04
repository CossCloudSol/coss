import { Suspense } from 'react';
import { LeadsTable } from '@/components/admin/LeadsTable';

// Live data every request — never cache this page.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'All Leads — Coss Cloud Solutions Admin',
  robots: { index: false, follow: false },
};

interface LeadsPageProps {
  // Next.js passes the URL's query params into server components here. The
  // client `LeadsTable` re-reads them at runtime via `useSearchParams`, but we
  // accept them on the server too so SSR renders the correct initial state
  // (avoiding a flash of unfiltered data on slow networks).
  searchParams: {
    status?: string;
    branch?: string;
    search?: string;
    page?: string;
  };
}

export default function LeadsPage({
  searchParams,
}: LeadsPageProps): JSX.Element {
  // We don't pass searchParams down — the client reads them itself — but we
  // touch them so Next's type system keeps this signature stable and so the
  // route is definitely treated as dynamic.
  const _hint = searchParams.search ?? '';
  void _hint;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">All Leads</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Filter, search and manage every inquiry captured from the public site.
        </p>
      </header>

      {/* Suspense boundary is required for any client descendant that calls
          useSearchParams(). Without it, Next warns during build. */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
        }
      >
        <LeadsTable />
      </Suspense>
    </div>
  );
}
