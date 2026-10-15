'use client'

/**
 * The one banner a form uses to say something went wrong, something worked, or
 * something is worth knowing.
 *
 * There were three divergent versions of this before: /register used a red
 * error block with an *emerald* info block under it, /forgot-password used the
 * same red with an *orange* info block, and /verify introduced a third success
 * colour on top of both — so "we sent your code" looked like a different kind
 * of message depending on which flow you were in. None of the three announced
 * itself either: an error that appears after a failed submit, several hundred
 * pixels above the button you just pressed, was silent to a screen reader.
 *
 * `role` is derived from the tone rather than passed in, because the two are
 * never independent: an error follows something the user just tried and has to
 * interrupt (assertive), while a confirmation or a hint can wait for a pause
 * (polite).
 */

import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

const TONES = {
  error: { icon: AlertCircle, className: 'border-danger/30 bg-danger/10 text-danger' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success/10 text-success' },
  info: { icon: Info, className: 'border-brand-500/30 bg-brand-500/10 text-brand-300' },
}

export default function FormBanner({ tone = 'error', icon, children, className, ...props }) {
  // Callers render this unconditionally with a possibly-empty message, so the
  // empty case belongs here rather than in five `{error && ...}` guards.
  if (!children) return null

  const variant = TONES[tone] || TONES.error
  const Icon = icon || variant.icon

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 flex animate-fade-in-up items-start gap-2 rounded-xl border p-3 text-sm',
        variant.className,
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
