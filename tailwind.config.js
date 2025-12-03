/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'tms': {
          teal: {
            light: '#f5f5f5',
            DEFAULT: '#000000',
            dark: '#404040',
          }
        },
        'tempo': {
          primary: '#000000',
          secondary: '#6b7280',
          accent: '#4b5563',
          success: '#059669',
          warning: '#d97706',
          danger: '#dc2626',
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        }
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'spin-fast': 'spin 1.5s linear infinite',
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-staggered': 'bounce 1s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'tempo': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'tempo-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'tempo-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
  safelist: [
    'before:[clip-path:path(\'M0,100_C30,90_70,90_100,100_L100,100_L0,100_Z\')]',
    'group-hover:before:[clip-path:path(\'M0,100_C30,90_70,90_100,100_L100,0_L0,0_Z\')]'
  ]
} 