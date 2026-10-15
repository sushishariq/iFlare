import * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Retuned to the shape every field in the app already overrides its way to by
 * hand: 44px tall, a filled control surface rather than `bg-transparent`, and a
 * brand border on focus.
 *
 * `text-base md:text-sm` is kept from stock on purpose — 16px is the threshold
 * below which iOS Safari zooms the viewport when a field takes focus.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-line bg-surface-3 px-3.5 py-2 text-base text-ink shadow-e1 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-ink-subtle focus:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
