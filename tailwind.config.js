const defaultTheme = require('tailwindcss/defaultTheme')

/**
 * iFLARE design system.
 *
 * Everything here is token-backed: colours resolve to the CSS variables in
 * app/globals.css, and every radius derives from a single `--radius`. The rule
 * for the rest of the codebase is that pages consume *these* names
 * (bg-surface-1, text-secondary, rounded-xl, shadow-e2) rather than raw palette
 * classes like bg-slate-800/50 — those were ~700 hardcoded utilities that had
 * drifted into nine different surface tints and two different "primary" oranges.
 *
 * Alpha modifiers work everywhere because every colour is declared with the
 * `<alpha-value>` placeholder, so `bg-brand-500/10` resolves properly instead of
 * silently dropping the opacity.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        // --font-sans / --font-display are set by next/font in app/layout.js,
        // which self-hosts both faces at build time (no runtime request).
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: [...defaultTheme.fontFamily.mono],
      },

      /*
       * xs/sm/base keep Tailwind's defaults on purpose — the audit found the app
       * is already far too small (182 of 238 size classes were text-sm/text-xs),
       * so the fix is to stop reaching for them, not to shrink the scale.
       * What's added: `2xs` as a real token to retire the arbitrary text-[10px]
       * and text-[11px] values, and progressively tighter tracking from `lg` up —
       * optical correction that large type needs and that stock Tailwind omits.
       */
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.005em' }],
        lg: ['1.125rem', { lineHeight: '1.6rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.95rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },

      colors: {
        /* Elevation ramp. Four opaque steps replace the nine translucent slate
           tints the pages had accumulated — translucent surfaces stack
           unpredictably once anything overlaps. */
        surface: {
          0: 'hsl(var(--surface-0) / <alpha-value>)',
          1: 'hsl(var(--surface-1) / <alpha-value>)',
          2: 'hsl(var(--surface-2) / <alpha-value>)',
          3: 'hsl(var(--surface-3) / <alpha-value>)',
        },
        line: {
          subtle: 'hsl(var(--line-subtle) / <alpha-value>)',
          DEFAULT: 'hsl(var(--line-default) / <alpha-value>)',
          strong: 'hsl(var(--line-strong) / <alpha-value>)',
        },
        /* Text ramp. Namespaced as `ink` rather than `text-*` so it can't
           collide with the brand `primary` fill — `text-primary` must keep
           meaning the orange in shadcn's link variant.
           `ink-subtle` is the replacement for text-slate-500, which was the
           most-used text colour in the app (100×) at roughly 4.1:1 — below AA,
           and usually paired with text-xs. This one clears 4.5:1 on surface-1. */
        ink: {
          DEFAULT: 'hsl(var(--text-primary) / <alpha-value>)',
          muted: 'hsl(var(--text-secondary) / <alpha-value>)',
          subtle: 'hsl(var(--text-tertiary) / <alpha-value>)',
          disabled: 'hsl(var(--text-disabled) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },

        brand: {
          300: 'hsl(var(--brand-300) / <alpha-value>)',
          400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)',
          600: 'hsl(var(--brand-600) / <alpha-value>)',
          700: 'hsl(var(--brand-700) / <alpha-value>)',
        },
        /* One colour per meaning. Replaces green-500 / emerald-400 / orange-300
           all standing for "success", and a --destructive of red-900 (#7f1d1d)
           that was so dark every error bypassed it for raw red-400. */
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          strong: 'hsl(var(--success-strong) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          strong: 'hsl(var(--warning-strong) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          strong: 'hsl(var(--danger-strong) / <alpha-value>)',
        },

        /* shadcn aliases. Kept so all 49 generated primitives inherit the new
           ramp without being touched; they point at the same variables. */
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        chart: {
          1: 'hsl(var(--chart-1) / <alpha-value>)',
          2: 'hsl(var(--chart-2) / <alpha-value>)',
          3: 'hsl(var(--chart-3) / <alpha-value>)',
          4: 'hsl(var(--chart-4) / <alpha-value>)',
          5: 'hsl(var(--chart-5) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'hsl(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
          ring: 'hsl(var(--sidebar-ring) / <alpha-value>)',
        },
      },

      /* One ladder, all derived from --radius, so the eight ad-hoc radii the
         audit found collapse to a scale that can be retuned in one place. */
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)', // 8px  — badges, inner chips
        md: 'calc(var(--radius) - 4px)', // 10px — small controls
        lg: 'var(--radius)', // 14px — default controls
        xl: 'calc(var(--radius) + 2px)', // 16px — cards
        '2xl': 'calc(var(--radius) + 6px)', // 20px — sheets, modals
        '3xl': 'calc(var(--radius) + 10px)', // 24px — hero surfaces
      },

      /* A dark drop shadow on a dark ground is nearly invisible, so every level
         pairs the shadow with an inset top highlight — that lit edge is what
         reads as a raised surface. */
      boxShadow: {
        e1: '0 1px 2px 0 rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.04)',
        e2: '0 2px 6px -1px rgb(0 0 0 / 0.40), 0 1px 2px -1px rgb(0 0 0 / 0.30), inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
        e3: '0 10px 24px -6px rgb(0 0 0 / 0.50), 0 2px 8px -2px rgb(0 0 0 / 0.35), inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
        e4: '0 24px 56px -12px rgb(0 0 0 / 0.65), 0 8px 20px -8px rgb(0 0 0 / 0.45), inset 0 1px 0 0 rgb(255 255 255 / 0.07)',
        brand: '0 6px 20px -6px hsl(var(--brand-500) / 0.45), inset 0 1px 0 0 rgb(255 255 255 / 0.14)',
        'focus-brand': '0 0 0 2px hsl(var(--surface-0)), 0 0 0 4px hsl(var(--brand-500) / 0.65)',
      },

      /*
       * Gradients are deliberately not part of this design system any more.
       *
       * `gradient-brand` (the button/avatar/logo face), `gradient-urgent` (the
       * critical-flare CTA), `gradient-glow` (the ambient haze behind hero and
       * empty states) and `shimmer` (the skeleton sweep) were all removed in
       * favour of flat token fills — the brand reads as one colour rather than
       * a range, and a flat fill is one value to retune instead of two stops.
       *
       * The one survivor is the chat day-separator rule, which is a fade to
       * transparent at both ends rather than a colour blend: a solid 1px line
       * there would box in the date label.
       */
      backgroundImage: {
        'gradient-hairline':
          'linear-gradient(90deg, transparent, hsl(var(--line-strong) / 0.9), transparent)',
      },

      spacing: {
        13: '3.25rem', // 52px — large CTA height
        18: '4.5rem',
      },

      maxWidth: {
        // The reading column and the wider desktop canvas. Both are CSS
        // variables so the breakpoint ladder lives in globals.css next to the
        // rest of the tokens, not spread across responsive utilities.
        column: 'var(--app-column-width)',
        canvas: 'var(--app-canvas-width)',
      },

      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-back': 'cubic-bezier(0.34, 1.4, 0.64, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
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
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'sheet-down': { from: { transform: 'none' }, to: { transform: 'translateY(100%)' } },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        // Lets "live/urgent" be a pulsing ring on a dot instead of animate-pulse
        // on a whole container, which was fading out entire cards and stat tiles.
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--danger) / 0.55)' },
          '70%, 100%': { boxShadow: '0 0 0 7px hsl(var(--danger) / 0)' },
        },
        // components/ui/input-otp.jsx already asks for animate-caret-blink; the
        // keyframe was never defined, so the OTP caret has always been static.
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) both',
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.25, 1, 0.5, 1) both',
        'fade-in-down': 'fade-in-down 0.35s cubic-bezier(0.25, 1, 0.5, 1) both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.25, 1, 0.5, 1) both',
        'sheet-down': 'sheet-down 0.22s cubic-bezier(0.76, 0, 0.24, 1) both',
        pop: 'pop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
