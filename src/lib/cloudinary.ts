/**
 * Cloudinary image URL builder for Coss Cloud Solutions
 *
 * Setup:
 * 1. Add to .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *
 * 2. Upload images to Cloudinary with the folder structure:
 *    coss/courses/       → course category images
 *    coss/blogs/         → blog post featured images
 *    coss/companies/     → company logo images
 *    coss/site/          → site-wide images
 *
 * 3. Use getCldUrl() anywhere in your app.
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

/**
 * Pre-built image maps for course categories.
 * Replace the publicId values with your actual Cloudinary public IDs after upload.
 *
 * Upload your WP images to Cloudinary using:
 *   node scripts/download-wp-images.mjs   (downloads locally first)
 * Then drag-and-drop or use Cloudinary CLI to upload the /public/wp-images/ folder.
 */
export const cldCourseImages: Record<string, { hero: string; icon: string }> = {
  'data-analytics-bi':                  { hero: 'coss/courses/data-analytics-bi-hero',   icon: 'coss/courses/data-analytics-bi-icon' },
  'cloud-computing':                    { hero: 'coss/courses/cloud-computing-hero',       icon: 'coss/courses/cloud-computing-icon' },
  'devops-multi-cloud':                 { hero: 'coss/courses/devops-hero',               icon: 'coss/courses/devops-icon' },
  'programming-full-stack-development': { hero: 'coss/courses/programming-hero',           icon: 'coss/courses/programming-icon' },
  'data-engineering':                   { hero: 'coss/courses/data-engineering-hero',     icon: 'coss/courses/data-engineering-icon' },
  'cyber-security-networking':          { hero: 'coss/courses/cyber-security-hero',       icon: 'coss/courses/cyber-security-icon' },
  'erp-crm-enterprise-tools':           { hero: 'coss/courses/erp-crm-hero',              icon: 'coss/courses/erp-crm-icon' },
  'software-testing-os':                { hero: 'coss/courses/software-testing-hero',     icon: 'coss/courses/software-testing-icon' },
  'digital-design':                     { hero: 'coss/courses/digital-design-hero',       icon: 'coss/courses/digital-design-icon' },
  'professional-soft-skills':           { hero: 'coss/courses/soft-skills-hero',          icon: 'coss/courses/soft-skills-icon' },
};

/**
 * Blog featured images map.
 * Key = blog post slug, Value = Cloudinary public ID.
 * Add entries as you upload blog images to Cloudinary.
 */
export const cldBlogImages: Record<string, string> = {
  'soc-analyst-training-hyderabad':                    'coss/blogs/soc-analyst',
  'cyber-security-training-dilsukhnagar-hyderabad':    'coss/blogs/cyber-security',
  'digital-marketing-course-training-dilsukhnagar-hyderabad': 'coss/blogs/digital-marketing',
  'aws-devops-multi-cloud-course-dilsukhnagar':        'coss/blogs/aws-devops',
  // Add more slugs here as you upload images
};

/**
 * Get a blog featured image URL.
 * Falls back to a category-based gradient placeholder if no Cloudinary image is set.
 */
export function getBlogImageUrl(slug: string, width = 800, height = 450): string | null {
  const publicId = cldBlogImages[slug];
  if (!publicId || !CLOUD_NAME) return null;
  return getCldUrl(publicId, { width, height, crop: 'fill', quality: 'auto', format: 'auto' });
}

/**
 * Get a course category image URL from Cloudinary.
 */
export function getCourseImageUrl(
  categorySlug: string,
  type: 'hero' | 'icon' = 'hero',
  width = 800,
  height = 450
): string | null {
  const map = cldCourseImages[categorySlug];
  if (!map || !CLOUD_NAME) return null;
  const publicId = type === 'hero' ? map.hero : map.icon;
  return getCldUrl(publicId, { width, height, crop: 'fill', quality: 'auto', format: 'auto' });
}
