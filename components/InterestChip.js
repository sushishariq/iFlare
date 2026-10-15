'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one chip used for every interest, built-in or custom.
 *
 * It replaced `INTERESTS[].color`, a per-id palette that only ever matched the
 * twelve built-ins, so a user's own interest rendered grey next to a green
 * "Sports & Fitness" — the same concept in two visual languages. One neutral
 * resting state and one brand selected state means a custom interest is
 * indistinguishable from a built-in, which is the point. (`color` and `tag`
 * are gone from lib/interests.js entirely; this is the only treatment.)
 *
 * Three shapes, picked from the handlers passed in:
 *  - `onRemove`  → a chip with an X (a selected value you can take off)
 *  - `onSelect`  → a toggle button (a suggestion you can pick)
 *  - neither     → a static label (read-only display, e.g. on a flare card)
 *
 * `onRemove` renders a real button, so that shape is a <span> wrapper: a
 * button inside a button is invalid HTML and breaks the inner click target.
 */

const BASE =
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors'

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

// On the tokens, not the raw palette: Phase D puts this chip in the feed, next
// to Badge/Button `soft`, so the two treatments of "tinted brand chip" have to
// be the same treatment.
const SELECTED = 'border-brand-500/40 bg-brand-500/10 text-brand-300'
const RESTING = 'border-line-subtle bg-surface-2 text-ink-muted'
const RESTING_INTERACTIVE = 'hover:border-line hover:bg-surface-3 hover:text-ink'
// A selected chip is still a button — deselecting it is the whole point — so it
// needs its own hover. Without one, half the chips in the app were inert to the
// pointer and looked disabled.
const SELECTED_INTERACTIVE = 'hover:border-brand-500/70 hover:bg-brand-500/25'

export default function InterestChip({
  interest,
  selected = false,
  onSelect,
  onRemove,
  size = 'md',
  className,
}) {
  if (!interest?.id) return null

  const { emoji, name, id } = interest
  const label = (
    <>
      <span aria-hidden="true">{emoji}</span>
      <span>{name || id}</span>
    </>
  )
  const shell = cn(BASE, SIZES[size] || SIZES.md, className)

  if (onRemove) {
    return (
      <span className={cn(shell, SELECTED)}>
        {label}
        <button
          type="button"
          onClick={() => onRemove(interest)}
          aria-label={`Remove ${name || id}`}
          className="-mr-1 rounded-full p-0.5 text-brand-300/70 hover:bg-brand-500/20 hover:text-brand-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  if (!onSelect) {
    return <span className={cn(shell, selected ? SELECTED : RESTING)}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(interest)}
      aria-pressed={selected}
      className={cn(
        shell,
        selected ? cn(SELECTED, SELECTED_INTERACTIVE) : cn(RESTING, RESTING_INTERACTIVE)
      )}
    >
      {label}
      {selected && <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
