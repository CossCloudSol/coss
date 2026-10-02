import { ImageResponse } from 'next/og';
import { bannerSignature, sameSignature } from '@/lib/course-banner-sign';
import { BANNER_SQUARE, BANNER_WIDE, categoryStyle, shortCourseTitle, type BannerIcon } from '@/lib/course-banner';

/**
 * Branded banner for a course without an admin thumbnail (next/og).
 * GET /course-banner/<slug>?t=<title>&c=<category>&k=<categorySlug>&v=<signature>[&s=sq]
 *   wide (default): 800×400 for cards — wordmark, category chip, title
 *   s=og: the wide banner plus "cosscloudsol.com", for og:image
 *   s=sq: 256×256 for small thumbnails — icon and the C tile only
 * URLs are built server-side (lib/course-banner-sign) with an HMAC over the
 * slug, title and category: unsigned or edited parameters get a 404, and
 * the signature changes with the title or category, so the image is cached
 * as immutable. Edge runtime, no database. Raleway comes from
 * src/assets/fonts, bundled into the function by the import.meta.url
 * references below (a file in the deployment, not a network request).
 */
export const runtime = 'edge';

type Shape = { d: string } | { c: [number, number, number] } | { e: [number, number, number, number] };

/**
 * Category icons as plain 24×24 SVG shapes (satori can't render lucide-react
 * components). Shapes from the Lucide icon set (ISC licence).
 */
const ICONS: Record<BannerIcon, Shape[]> = {
  cloud: [{ d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' }],
  infinity: [{ d: 'M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z' }],
  brain: [
    { d: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z' },
    { d: 'M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z' },
    { d: 'M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4' },
    { d: 'M12 5v13' },
  ],
  chart: [{ d: 'M3 3v18h18' }, { d: 'M18 17V9' }, { d: 'M13 17V5' }, { d: 'M8 17v-3' }],
  database: [{ e: [12, 5, 9, 3] }, { d: 'M3 5V19A9 3 0 0 0 21 19V5' }, { d: 'M3 12A9 3 0 0 0 21 12' }],
  shield: [
    { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' },
    { d: 'm9 12 2 2 4-4' },
  ],
  code: [{ d: 'm18 16 4-4-4-4' }, { d: 'm6 8-4 4 4 4' }, { d: 'm14.5 4-5 16' }],
  terminal: [{ d: 'M4 17l6-6-6-6' }, { d: 'M12 19h8' }],
  building: [
    { d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z' },
    { d: 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2' },
    { d: 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2' },
    { d: 'M10 6h4M10 10h4M10 14h4M10 18h4' },
  ],
  pen: [{ d: 'm12 19 7-7 3 3-7 7-3-3z' }, { d: 'm18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' }, { d: 'm2 2 7.586 7.586' }, { c: [11, 11, 2] }],
  message: [
    { d: 'M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z' },
    { d: 'M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1' },
  ],
  users: [{ d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }, { c: [9, 7, 4] }, { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }, { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  atom: [
    { c: [12, 12, 1] },
    { d: 'M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z' },
    { d: 'M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z' },
  ],
  stethoscope: [
    { d: 'M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3' },
    { d: 'M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4' },
    { c: [20, 10, 2] },
  ],
  cap: [{ d: 'M22 10v6M2 10l10-5 10 5-10 5z' }, { d: 'M6 12v5c3 3 9 3 12 0v-5' }],
};

function Icon({ shapes, size, color, strokeWidth }: { shapes: Shape[]; size: number; color: string; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shapes.map((sh, i) =>
        'd' in sh ? <path key={i} d={sh.d} /> : 'c' in sh ? <circle key={i} cx={sh.c[0]} cy={sh.c[1]} r={sh.c[2]} /> : <ellipse key={i} cx={sh.e[0]} cy={sh.e[1]} rx={sh.e[2]} ry={sh.e[3]} />,
      )}
    </svg>
  );
}

const extraBoldFont = fetch(new URL('../../../assets/fonts/Raleway-ExtraBold-latin.woff', import.meta.url)).then((r) => r.arrayBuffer());
const boldFont = fetch(new URL('../../../assets/fonts/Raleway-Bold-latin.woff', import.meta.url)).then((r) => r.arrayBuffer());

// ImageResponse already sends "public, immutable, no-transform, max-age=31536000";
// this tells Vercel's CDN to keep it for the same year.
const CDN_CACHE = 'public, s-maxage=31536000, immutable';

/** Faint "circuit" dots and traces in the accent colour. */
function Pattern({ accent, width, height }: { accent: string; width: number; height: number }) {
  const dots = [];
  for (let x = 20; x < width; x += 40) for (let y = 20; y < height; y += 40) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={accent} />);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.18 }}>
      {dots}
      <path d={`M ${width * 0.55} 60 H ${width * 0.72} V 140 H ${width - 40}`} stroke={accent} strokeWidth={2} fill="none" />
      <path d={`M ${width * 0.6} ${height - 60} H ${width * 0.8} V ${height - 120} H ${width - 20}`} stroke={accent} strokeWidth={2} fill="none" />
      <circle cx={width * 0.72} cy={140} r={5} fill={accent} />
      <circle cx={width * 0.8} cy={height - 120} r={5} fill={accent} />
    </svg>
  );
}

/** The "C" tile from the site logo. */
function CTile({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.24,
        background: '#e47538',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Raleway',
        fontWeight: 800,
        fontSize: size * 0.62,
      }}
    >
      C
    </div>
  );
}

/**
 * Full wordmark, as the site logo: C tile, "COSS" in brand orange, "CLOUD
 * SOLUTIONS" letter-spaced under it. flexShrink 0: it never truncates; the
 * category chip next to it gives way instead.
 */
function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <CTile size={60} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ color: '#e47538', fontFamily: 'Raleway', fontWeight: 800, fontSize: 36, lineHeight: 1, letterSpacing: 3 }}>COSS</div>
        <div style={{ color: '#cfeff0', fontFamily: 'Raleway', fontWeight: 700, fontSize: 17, lineHeight: 1, letterSpacing: 3.4, marginTop: 7 }}>CLOUD SOLUTIONS</div>
      </div>
    </div>
  );
}

