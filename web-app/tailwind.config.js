/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#C6FF00',
          foreground: '#0F1115',
        },
        secondary: {
          DEFAULT: '#1B1D22',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: '#1B1D22',
          foreground: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#C6FF00',
          foreground: '#0F1115',
        },
        popover: {
          DEFAULT: '#1B1D22',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#1B1D22',
          foreground: '#FFFFFF',
        },
        // Custom Aura Apex colors
        'aura-bg': '#0F1115',
        'aura-card': '#1B1D22',
        'aura-primary': '#C6FF00',
        'aura-text': '#FFFFFF',
        'aura-muted': '#9CA3AF',
        'aura-border': '#2A2D35',
        'aura-success': '#22C55E',
        'aura-warning': '#F97316',
        'aura-danger': '#EF4444',
        'aura-info': '#3B82F6',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'aura-sm': '0 2px 8px rgba(0,0,0,0.3)',
        'aura-md': '0 4px 16px rgba(0,0,0,0.4)',
        'aura-lg': '0 8px 32px rgba(0,0,0,0.5)',
        'aura-primary': '0 0 20px rgba(198,255,0,0.2)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(198,255,0,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(198,255,0,0.6)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
