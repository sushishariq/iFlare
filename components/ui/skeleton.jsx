import { cn } from '@/lib/utils'

/*
 * A pulsing placeholder block.
 *
 * This used to be a highlight sweeping across the block, which read better as
 * "loading" — but the sweep was a linear-gradient, and gradients are no longer
 * part of the design system. The opacity pulse is the flat equivalent; it is
 * kept gentle (the block never fades far) so it doesn't read as "broken".
 */
function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} {...props} />
}

export { Skeleton }
