'use client';

import Image from 'next/image';

export default function FooterLogo() {
  return (
    <div className="footer-logo">
      {/* next/image instead of a raw <img src="/logo.png">: the raw tag pulled
          the full 547×456, 120 KB PNG on every page to show it 90px tall.
          width/height match that rendered size (547:456 aspect), so the
          srcset is 128w/256w and served as AVIF/WebP. */}
      <Image
        src="/logo.png"
        alt="Coss Cloud Solutions"
        width={108}
        height={90}
        style={{
          height: '90px',
          width: 'auto',
          objectFit: 'contain',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '8px 16px',
          display: 'block',
        }}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fb) fb.style.display = 'flex';
        }}
      />
      {/* Text fallback — shown only when logo.png is missing */}
      <span style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
        <span className="logo-icon">C</span>
        <span className="logo-text">
          <span className="logo-name" style={{ color: 'white' }}>Coss</span>
          <span className="logo-sub">Cloud Solutions</span>
        </span>
      </span>
    </div>
  );
}
