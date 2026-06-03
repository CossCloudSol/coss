import type { Config } from 'tailwindcss';

const config: Config = {
  // The site uses a custom theme system (CSS variables flipped via
  // `data-theme="dark"` on <html> by ThemeToggle). Wire Tailwind's `dark:`
  // utilities into the same selector so utility classes track the toggle.
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e8401c',
      },
      fontFamily: {
        heading: ['var(--font-raleway)', 'Raleway', 'sans-serif'],
        body: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        button: ['var(--font-raleway)', 'Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
