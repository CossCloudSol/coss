/**
 * Cloudinary image URL builder for Coss Cloud Solutions
 *
 * Setup:
 * 1. Add to .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *
 * 2. Use getCldUrl() anywhere in your app.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

export interface CldOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'thumb' | 'scale' | 'pad';
  gravity?: 'auto' | 'face' | 'center';
}

// Cloudinary rejects gravity on crop modes that don't crop (fit/scale/pad
// resize without discarding any of the frame, so there's nothing for
// gravity to aim at) — only fill/thumb accept it.
function buildTransformString(options: CldOptions): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
  } = options;

  const transforms: string[] = [
    `f_${format}`,
    `q_${quality}`,
  ];

  if (width)   transforms.push(`w_${width}`);
  if (height)  transforms.push(`h_${height}`);
  if (width || height) {
    transforms.push(`c_${crop}`);
    if (crop === 'fill' || crop === 'thumb') transforms.push(`g_${gravity}`);
  }

  return transforms.join(',');
}

/**
 * Build a Cloudinary delivery URL with optional transformations.
 * @param publicId  The Cloudinary public ID (e.g. "coss/courses/cloud-computing")
 * @param options   Optional transformation parameters
 */
export function getCldUrl(publicId: string, options: CldOptions = {}): string {
  if (!CLOUD_NAME) {
    // Fallback: return a placeholder if Cloudinary is not configured
    return `https://res.cloudinary.com/demo/image/upload/sample`;
  }

  const t = buildTransformString(options);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${publicId}`;
}

const RESOURCE_TYPES = ['image', 'video', 'raw'] as const;
const DELIVERY_TYPES = ['upload', 'private', 'authenticated'] as const;
const TRANSFORM_COMPONENT_RE = /^[a-z]{1,3}_[^,]+$/;
const VERSION_RE = /^v\d+$/;

/**
 * Recover a Cloudinary public_id from a delivery URL. Returns null for
 * anything that isn't an unambiguous res.cloudinary.com upload URL.
 *
 * A missing version segment is only ambiguous when the transform-stripping
 * loop actually consumed something — in that case a folder name could have
 * been mistaken for a transform, so we refuse to guess. If nothing was
 * stripped, the remainder is unambiguously the public ID even without a
 * version.
 *
 * URL anatomy:
 *   https://res.cloudinary.com/<cloud>/<resource_type>/<delivery_type>/[<transform>/...]/[v<digits>/]<public_id>.<ext>
 */
export function publicIdFromUrl(input: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  if (trimmed.startsWith('data:')) return null;
  if (!trimmed.startsWith('http')) return null;
  if (trimmed.includes('localhost')) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }

  if (u.host !== 'res.cloudinary.com') return null;

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  const resourceType = parts[1];
  if (!(RESOURCE_TYPES as readonly string[]).includes(resourceType)) return null;

  const deliveryType = parts[2];
  if (!(DELIVERY_TYPES as readonly string[]).includes(deliveryType)) return null;

  const transformStart = 3;
  let cursor = transformStart;
  while (cursor < parts.length) {
    const segment = parts[cursor];
    const components = segment.split(',');
    const isTransformSegment = components.every(c => TRANSFORM_COMPONENT_RE.test(c));
    if (!isTransformSegment) break;
    cursor++;
  }
  const strippedCount = cursor - transformStart;

  let hadVersion = false;
  if (cursor < parts.length && VERSION_RE.test(parts[cursor])) {
    hadVersion = true;
    cursor++;
  }

  if (!hadVersion && strippedCount > 0) return null;

  const remainder = parts.slice(cursor);
  if (remainder.length === 0) return null;

  const last = remainder[remainder.length - 1];
  const dotIndex = last.lastIndexOf('.');
  const lastSegmentNoExt = dotIndex > 0 ? last.slice(0, dotIndex) : last;

  const publicId = [...remainder.slice(0, -1), lastSegmentNoExt].join('/');
  return publicId || null;
}

/**
 * Insert (or replace) a transform segment directly after /upload/ in an
 * existing Cloudinary delivery URL, leaving everything else — version,
 * public ID, and extension — byte-for-byte as stored. Rebuilding the URL
 * from a parsed public ID (as publicIdFromUrl does) is lossy for the
 * WordPress-imported assets, whose stored public ID includes what looks
 * like a file extension (e.g. "google-jpg"); stripping it 404s the asset.
 * Falls back to the original URL unchanged when it isn't a recognizable
 * res.cloudinary.com upload URL.
 */
export function optimizeCldUrl(url: string, options: CldOptions = {}): string {
  if (!url || !url.trim()) return url;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http') || trimmed.includes('localhost')) return url;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return url;
  }
  if (u.host !== 'res.cloudinary.com') return url;

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 4) return url;

  const resourceType = parts[1];
  if (!(RESOURCE_TYPES as readonly string[]).includes(resourceType)) return url;

  const deliveryType = parts[2];
  if (!(DELIVERY_TYPES as readonly string[]).includes(deliveryType)) return url;

  let cursor = 3;
  while (cursor < parts.length) {
    const components = parts[cursor].split(',');
    if (!components.every(c => TRANSFORM_COMPONENT_RE.test(c))) break;
    cursor++;
  }
  const rest = parts.slice(cursor);
  if (rest.length === 0) return url;

  const t = buildTransformString(options);

  const newPath = '/' + [...parts.slice(0, 3), t, ...rest].join('/');
  return `${u.protocol}//${u.host}${newPath}${u.search}`;
}

/**
 * Forces a real download (Content-Disposition: attachment) instead of an
 * in-browser preview, by inserting Cloudinary's fl_attachment flag right
 * after the delivery-type segment. Needed for browser-renderable formats
 * like PDF, where the `download` attribute on an <a> tag is ignored for
 * cross-origin URLs. Falls back to the original URL unchanged when it isn't
 * a recognizable res.cloudinary.com upload URL.
 */
export function attachmentUrl(url: string): string {
  if (!url || !url.trim()) return url;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http') || trimmed.includes('localhost')) return url;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return url;
  }
  if (u.host !== 'res.cloudinary.com') return url;

  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 4) return url;

  const resourceType = parts[1];
  if (!(RESOURCE_TYPES as readonly string[]).includes(resourceType)) return url;

  const deliveryType = parts[2];
  if (!(DELIVERY_TYPES as readonly string[]).includes(deliveryType)) return url;

  const newPath = '/' + [...parts.slice(0, 3), 'fl_attachment', ...parts.slice(3)].join('/');
  return `${u.protocol}//${u.host}${newPath}${u.search}`;
}

