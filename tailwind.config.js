/** @type {import('tailwindcss').Config} */

const t = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      borderColor: {
        DEFAULT: t('border'),
        border: t('border'),
      },
      colors: {
        // shadcn-style token mappings
        border: t('border'),
        input: t('input'),
        ring: t('ring'),
        background: t('background'),
        foreground: t('foreground'),
        primary: {
          DEFAULT: t('primary'),
          foreground: t('primary-foreground'),
          hover: t('primary-hover'),
        },
        secondary: {
          DEFAULT: t('secondary'),
          foreground: t('secondary-foreground'),
        },
        destructive: {
          DEFAULT: t('destructive'),
          foreground: t('destructive-foreground'),
        },
        muted: {
          DEFAULT: t('muted'),
          foreground: t('muted-foreground'),
        },
        card: {
          DEFAULT: t('card'),
          foreground: t('card-foreground'),
        },
        popover: {
          DEFAULT: t('popover'),
          foreground: t('popover-foreground'),
        },

        // Legacy navy tokens mapped cleanly to modern neutral slate
        navy: {
          975: t('navy-975'),
          950: t('navy-950'),
          900: t('navy-900'),
          850: t('navy-850'),
          800: t('navy-800'),
          750: t('navy-750'),
          700: t('navy-700'),
          100: t('navy-100'),
          50:  t('navy-50'),
        },
        accent: {
          DEFAULT: t('accent'),
          light:   t('accent-light'),
          dark:    t('accent-dark'),
        },
        success: {
          DEFAULT: t('success'),
          light:   t('success-light'),
          dark:    t('success-dark'),
        },
        warning: {
          DEFAULT: t('warning'),
          light:   t('warning-light'),
          dark:    t('warning-dark'),
        },
        danger: {
          DEFAULT: t('danger'),
          light:   t('danger-light'),
          dark:    t('danger-dark'),
        },
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      // Standard normalized type scale (clean & properly proportioned)
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],     // 12px
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem',     { lineHeight: '1.5rem' }],   // 16px
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],  // 20px
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],     // 24px
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],   // 36px
        '5xl':  ['3rem',     { lineHeight: '1' }],        // 48px
        'elder-sm':   '0.875rem',
        'elder-base': '1rem',
        'elder-lg':   '1.125rem',
        'elder-xl':   '1.25rem',
        'elder-2xl':  '1.5rem',
      },
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
        'card': '12px',
        'pill': '999px',
      },
      boxShadow: {
        'soft':    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card':    '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'lifted':  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'subtle':  '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
