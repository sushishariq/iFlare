import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Retuned off stock shadcn for this app.
 *
 * Why the sizes moved: stock's tallest variant was 40px and its default 36px,
 * while every control the product hand-rolls is already h-11/h-12/h-14 — the
 * primitive was shorter than the 44px tap target the pages had settled on, so
 * nobody used it without overriding the height. The scale now starts at that
 * target instead of ending below it.
 *
 * Two base classes from stock are deliberately gone:
 *   - `transition-colors` — globals.css already transitions colour, background,
 *     border, box-shadow, opacity and transform on every `button`, so this
 *     narrowed it and cancelled the transform on active:scale.
 *   - `focus-visible:ring-1 ring-ring` — the global :focus-visible rule is
 *     ring-2 brand with an offset; the weaker local ring only competed with it.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // A flat brand fill; shadow-brand is the coloured lift under it. Hover
        // steps to the next token down rather than using `brightness-110`,
        // which shifts a colour the palette already has a name for.
        default:
          'bg-brand-500 text-primary-foreground shadow-brand hover:bg-brand-600 active:scale-[.98]',
        // The tinted-chip treatment the pages hand-write ~18 times as
        // `bg-orange-500/10 border-orange-500/30`.
        soft: 'border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/15 active:scale-[.98]',
        destructive:
          'bg-danger-strong text-destructive-foreground shadow-e1 hover:bg-danger-strong/90 active:scale-[.98]',
        outline:
          'border border-line bg-transparent text-ink-muted shadow-e1 hover:bg-surface-2 hover:text-ink',
        secondary: 'bg-surface-2 text-ink shadow-e1 hover:bg-surface-3',
        ghost: 'text-ink-muted hover:bg-surface-2 hover:text-ink',
        link: 'text-brand-400 underline-offset-4 hover:text-brand-300 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3.5', // 36px — dense rows, inline actions
        default: 'h-11 px-5', // 44px — the tap target
        lg: 'h-13 rounded-xl px-7 text-base', // 52px — primary CTA
        icon: 'h-11 w-11', // 44² — same target, square
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
