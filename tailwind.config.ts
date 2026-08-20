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
          bg: 'var(--bg)',
          fg: 'var(--fg)',
          accent: '#B5C99A',
          'accent-hover': '#97A97C',
          'accent-dark': '#87986A',
          'accent-deep': '#718355',
          'red': '#E61919',
        },
      },
      fontFamily: {
        'mono': ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        'sans': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'display': ['var(--font-display)', 'Archivo Black', 'sans-serif'],
      },
      letterSpacing: {
        'tighter': '-0.03em',
      },
    },
  },
  plugins: [],
};

export default config;
