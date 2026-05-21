/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F5D061',
          DEFAULT: '#D4AF37',
          dark: '#AA7C11',
          glint: '#FFF2B2',
        },
        sand: {
          light: '#F8F4EC',
          DEFAULT: '#E6DFD5',
          dark: '#C8BDB0',
        },
        nile: {
          light: '#1E2530',
          DEFAULT: '#0D0F12',
          dark: '#050608',
          blue: '#0F1A2A',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Amiri', 'serif'],
        sans: ['Montserrat', 'Cairo', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 20px 0 rgba(212, 175, 55, 0.15)',
        'gold-hover': '0 8px 30px 0 rgba(212, 175, 55, 0.3)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out',
        'slideUp': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'beat': 'beat 1.4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        beat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
