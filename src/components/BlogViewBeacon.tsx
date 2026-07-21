'use client';

import { useEffect } from 'react';

/**
 * Fires a fire-and-forget view-count increment once per page load, off the
 * render path — keeps the blog post GET request read-only so it isn't
 * serialized behind a DB write.
 */
export default function BlogViewBeacon({ slug }: { slug: string }): null {
  useEffect(() => {
    const url = `/api/blog/${encodeURIComponent(slug)}/view`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true });
    }
  }, [slug]);

  return null;
}
