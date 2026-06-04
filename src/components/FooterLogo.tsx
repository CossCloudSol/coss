'use client';

export default function FooterLogo() {
  return (
    <div className="footer-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Coss Cloud Solutions"
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