export async function GET(req: Request, { params }: { params: { slug: string } }): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams;
  const variant = q.get('s'); // 'sq' square thumbnail, 'og' social share, else card
  const square = variant === 'sq';
  const slug = decodeURIComponent(params.slug);
  const course = { title: (q.get('t') ?? '').slice(0, 160), category: (q.get('c') ?? '').slice(0, 80), categorySlug: q.get('k') ?? '' };
  const expected = await bannerSignature(slug, course.title, course.category, course.categorySlug);
  if (!course.title || !expected || !sameSignature(q.get('v') ?? '', expected)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const [extraBold, bold] = await Promise.all([extraBoldFont, boldFont]);
  const { accent, icon } = categoryStyle(course.categorySlug || null);
  const shapes = ICONS[icon];
  // Flat fills only: smooth gradients made the PNGs ~95 KB; flat shapes compress to a fraction.
  const background = '#0a3d4a';
  const fontOptions = {
    fonts: [
      { name: 'Raleway', data: extraBold, weight: 800 as const, style: 'normal' as const },
      { name: 'Raleway', data: bold, weight: 700 as const, style: 'normal' as const },
    ],
    headers: { 'CDN-Cache-Control': CDN_CACHE },
  };

  if (square) {
    const { width, height } = BANNER_SQUARE;
    return new ImageResponse(
      (
        <div style={{ width, height, display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'center', background }}>
          <Pattern accent={accent} width={width} height={height} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, background: '#005663', border: `3px solid ${accent}` }} />
          <Icon shapes={shapes} size={120} color={accent} strokeWidth={1.5} />
          {/* Shown down to 40px (mega-menu), where a wordmark can't be read: the C tile only. */}
          <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex' }}>
            <CTile size={44} />
          </div>
        </div>
      ),
      { width, height, ...fontOptions },
    );
  }

  const { width, height } = BANNER_WIDE;
  const title = shortCourseTitle(course.title);
  // The title stays left of the disc (max 430px wide, 2 lines).
  // Long titles step down in size; the wordmark row is never squeezed for them.
  const fontSize = title.length <= 16 ? 52 : title.length <= 26 ? 46 : 40;

  return new ImageResponse(
    (
      <div style={{ width, height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', padding: 44, background }}>
        <Pattern accent={accent} width={width} height={height} />
        {/* Disc: x 510–840, y 110–440 (bleeds off the right and bottom edges). */}
        <div style={{ position: 'absolute', right: -40, top: 110, width: 330, height: 330, borderRadius: 165, background: '#005663', border: `3px solid ${accent}` }} />
        <div style={{ position: 'absolute', right: 55, top: 190, display: 'flex' }}>
          <Icon shapes={shapes} size={160} color={accent} strokeWidth={1.3} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <Wordmark />
          <div
            style={{
              display: 'flex',
              flexShrink: 1,
              maxWidth: 400,
              padding: '8px 18px',
              borderRadius: 999,
              border: `2px solid ${accent}`,
              background: 'rgba(10,61,74,0.75)',
              color: '#ffffff',
              fontFamily: 'Raleway',
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {course.category}
          </div>
        </div>
        <div
          style={{
            display: 'block',
            maxWidth: 430,
            color: '#ffffff',
            fontFamily: 'Raleway',
            fontWeight: 800,
            fontSize,
            lineHeight: 1.12,
            lineClamp: 2,
          }}
        >
          {title}
        </div>
        {/* Social shares only; cards stay clean. */}
        {variant === 'og' && (
          <div style={{ position: 'absolute', right: 28, bottom: 22, display: 'flex', color: '#ffffff', fontFamily: 'Raleway', fontWeight: 700, fontSize: 20, opacity: 0.9 }}>
            cosscloudsol.com
          </div>
        )}
      </div>
    ),
    { width, height, ...fontOptions },
  );
}
