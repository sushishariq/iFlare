import * as React from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * The tinted-chip vocabulary, matching the Button `soft` variant so a page has
 * one chip to reach for instead of the three designs the audit found. `2xs` is
 * the token that replaces the arbitrary text-[10px]/text-[11px] values the
 * hand-rolled badges used.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-500 text-primary-foreground shadow-e1',
        soft: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
        secondary: 'border-transparent bg-surface-3 text-ink-muted',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        danger: 'border-danger/30 bg-danger/10 text-danger',
        outline: 'border-line text-ink-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
