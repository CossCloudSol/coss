'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/first-touch';

/**
 * Mounted once in the root layout so it runs on every public page. Captures
 * the first-touch attribution snapshot (UTM params, referrer, landing page)
 * on first visit only — see captureFirstTouch(), which no-ops if a snapshot
 * already exists. Renders nothing.
 */
export default function FirstTouchCapture(): null {
  useEffect(() => {
    captureFirstTouch();
  }, []);

  return null;
}
