// file frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom Colors
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7b3ff2',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1575',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
          pink: '#ec4899',
          indigo: '#6366f1',
          teal: '#14b8a6',
          orange: '#f97316',
        },
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        dark: {
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          300: '#52525b',
          400: '#71717a',
          500: '#a1a1aa',
          600: '#d4d4d8',
          700: '#e4e4e7',
          800: '#f4f4f5',
          900: '#fafafa',
        }
      },

      // Custom Fonts
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'Monaco', 'monospace'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // Custom Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      // Custom Border Radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Custom Box Shadows
      boxShadow: {
        'glow': '0 0 20px rgba(123, 63, 242, 0.5)',
        'glow-sm': '0 0 10px rgba(123, 63, 242, 0.3)',
        'glow-lg': '0 0 40px rgba(123, 63, 242, 0.7)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(123, 63, 242, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },

      // Custom Gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-purple': 'linear-gradient(135deg, #7b3ff2 0%, #6d28d9 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'gradient-green': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-red': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-rainbow': 'linear-gradient(45deg, #ff006e, #fb5607, #ffbe0b, #8338ec, #3a86ff)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)',
      },

      // Custom Animations
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },

      // Custom Keyframes
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 5px rgba(123, 63, 242, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(123, 63, 242, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      // Custom Typography
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
      },

      // Custom Line Heights
      lineHeight: {
        '12': '3rem',
        '16': '4rem',
      },

      // Custom Z-Index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Custom Backdrop Blur
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },

      // Custom Screens for responsive design
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },

      // Custom Aspect Ratios
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },

      // Custom Container
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
  },
  plugins: [
    // Form styling plugin
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Typography plugin
    require('@tailwindcss/typography'),
    
    // Aspect ratio plugin
    require('@tailwindcss/aspect-ratio'),
    
    // Container queries plugin
    require('@tailwindcss/container-queries'),

    // Custom plugin untuk utility classes
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-3d': {
          'transform-style': 'preserve-3d',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme('colors.gray.200'),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.primary.500'),
            borderRadius: '4px',
          },
        },
      }

      const newComponents = {
        '.btn': {
          padding: theme('spacing.2') + ' ' + theme('spacing.4'),
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.card': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: theme('borderRadius.lg'),
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: theme('spacing.6'),
        },
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.input': {
          width: '100%',
          padding: theme('spacing.3') + ' ' + theme('spacing.4'),
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: theme('borderRadius.lg'),
          color: 'white',
          '&::placeholder': {
            color: theme('colors.gray.400'),
          },
          '&:focus': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: theme('colors.primary.500'),
            borderColor: 'transparent',
          },
        },
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
    },

    // Plugin untuk animasi dan efek khusus
    function({ addUtilities }) {
      addUtilities({
        '.animate-glow': {
          animation: 'glow 2s ease-in-out infinite alternate',
        },
        '.animate-float': {
          animation: 'float 6s ease-in-out infinite',
        },
        '.animate-slide-up': {
          animation: 'slideUp 0.5s ease-out',
        },
        '.animate-fade-in-up': {
          animation: 'fadeInUp 0.6s ease-out',
        },
        '.hover-lift': {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        },
        '.hover-glow': {
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 20px rgba(123, 63, 242, 0.6)',
          },
        },
      })
    }
  ],
  
  // Dark mode configuration
  darkMode: 'class',
  
  // Safelist untuk class yang mungkin tidak terdeteksi
  safelist: [
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    'animate-glow',
    'animate-float',
    'text-green-400',
    'text-red-400',
    'text-blue-400',
    'text-yellow-400',
    'text-purple-400',
    'bg-green-500/20',
    'bg-red-500/20',
    'bg-blue-500/20',
    'bg-yellow-500/20',
    'bg-purple-500/20',
    'border-green-500',
    'border-red-500',
    'border-blue-500',
    'border-yellow-500',
    'border-purple-500',
    'from-green-500',
    'from-red-500',
    'from-blue-500',
    'from-yellow-500',
    'from-purple-500',
    'to-green-600',
    'to-red-600',
    'to-blue-600',
    'to-yellow-600',
    'to-purple-600',
  ],
}