import { Inter, Space_Grotesk } from 'next/font/google'

import './globals.css'
import ClientProviders from '@/components/ClientProviders'

/*
 * The product had no typeface at all — no next/font, no fontFamily in the
 * Tailwind theme — so every screen rendered in whatever the browser defaulted
 * to (Roboto on Android, SF on iOS). That single gap did more to make the app
 * read as unstyled than any other issue in the audit.
 *
 * next/font self-hosts both faces at build time and emits the CSS variables
 * tailwind.config.js points `font-sans` / `font-display` at, so there is no
 * runtime request to Google and no flash of unstyled text beyond the swap.
 */
const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  // Inter's fallback is metric-adjusted by next/font, which keeps the swap from
  // reflowing the page.
  fallback: ['system-ui', 'sans-serif'],
})

// Geometric grotesk for headings and the iFLARE wordmark. The contrast against
// Inter is what carries the hierarchy the old flat text-sm/text-xs scale lacked.
const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600', '700'],
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata = {
  title: {
    default: 'iFLARE — Real connections. Right now.',
    template: '%s · iFLARE',
  },
  description:
    'Create and join spontaneous, interest-based meetups with students from your own university.',
  applicationName: 'iFLARE',
  openGraph: {
    title: 'iFLARE — Real connections. Right now.',
    description:
      'Create and join spontaneous, interest-based meetups with students from your own university.',
    siteName: 'iFLARE',
    type: 'website',
  },
}

export const viewport = {
  // Matches --surface-0, so the mobile browser chrome blends into the app
  // instead of framing it in white.
  themeColor: '#0e1016',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // The shell has a fixed header and a bottom-anchored onboarding panel; cover
  // lets them sit against the real screen edges on notched devices.
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning is required by next-themes, which sets the
    // theme class on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-background font-sans text-ink">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
