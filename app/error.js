'use client'

/**
 * The route-level error boundary.
 *
 * The app had none at all, which turned every render-time throw into a dead
 * end. These pages are statically prerendered with `isLoading === true`, so
 * their loading spinner is the *server-rendered* HTML — when a client throw
 * happened before the effect that clears it, nothing ever replaced the spinner
 * and the page looked like it was still loading, forever. A boundary converts
 * that into something the user can see and act on.
 *
 * `reset()` re-renders the segment without a full reload, which is usually
 * enough for a transient failure (a fetch that threw, a stale cached document).
 */

import { AlertTriangle, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </span>

      <div>
        <h1 className="font-display text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This page hit an error and couldn&apos;t finish loading.
        </p>
      </div>

      {/* The message, not the stack: enough to report it, not a wall of noise. */}
      {error?.message && (
        <p className="max-w-sm break-words rounded-lg border border-line-subtle bg-surface-1 px-3 py-2 text-xs text-ink-subtle">
          {error.message}
        </p>
      )}

      <Button onClick={reset} variant="soft">
        <RotateCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
