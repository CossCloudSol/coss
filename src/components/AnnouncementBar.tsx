'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnnouncementBarInput } from '@/lib/validations/announcement-bar';

// djb2-style hash — stable per announcement text, so dismiss resets whenever content changes
function makeDismissKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `ann_bar_dismissed_${(hash >>> 0).toString(36)}`;
}

const LEGACY_KEY = 'ann_bar_dismissed'; // old flat key — pruned on init

interface Props {
  initialConfig: AnnouncementBarInput;
}

export default function AnnouncementBar({ initialConfig }: Props) {
  const [visible, setVisible] = useState<boolean | null>(null);

  const dismissKey = makeDismissKey(initialConfig?.announcementText ?? '');

  useEffect(() => {
    sessionStorage.removeItem(LEGACY_KEY);
    const stored = sessionStorage.getItem(dismissKey);
    setVisible(stored !== 'true');
  }, [dismissKey, initialConfig]);

  if (initialConfig?.isEnabled === false) return null;
  if (visible === null) return <div className="ann-bar h-10 bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  if (visible === false) return null;

  const isExternal = initialConfig.ctaUrl.startsWith('http');

  const bg = initialConfig.backgroundColor || undefined;
  const fg = initialConfig.textColor || undefined;

  // Inverted colors for the CTA pill (bar-bg → pill text, bar-text → pill bg)
  const ctaStyle = {
    color: bg,
    backgroundColor: fg,
  };

  return (
    <div
      role="banner"
      aria-label="Site announcement"
      style={{ backgroundColor: bg, color: fg }}
      className={cn(
        'ann-bar',
        !bg && 'bg-indigo-600 dark:bg-indigo-500',
        !fg && 'text-white',
      )}
    >
      <div className="ann-bar__inner">
        <p className="ann-bar__text">{initialConfig.announcementText}</p>

        {isExternal ? (
          <a
            href={initialConfig.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={bg && fg ? ctaStyle : undefined}
            className={cn(
              'ann-bar__cta',
              (!bg || !fg) && 'bg-white text-indigo-600 dark:bg-indigo-100',
            )}
          >
            {initialConfig.ctaLabel}
          </a>
        ) : (
          <Link
            href={initialConfig.ctaUrl}
            style={bg && fg ? ctaStyle : undefined}
            className={cn(
              'ann-bar__cta',
              (!bg || !fg) && 'bg-white text-indigo-600 dark:bg-indigo-100',
            )}
          >
            {initialConfig.ctaLabel}
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(dismissKey, 'true');
          setVisible(false);
        }}
        aria-label="Dismiss announcement"
        style={{ color: fg }}
        className={cn('ann-bar__close', !fg && 'text-white')}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
