import { createHash } from 'node:crypto';
import { uploadAsset } from '@/lib/cloudinary-admin';
import { cloudinaryJpegUrl } from '@/lib/social-captions';

const FETCH_TIMEOUT_MS = 20_000;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const CLOUDINARY_UPLOAD = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i;

/**
 * The image URL to give Buffer for an Instagram post: always a JPEG.
 * next/og renders PNG and this Cloudinary account blocks "fetch" delivery,
 * so the source is downloaded and uploaded to Cloudinary (signed upload,
 * folder social/instagram, id = hash of the source URL, so a retry
 * overwrites rather than duplicates), then delivered with f_jpg.
 * Images already in our Cloudinary library are only re-delivered as JPEG.
 * Throws on failure; the cron treats that as retryable.
 */
export async function instagramJpegUrl(sourceUrl: string): Promise<string> {
  if (CLOUDINARY_UPLOAD.test(sourceUrl)) return cloudinaryJpegUrl(sourceUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(sourceUrl, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.startsWith('image/')) throw new Error(`image ${res.status} ${type || 'no content-type'} from ${sourceUrl}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_SOURCE_BYTES) throw new Error(`image is ${Math.round(bytes.length / 1024)} KB (max ${MAX_SOURCE_BYTES / 1024 / 1024} MB)`);

  const publicId = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 24);
  const uploaded = await uploadAsset(bytes, type.split(';')[0], 'social/instagram', publicId);
  return cloudinaryJpegUrl(uploaded.secure_url);
}
