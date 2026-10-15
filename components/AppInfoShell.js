/**
 * Chrome for the IN-APP informational pages — /info/about, /info/contact,
 * /info/feedback, /info/privacy, /info/terms.
 *
 * These serve signed-in users reaching the same material from the sidebar or
 * Settings. There is a parallel, deliberately unconnected set for logged-out
 * visitors at /about etc. (see components/PublicInfoShell.js).
 *
 * This file is thin on purpose. The routes live inside the (app) route group,
 * so app/(app)/layout.js has already wrapped them in AppShell — the sidebar,
 * top bar and content column are supplied by the layout, server-side, on the
 * very first paint. There is no session check here and nothing to hydrate
 * before the right chrome appears, which is the whole point of the split: the
 * old shared shell picked its chrome from localStorage after mount and flashed
 * the logged-out page at every signed-in visitor.
 *
 * No Logo (the sidebar and top bar already carry the wordmark) and no public
 * footer (those destinations are in the sidebar).
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AppInfoShell({ title, subtitle, children }) {
  return (
    <>
      {/* Back to the app, never to the marketing landing page. Known here
          without a session read, because only signed-in users reach /info/*. */}
      <Link
        href="/flares"
        className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="mt-6 border-b border-line-subtle pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
      </header>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </>
  )
}

export function AppInfoSection({ heading, children }) {
  return (
    <section>
      {heading && (
        <h2 className="mb-2 font-display text-base font-semibold text-ink">{heading}</h2>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
