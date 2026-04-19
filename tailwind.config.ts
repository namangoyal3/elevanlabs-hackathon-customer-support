import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Design tokens.
 *
 *  Palette — warm-leaning dark. #0b0c0f background with a subtle warm
 *  tint on text (off-white #ecebe6 rather than pure white) keeps the
 *  interface from feeling sterile. Surfaces step up in luminance with
 *  a hint of border-color to read as elevation, not colour inversion.
 *
 *  Accent — #1a6648 (deep green) for brand/affirmative. Alert
 *  #b3261e — sufficiently distinct from accent so colour-blind users
 *  still get the escalation signal.
 *
 *  Radii — small (4px), default (8px), large (12px). Never a single
 *  uniform large radius on everything; that's the AI-template look.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // surfaces
        bg: '#0b0c0f',
        surface: '#14161b',
        'surface-2': '#1b1e25',
        border: '#262a33',
        'border-strong': '#383d48',

        // text
        fg: '#ecebe6',
        'fg-strong': '#f8f7f3',
        'fg-muted': '#8a8f9b',
        'fg-subtle': '#5d626d',

        // brand
        accent: '#1a6648',
        'accent-fg': '#d6f0e1',
        alert: '#b3261e',
        'alert-fg': '#fbd9d4',

        // kept as muted alias so existing markup doesn't break during rollout
        muted: '#8a8f9b',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // 1.2 minor third; tight but readable for a dense dashboard
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
      },
      boxShadow: {
        // "elevation" — subtle inner highlight + outer soft shadow. Gives
        // surface cards a hand-crafted feel without drop-shadow chunk.
        card: '0 1px 0 rgb(255 255 255 / 0.03) inset, 0 1px 2px rgb(0 0 0 / 0.35)',
        focus: '0 0 0 2px rgb(26 102 72 / 0.45)',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'rise-in': 'rise-in 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
