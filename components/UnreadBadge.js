'use client'

/**
 * The unread-count badge.
 *
 * There were three of these and they disagreed on colour: `bg-red-500` on the
 * feed's bell, `bg-orange-500` in the sidebar, and a third treatment on
 * /notifications. Red reads as an error, which unread notifications are not, so
 * the one definition is the brand fill.
 *
 * `dot` is for places with no room for a number (the collapsed icon sidebar).
 * Counts clamp at 9+ because the badge is a fixed 20px circle — a three-digit
 * number would either overflow it or shrink below legibility.
 */

import { cn } from '@/lib/utils'

export default function UnreadBadge({ count = 0, dot = false, className }) {
  if (!count) return null

  return (
    <span
      // Announced by whatever labels the control it sits on (the bell's
      // aria-label already carries "(N unread)"), so the badge itself is decor.
      aria-hidden
      className={cn(
        'pointer-events-none flex items-center justify-center rounded-full bg-brand-500 font-semibold text-primary-foreground shadow-e1',
        dot ? 'h-2 w-2' : 'tabular h-5 min-w-5 px-1 text-2xs',
        className
      )}
    >
      {dot ? null : count > 9 ? '9+' : count}
    </span>
  )
}
