/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          base:     '#0A0A0F',
          card:     '#111118',
          hover:    '#16161F',
          elevated: '#1A1A24',
          border:   '#1E1E2E',
        },
        accent: {
          purple:  '#6C63FF',
          teal:    '#00D4AA',
          red:     '#FF4757',
          amber:   '#FFB800',
          blue:    '#4A8FFF',
        },
        ink: {
          primary:   '#E8E8F0',
          secondary: '#6B6B8A',
          muted:     '#3A3A5C',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
