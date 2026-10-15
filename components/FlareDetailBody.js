'use client'

import { Check, Clock, MapPin, Plus, Timer, User, Users, X } from 'lucide-react'

import FlareChat from '@/components/FlareChat'
import InterestChip from '@/components/InterestChip'
import { Button } from '@/components/ui/button'
import { getFlareCapacity } from '@/lib/flareCapacity'
import { getUrgencyStyles } from '@/lib/flareTime'
import { resolveInterest } from '@/lib/interests'
import { useInterestCatalog } from '@/lib/useInterestCatalog'
import { cn } from '@/lib/utils'

/**
 * Everything *inside* a flare's detail view — title block, stat row, venue and
 * host, attendees, the join CTA, and the chat.
 *
 * It renders in two containers: the bottom sheet below lg (FlareDetailModal)
 * and the persistent side panel from lg up (FlareDetailPanel). One edit here
 * reaches both, which is also why the CTA now holds a single height — in the
 * panel it is permanently on screen, so a button that swung between h-16 and
 * h-14 as its state changed reflowed the whole right column.
 *
 * The three facts someone opens this for — time left, spots, start time — used
 * to be `text-xs` with `text-[10px]` labels, i.e. the smallest type on the
 * sheet. They lead it now.
 *
 * `autoFocusJoin` is on for the sheet, which is modal and traps focus anyway,
 * and off for the panel — a non-modal region must not steal focus from the feed
 * the user is still arrowing through.
 */
export default function FlareDetailBody({
  flare,
  currentUser,
  timeInfo,
  onJoin,
  onClose,
  autoFocusJoin = false,
}) {
  const { catalog } = useInterestCatalog(currentUser?.id)

  const isAttending = flare.attendees.some((a) => a.id === currentUser.id)
  const isHost = flare.host.id === currentUser.id
  const { taken, max, openSpots, isFull } = getFlareCapacity(flare)

  const startDate = new Date(flare.startTime)
  const hasEnded = timeInfo.urgency === 'ended'

  return (
    <>
      {/* Title block — leads the sheet, and stays put while the body scrolls */}
      <div className="sticky top-0 z-10 border-b border-line-subtle bg-surface-1/95 px-5 pb-4 pt-5 backdrop-blur sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {flare.interests.map((interest) => (
                <InterestChip
                  key={interest}
                  interest={resolveInterest(interest, catalog)}
                  size="sm"
                />
              ))}
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight text-ink">{flare.title}</h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-subtle hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-6">
        {/* Headline facts */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Stat
            icon={Timer}
            className={getUrgencyStyles(timeInfo.urgency)}
            value={hasEnded ? 'Ended' : timeInfo.urgency === 'happening' ? 'Now' : timeInfo.text}
            // "Started 14 min ago" doesn't fit a third of a phone-width sheet
            // under a 24px number, so the tile's own icon and value carry the
            // "started" part and the label is just the elapsed time.
            label={
              hasEnded
                ? 'this flare is over'
                : timeInfo.urgency === 'happening'
                  ? timeInfo.text.replace(/^Started /, '')
                  : 'to go'
            }
          />
          <Stat
            icon={Users}
            value={`${taken}/${max}`}
            label={isFull ? 'full' : `${openSpots} spot${openSpots === 1 ? '' : 's'} left`}
          />
          <Stat
            icon={Clock}
            value={startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            label={startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
        </div>

        <p className="mb-5 text-ink-muted">{flare.description}</p>

        {/* Venue + host */}
        <div className="mb-6 space-y-2">
          <Fact icon={MapPin} label="Venue" value={flare.location?.name || 'To be decided'} />
          <Fact icon={User} label="Host" value={flare.host.name} />
        </div>

        {/* Attendees */}
        <div className="mb-6">
          <h3 className="mb-3 font-display text-base font-semibold">
            Who&apos;s going{' '}
            <span className="tabular font-normal text-ink-subtle">
              ({taken}/{max})
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <Person name={flare.host.name} badge="Host" highlighted />
            {flare.attendees.map((attendee) => (
              <Person key={attendee.id} name={attendee.name} />
            ))}

            {/*
              One row, not N. At maxAttendees: 10 this was eight dashed "Open
              spot" placeholders, which pushed the join CTA below the fold on
              the exact flares that had the most room in them.
            */}
            {openSpots > 0 && (
              <span className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-surface-2/60 px-3 py-2 text-sm text-ink-subtle">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3"
                >
                  <Plus className="h-3 w-3" />
                </span>
                {/* One flex item, not three — `gap-2` would otherwise open a
                    second space between the number and its own word. */}
                <span>
                  <span className="tabular">{openSpots}</span> spot{openSpots === 1 ? '' : 's'} left
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Primary action. Every branch is `size="lg"` (52px) so the CTA never
            changes height between states — in the desktop panel that swing
            reflowed the column under it. */}
        {hasEnded ? (
          <div className="flex h-13 w-full items-center justify-center rounded-xl border border-line bg-surface-2 text-base font-medium text-ink-subtle">
            This flare has ended
          </div>
        ) : isHost ? (
          <Button size="lg" variant="secondary" className="w-full font-semibold" disabled>
            You&apos;re hosting this flare
          </Button>
        ) : isAttending ? (
          <Button
            size="lg"
            className="w-full border border-success/40 bg-success/15 font-semibold text-success shadow-none hover:brightness-100"
            disabled
          >
            <Check className="h-5 w-5" />
            You&apos;re going!
          </Button>
        ) : isFull ? (
          <Button size="lg" variant="secondary" className="w-full font-semibold" disabled>
            This flare is full
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onJoin}
            autoFocus={autoFocusJoin}
            className={cn(
              'w-full font-semibold',
              timeInfo.urgency === 'critical' && 'bg-danger-strong'
            )}
          >
            {timeInfo.urgency === 'critical' ? '🔥 Join now' : 'Join flare'}
          </Button>
        )}

        {/* Chat — only for participants and only while the flare is live */}
        {(isHost || isAttending) && !hasEnded && (
          <FlareChat flareId={flare.id} currentUser={currentUser} />
        )}
      </div>
    </>
  )
}

/** One headline fact. The number is the largest type on the sheet, and tabular
 *  so a ticking countdown doesn't jitter its own tile. */
function Stat({ icon: Icon, value, label, className }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-2 py-3 text-center',
        className || 'border-line-subtle bg-surface-2 text-ink'
      )}
    >
      <Icon className="mx-auto mb-1.5 h-4 w-4 opacity-70" />
      <p className="tabular truncate font-display text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1.5 truncate text-2xs opacity-70">{label}</p>
    </div>
  )
}

/** A labelled row — venue, host. */
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-2/60 p-3">
      <Icon className="h-5 w-5 shrink-0 text-brand-400" />
      <div className="min-w-0">
        <p className="text-2xs uppercase tracking-wide text-ink-subtle">{label}</p>
        <p className="truncate font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

/** An attendee chip. The host's is tinted; everyone else's is neutral. */
function Person({ name, badge, highlighted = false }) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
        highlighted
          ? 'border-brand-500/30 bg-brand-500/10 text-ink'
          : 'border-line-subtle bg-surface-2 text-ink'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold',
          highlighted ? 'bg-brand-500 text-primary-foreground' : 'bg-surface-3 text-ink-muted'
        )}
      >
        {name?.charAt(0)}
      </span>
      <span className="truncate">{name}</span>
      {badge && <span className="text-2xs font-semibold text-brand-300">{badge}</span>}
    </span>
  )
}
