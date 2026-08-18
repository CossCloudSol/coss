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
    transforms.push(`g_${gravity}`);
  }

  const t = transforms.join(',');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${publicId}`;
}

