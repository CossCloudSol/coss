import type { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/lib/nap';

/** Web app manifest (/manifest.webmanifest): name, icons and colours for "Add to home screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} — IT Training in Hyderabad`,
    short_name: 'Coss',
    description: 'IT training institute in Hyderabad since 2010: courses, batches and centres in Dilsukhnagar and Ameerpet.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#005663', // same as the theme-color meta in the root layout
    icons: [
      { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
