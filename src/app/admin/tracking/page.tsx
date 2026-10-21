import { TrackingReport } from '@/components/admin/TrackingReport';

// Live data every request — never cache this page.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tracking — Coss Cloud Solutions Admin',
  robots: { index: false, follow: false },
};

export default function TrackingPage(): JSX.Element {
  return <TrackingReport />;
}
