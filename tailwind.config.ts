import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          'bg-light': '#F4F4F0',
          'bg-dark': '#0A0A0A',
          'fg-light': '#050505',
          'fg-dark': '#EAEAEA',
          'accent': '#B5C99A',
          'red': '#E61919',
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        'sans': ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'tighter': '-0.03em',
      },
    },
  },
  plugins: [],
};

export default config;
