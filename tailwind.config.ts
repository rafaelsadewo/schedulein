import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          green: '#C8E6C9',
          'green-dark': '#A5D6A7',
          'green-light': '#E8F5E9',
        },
      },
    },
  },
  plugins: [],
};

export default config;
