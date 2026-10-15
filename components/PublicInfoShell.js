/**
 * Chrome for the PUBLIC informational pages — /about, /contact, /feedback,
 * /privacy, /terms.
 *
 * These are for logged-out visitors arriving from the landing footer or the
 * register consent links. There is a parallel, deliberately unconnected set for
 * signed-in users at /info/* (see components/AppInfoShell.js).
 *
 * The split exists because the previous single shell chose its chrome at
 * *runtime* from localStorage: `session` began as "unknown", which rendered the
 * logged-out page, so a signed-in user's first paint was the public page — and
 * then the screen went blank while a lazily-imported, ssr:false AppShell chunk
 * downloaded. Signed-out page → blank → app. It read as being logged out.
 *
 * So: no session read, no dynamic import, no branch. This file is a server
 * component and knows nothing about authentication. Its counterpart knows
 * nothing about public visitors. Neither imports the other.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import Logo from '@/components/Logo'

export default function PublicInfoShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="app-column app-gutter py-10">
        {/* Always the landing page: this shell only ever serves logged-out
            visitors, so the destination is known at build time rather than
            being withheld until a localStorage read resolves. */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <header className="mt-8 border-b border-line-subtle pb-6">
          <Logo size="sm" className="mb-4" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
        </header>

        {/* One body grey, not two — the page's own copy and the copy inside an
            InfoSection must not differ on pages that are nothing but body copy. */}
        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-muted">
          {children}
        </div>

        <footer className="mt-14 border-t border-line-subtle pt-6">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-subtle">
            <Link href="/about" className="transition-colors hover:text-ink">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-ink">
              Contact
            </Link>
            <Link href="/feedback" className="transition-colors hover:text-ink">
              Feedback
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}

export function PublicInfoSection({ heading, children }) {
  return (
    <section>
      {heading && (
        <h2 className="mb-2 font-display text-base font-semibold text-ink">{heading}</h2>
      )}
      {/* Inherits the shell's body colour rather than setting a second one. */}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
