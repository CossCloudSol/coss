import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Denied',
};

export default function UnauthorizedPage(): JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-10 max-w-md w-full">
        <div className="mb-4 text-5xl select-none">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          You don&apos;t have permission to access this section.
          Contact your administrator to request access.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          ← Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
