'use client'

import { Check, ChevronRight, MapPin, Users } from 'lucide-react'

import InterestChip from '@/components/InterestChip'
import { Skeleton } from '@/components/ui/skeleton'
import { getFlareCapacity } from '@/lib/flareCapacity'
import { getUrgencyDot } from '@/lib/flareTime'
import { interestEmoji, resolveInterest } from '@/lib/interests'
import { useInterestCatalog } from '@/lib/useInterestCatalog'
import { cn } from '@/lib/utils'

/**
 * Feed row for a single flare. Extracted from app/(app)/flares/page.js so the
 * feed, search results and any future list can share one presentation.
 *
 * Its visual weight order used to run emoji → urgency badge → title: the badge
 * was `font-bold`, coloured and pulsing while the title carried no size class
 * at all. The title now leads (`text-lg` on the display face), the two facts
 * people actually scan for — where, and how many spots are left — are readable
 * instead of `text-xs`, and urgency is a small chip whose dot does the moving.
 *
 * Attendee counts come from lib/flareCapacity.js, which is the one place that
 * knows `maxAttendees` includes the host and `attendees[]` doesn't.
 *
 * `meta` and `muted` exist for /activity, which had a second hand-written card
 * of its own — a different shape, a different urgency palette and a different
 * hover treatment for the same object. Rather than fork the card again, that
 * page passes its role badges and start date in as `meta` (a strip above the
 * title) and dims finished flares with `muted`. The feed passes neither.
 */
export default function FlareCard({
  flare,
  onClick,
  timeInfo,
  currentUser,
  meta,
  muted = false,
  selected = false,
}) {
  // The campus catalogue, so a custom interest renders with its own name
  // instead of the ✨ fallback three different customs used to share. The hook
  // is module-cached and deduped across mounts, which is what makes it safe to
  // call once per card rather than threading a catalog prop through the page.
  const { catalog } = useInterestCatalog(currentUser?.id)

  const { taken, max, nearlyFull, isFull } = getFlareCapacity(flare)
  const isHost = flare.host?.id === currentUser?.id
  const isAttending = flare.attendees?.some((a) => a.id === currentUser?.id)
  const isGoing = isHost || isAttending

  // Two, not three. Labelled chips are much wider than the emoji-only ones they
  // replace, and at 390px a third one wrapped the row onto a third line — the
  // card grew by more than the extra label was worth.
  const shown = flare.interests?.slice(0, 2) || []
  const overflow = (flare.interests?.length || 0) - shown.length

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // The card had no hover, no active and no focus treatment at all, while
        // the *secondary* activity card had two of the three.
        'group w-full rounded-xl border bg-surface-1 p-4 text-left shadow-e1',
        'transition-[transform,box-shadow,border-color] duration-200 ease-out-quart',
        'hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-e3 active:scale-[.99]',
        selected
          ? 'border-brand-500/60 shadow-e3'
          : timeInfo.urgency === 'critical'
            ? 'border-danger/30'
            : 'border-line-subtle',
        // A flare that is over is still worth listing and still opens, so it
        // recedes rather than disappearing.
        muted && 'opacity-70 hover:opacity-100'
      )}
    >
      {meta && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-line-subtle pb-3">
          {meta}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-2xl',
            muted && 'grayscale'
          )}
        >
          {interestEmoji(flare.interests?.[0])}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            {/* Two lines, not one: at 390px the urgency chip takes enough of
                the row that a single clamped line cut most titles mid-word —
                on the element the card exists to show. */}
            <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink">
              {flare.title}
            </h3>
            <UrgencyChip timeInfo={timeInfo} />
          </div>

          <p className="mb-2.5 line-clamp-1 text-sm text-ink-muted">{flare.description}</p>

          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {shown.map((interest) => (
              <InterestChip key={interest} interest={resolveInterest(interest, catalog)} size="sm" />
            ))}
            {overflow > 0 && (
              <span className="text-2xs font-medium text-ink-subtle">+{overflow} more</span>
            )}
          </div>

          {/* The two facts the feed is scanned for. Promoted out of text-xs
              text-slate-500, and the count is tabular so it stops shifting
              width as people join. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0 text-ink-subtle" />
              <span className="truncate">{flare.location?.name || 'To be decided'}</span>
            </span>
            <span
              className={cn(
                'flex items-center gap-1.5',
                isFull || nearlyFull ? 'text-brand-300' : 'text-ink-muted'
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="tabular font-medium">
                {taken}/{max}
              </span>
              <span className="text-ink-subtle">
                {isFull ? 'full' : nearlyFull ? '· 1 spot left' : 'going'}
              </span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-2xs text-ink-subtle">
            <span className="truncate">
              {/* A JS string, not JSX text — an &apos; entity here would render
                  literally, which is a live bug elsewhere in the codebase. */}
              {isHost ? "You're hosting" : `Hosted by ${flare.host?.name || 'a student'}`}
            </span>
            {isGoing && !isHost && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 font-semibold text-success">
                <Check className="h-3 w-3" />
                You&apos;re going
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 self-center text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-400" />
      </div>
    </button>
  )
}

/**
 * Time-to-start, as a chip that no longer outweighs the title: normal weight,
 * `2xs`, and the only motion is the dot's ring at `critical`.
 */
function UrgencyChip({ timeInfo }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-2xs font-medium',
        timeInfo.urgency === 'critical'
          ? 'border-danger/40 bg-danger/10 text-danger'
          : 'border-line-subtle bg-surface-2 text-ink-muted'
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', getUrgencyDot(timeInfo.urgency))} />
      <span className="tabular whitespace-nowrap">{timeInfo.text}</span>
    </span>
  )
}

/**
 * The feed's loading placeholder, kept next to the card so the two shapes stay
 * in step. Before this the page rendered an empty feed while it fetched, so
 * every visit began with "No flares in the next 90 minutes".
 */
export function FlareCardSkeleton() {
  return (
    <div className="rounded-xl border border-line-subtle bg-surface-1 p-4 shadow-e1">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}
