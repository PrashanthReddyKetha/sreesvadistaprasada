import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colours — Sree Svadista Prasada (warm amber/brown palette matching live site)
        brand: {
          DEFAULT: '#5C2406',
          dark: '#3B1504',
          light: '#FEF3E2',
        },
        accent: {
          DEFAULT: '#92400E',
          dark: '#6B2D0A',
          light: '#FFFBEB',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#FEF9C3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ["'Playfair Display'", 'Georgia', 'serif'],
      },
      spacing: {
        section: '5rem',
      },
    },
  },
  plugins: [],
}

export default config
