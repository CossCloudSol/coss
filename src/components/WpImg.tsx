'use client';

import React, { useState } from 'react';

interface WpImgProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Client component wrapper for WordPress media images.
 * Falls back to the alt text when the image cannot load so
 * containing boxes (e.g. company logo cards) don't appear empty.
 */
export default function WpImg({ src, alt, style, className }: WpImgProps) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span
        className={className}
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
          textAlign: 'center',
          lineHeight: 1.3,
          wordBreak: 'break-word',
          ...style,
          // Override image-specific properties that don't apply to text
          maxHeight: undefined,
          objectFit: undefined,
        }}
      >
        {alt}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ display: 'block', ...style }}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
