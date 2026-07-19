import { themeConfig } from './src/theme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: themeConfig.colors.primary,
          light: '#34d399',
          dark: themeConfig.colors.primaryHover,
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        bg: {
          primary: themeConfig.colors.bgDark,
          secondary: themeConfig.colors.bgCard,
          tertiary: '#1a2332',
          card: 'rgba(17, 24, 39, 0.85)',
          input: 'rgba(15, 23, 42, 0.8)',
        },
        text: {
          primary: themeConfig.colors.textPrimary,
          secondary: themeConfig.colors.textSecondary,
          muted: '#64748b',
          heading: '#f8fafc',
        }
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': `${themeConfig.radius}px`,
        'lg': '14px',
        'xl': '20px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
