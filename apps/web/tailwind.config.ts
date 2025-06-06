import type { Config } from 'tailwindcss';
// const path = require('path'); // No longer needed for this specific path construction

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // If using App Router
    // Path to shared UI package (direct relative path)
    '../../packages/ui/**/*.{ts,tsx}', // More specific to TS/TSX files
  ],
  theme: {
    extend: {
      // Extend Tailwind theme here
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
