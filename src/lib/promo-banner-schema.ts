/**
 * Promo banners: admin-managed image cards stored as ContentBlock rows with
 * blockType 'promo_banner' (no schema change). Shared by the admin page, the
 * admin API and the public renderer, so no server-only imports here.
 */

import { z } from 'zod';

export const PROMO_BANNER_BLOCK_TYPE = 'promo_banner';

export const PROMO_BANNER_PLACEMENTS = ['course-grid', 'blog-grid', 'course-page', 'blog-page'] as const;
export type PromoBannerPlacement = (typeof PROMO_BANNER_PLACEMENTS)[number];

export const PLACEMENT_LABELS: Record<PromoBannerPlacement, string> = {
  'course-grid': 'Course grids (after every 6th course)',
  'blog-grid': 'Blog grid (after every 6th post)',
  'course-page': 'Course pages (below the hero)',
  'blog-page': 'Blog posts (after the 2nd section)',
};

/** Fixed aspect ratios so a banner never shifts the layout while it loads. */
export const BANNER_ASPECT = { desktop: '4 / 1', mobile: '2 / 1' } as const;

// next/image only optimises this Cloudinary folder (next.config.mjs images.remotePatterns).
const CLOUDINARY_IMAGE = /^https:\/\/res\.cloudinary\.com\/dfditihuw\//;

const optionalImage = z
  .string()
  .trim()
  .refine((v) => v === '' || CLOUDINARY_IMAGE.test(v), 'Pick the image from the media library (Cloudinary)')
  .default('');

export const promoBannerMetadataSchema = z.object({
  imageUrl: optionalImage,
  mobileImageUrl: optionalImage,
  alt: z.string().trim().max(160, 'Alt text must be 160 characters or fewer').default(''),
  // An internal path ("/free-demo-class") or a full https URL.
  link: z
    .string()
    .trim()
    .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Link must start with / or https://')
    .default(''),
  placement: z.enum(PROMO_BANNER_PLACEMENTS),
});

export type PromoBannerMetadata = z.infer<typeof promoBannerMetadataSchema>;

/** Admin create/update body. `title` is an internal name, never shown on the site. */
export const promoBannerInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the banner a name').max(120),
    isVisible: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
    metadata: promoBannerMetadataSchema,
  })
  .refine((b) => b.metadata.imageUrl === '' || b.metadata.alt !== '', {
    message: 'Alt text is required when an image is set',
    path: ['metadata', 'alt'],
  });

export type PromoBannerInput = z.infer<typeof promoBannerInputSchema>;

/** What the public renderer needs. */
export interface PromoBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string;
  alt: string;
  link: string;
  placement: PromoBannerPlacement;
}
