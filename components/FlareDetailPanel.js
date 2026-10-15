'use client'

import { Radar } from 'lucide-react'

import FlareDetailBody from '@/components/FlareDetailBody'

/**
 * The desktop detail pane — the second half of the two-pane layout on /flares
 * and /activity, from lg up.
 *
 * The user's brief for the desktop work was that the old layout "just extended
 * and widened the phone interface". This is the part that stops doing that: on
 * a wide screen, opening a flare no longer throws a sheet over the entire feed.
 * The feed stays where it is, the flare opens beside it, and its chat stays on
 * screen while you keep scanning — which is the whole reason a chat that lives
 * inside a modal was hard to use.
 *
 * It is a region, not a dialog: no overlay, no focus trap, no Escape handler,
 * and no autofocus on the CTA. Nothing is blocked behind it, so treating it as
 * modal would only take the keyboard away from the feed.
 */
export default function FlareDetailPanel({ flare, onClose, onJoin, currentUser, timeInfo }) {
  return (
    <aside
      aria-label="Flare details"
      // Sticks below the 4rem top bar, and scrolls internally so a long
      // attendee list plus a chat can't push the feed's own scroll height out.
      className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-line-subtle lg:bg-surface-1 lg:shadow-e2"
    >
      {flare ? (
        <FlareDetailBody
          // Remounting per flare resets the panel's scroll position and the
          // chat's state; without the key, switching flares would leave you
          // halfway down the previous one's attendee list.
          key={flare.id}
          flare={flare}
          currentUser={currentUser}
          timeInfo={timeInfo}
          onJoin={onJoin}
          onClose={onClose}
        />
      ) : (
        <EmptyPanel />
      )}
    </aside>
  )
}

/** What the pane says before anything is selected. */
function EmptyPanel() {
  return (
    <div className="relative flex min-h-[24rem] flex-col items-center justify-center overflow-hidden px-8 text-center">
      <Radar className="mb-4 h-10 w-10 text-brand-500/70" />
      <p className="font-display text-lg font-semibold">Pick a flare</p>
      <p className="mt-1 max-w-xs text-sm text-ink-subtle">
        Details, who&apos;s going and the group chat open here — the feed stays where it is.
      </p>
    </div>
  )
}
