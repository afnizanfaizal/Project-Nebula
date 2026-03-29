// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', ...defaultTheme.fontFamily.sans],
        mono: ['Geist Mono', ...defaultTheme.fontFamily.mono],
      },
      typography: (theme) => ({
        zinc: {
          css: {
            '--tw-prose-body': theme('colors.zinc[700]'),
            '--tw-prose-headings': theme('colors.zinc[900]'),
            '--tw-prose-code': theme('colors.zinc[900]'),
            '--tw-prose-pre-bg': 'transparent',
            '--tw-prose-invert-body': theme('colors.zinc[300]'),
            '--tw-prose-invert-headings': theme('colors.zinc[100]'),
            '--tw-prose-invert-code': theme('colors.zinc[100]'),
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            'h1, h2, h3, h4': {
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
