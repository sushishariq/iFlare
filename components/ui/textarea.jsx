import * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * Matches Input's control tokens. min-h is raised from stock's 60px (barely two
 * lines) to 88px, because both textareas in the app — the bio field and the
 * feedback message — are prose inputs that stock sized like a one-line control.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[88px] w-full rounded-lg border border-line bg-surface-3 px-3.5 py-2.5 text-base text-ink shadow-e1 placeholder:text-ink-subtle focus:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
