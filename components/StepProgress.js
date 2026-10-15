'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Progress header for the multi-step flows (registration, password reset,
 * flare creation).
 *
 * The requirement is that the user always knows where they are, how many steps
 * there are, and what's left — so this shows all three rather than a bare bar.
 * Labels collapse to a single "Step N of M · Label" line on narrow screens
 * where a full stepper would wrap badly.
 *
 * It also owns what happens *between* steps. Both wizards change step by
 * swapping the whole subtree, which dropped focus back onto <body> and left the
 * scroll position wherever the previous step's last field was — so a keyboard
 * user had to tab in from the top of the document again, and a phone user
 * arrived halfway down the new step. Moving focus here fixes both, and gives
 * the change something a screen reader can announce.
 *
 * @param {string[]} steps        ordered step labels
 * @param {number}   currentStep  1-based index of the active step
 */
export default function StepProgress({ steps, currentStep, className }) {
  const total = steps.length
  const clamped = Math.min(Math.max(currentStep, 1), total)
  const label = steps[clamped - 1]

  /*
   * Half a segment into the current step.
   *
   * The old `clamped / total` filled 25% of a four-step wizard the instant it
   * opened, before the user had typed anything — and would have read 100% on
   * the final step, which is equally untrue while that step is still being
   * filled in. Ending the fill in the middle of the current step's segment is
   * the honest statement: these steps are behind you, this one is underway.
   */
  const percent = ((clamped - 0.5) / total) * 100

  const announceRef = useRef(null)
  const lastStep = useRef(clamped)

  useEffect(() => {
    // Skip the first run: this fires on mount too, where scrolling and stealing
    // focus would happen just because the page opened.
    if (lastStep.current === clamped) return
    lastStep.current = clamped
    window.scrollTo({ top: 0, behavior: 'smooth' })
    announceRef.current?.focus({ preventScroll: true })
  }, [clamped])

  return (
    <div className={cn('mb-8', className)}>
      {/* The focus target. It is the sr-only line rather than the bar below
          because focusing the bar would ring a 4px-tall element; landing here
          reads the new step out and puts Tab at the top of the new fields. */}
      <p ref={announceRef} tabIndex={-1} className="sr-only">
        Step {clamped} of {total}: {label}
      </p>

      {/* Compact summary — the only variant on narrow screens */}
      <div className="mb-3 flex items-baseline justify-between sm:hidden">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="tabular text-xs text-ink-subtle">
          Step {clamped} of {total}
        </p>
      </div>

      {/* Full stepper */}
      <ol className="mb-3 hidden items-center gap-1.5 sm:flex">
        {steps.map((stepLabel, i) => {
          const index = i + 1
          const isDone = index < clamped
          const isCurrent = index === clamped

          return (
            <li key={stepLabel} className="flex flex-1 items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold transition-colors',
                  isDone && 'bg-brand-500 text-primary-foreground',
                  isCurrent && 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500',
                  !isDone && !isCurrent && 'bg-surface-2 text-ink-subtle'
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : index}
              </span>
              <span
                className={cn(
                  'truncate text-xs transition-colors',
                  isCurrent ? 'font-medium text-ink' : 'text-ink-subtle'
                )}
              >
                {stepLabel}
              </span>
            </li>
          )
        })}
      </ol>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${clamped} of ${total}: ${label}`}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300 ease-out-quart"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
