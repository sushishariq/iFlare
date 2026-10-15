/**
 * Flare timing: how long until a flare starts, and what that urgency looks
 * like.
 *
 * These were local functions inside app/(app)/flares/page.js, which was fine
 * while that page was the only thing that could open a flare's detail sheet.
 * From Phase C /activity opens the same sheet in place instead of bouncing the
 * flare through sessionStorage and a route change, so both pages need the same
 * answers — and a second copy would be the third divergent urgency palette in a
 * codebase that already had three "success" greens.
 *
 * The window itself is the product rule and is unchanged: a flare is visible
 * from 90 minutes before it starts until 30 minutes after, and "ended" beyond
 * that.
 */

/** Minutes after start that a flare stays "Happening now" before it ends. */
export const HAPPENING_WINDOW_MINS = 30

/** Minutes before start that a flare enters the feed. */
export const VISIBILITY_WINDOW_MINS = 90

/**
 * Calendar days from `now` to `then`, ignoring the time of day.
 *
 * Not `diffMs / 86400000`: a flare at 9am tomorrow is 15 hours away but is
 * still "Tomorrow", and that is the word people actually use for it.
 */
function calendarDaysAhead(now, then) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * Time remaining/elapsed and the urgency level it implies.
 * - Positive diff: "in X min" (Starting Soon)
 * - Non-positive diff: "started X min ago" (Happening Now, up to 30 min old)
 *
 * Past the 90-minute visibility window a minute count stops being readable — a
 * flare three days out is "4320 min" — so it becomes a day word instead. The
 * feed never holds one of those (it filters to the window), but /activity does:
 * everything you have created or joined stays there, however far off it is.
 *
 * `now` is injectable so a page's minute tick can be a real data dependency of
 * the render rather than an incidental re-render that happens to pick up a new
 * `new Date()`. It defaults to the current time, which is what /flares passes
 * by omission.
 */
export function getTimeInfo(startTime, now = new Date()) {
  const start = new Date(startTime)
  const diffMs = start - now
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins > 0) {
    if (diffMins <= 15) return { text: `${diffMins} min`, urgency: 'critical', mins: diffMins }
    if (diffMins <= 30) return { text: `${diffMins} min`, urgency: 'high', mins: diffMins }
    if (diffMins <= 60) return { text: `${diffMins} min`, urgency: 'medium', mins: diffMins }
    if (diffMins <= VISIBILITY_WINDOW_MINS) {
      return { text: `${diffMins} min`, urgency: 'normal', mins: diffMins }
    }

    const days = calendarDaysAhead(now, start)
    const text =
      days === 0
        ? 'Later today'
        : days === 1
          ? 'Tomorrow'
          : days < 7
            ? start.toLocaleDateString('en-US', { weekday: 'short' })
            : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { text, urgency: 'upcoming', mins: diffMins }
  }

  // Started already — Happening Now if within the buffer, otherwise Ended.
  const ago = -diffMins
  if (ago <= HAPPENING_WINDOW_MINS) {
    return {
      text: ago === 0 ? 'Just started' : `Started ${ago} min ago`,
      urgency: 'happening',
      mins: diffMins,
    }
  }
  return { text: 'Ended', urgency: 'ended', mins: diffMins }
}

/**
 * Chip/tile styling for an urgency level.
 *
 * One map, on the semantic tokens. The raw-palette version this replaces was
 * the app's third "success" green (`green-500` here, `emerald-400` and
 * `orange-300` elsewhere) and its own yellow and red, none of which existed
 * anywhere else in the product.
 *
 * `critical` no longer carries `animate-pulse`. Pulsing the whole chip faded
 * the text it was trying to draw attention to in and out, and on the card it
 * outweighed the title — the urgency is carried by a pulsing *dot* now
 * (`getUrgencyDot`), which animates something with no content in it.
 */
const URGENCY_STYLES = {
  critical: 'border-danger/40 bg-danger/10 text-danger',
  high: 'border-brand-500/40 bg-brand-500/10 text-brand-300',
  medium: 'border-warning/40 bg-warning/10 text-warning',
  happening: 'border-success/40 bg-success/10 text-success',
  ended: 'border-line bg-surface-2 text-ink-subtle',
  upcoming: 'border-line-subtle bg-surface-2 text-ink-muted',
  normal: 'border-line-subtle bg-surface-2 text-ink-muted',
}

export function getUrgencyStyles(urgency) {
  return URGENCY_STYLES[urgency] || URGENCY_STYLES.normal
}

/**
 * The dot that sits inside an urgency chip.
 *
 * Only `critical` rings: `animate-pulse-ring` expands a `--danger` shadow, so
 * it is the one level whose colour the keyframe actually matches, and reserving
 * the motion for the last 15 minutes is what keeps it meaning something.
 */
const URGENCY_DOTS = {
  critical: 'bg-danger animate-pulse-ring',
  high: 'bg-brand-400',
  medium: 'bg-warning',
  happening: 'bg-success',
  ended: 'bg-ink-disabled',
  upcoming: 'bg-ink-subtle',
  normal: 'bg-ink-subtle',
}

export function getUrgencyDot(urgency) {
  return URGENCY_DOTS[urgency] || URGENCY_DOTS.normal
}
