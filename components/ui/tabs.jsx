'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

/*
 * Restyled as the app's segmented control, so the two divergent hand-rolled
 * switches (/flares' boxed orange-600 pair, /activity's unboxed orange-500
 * pair) can both collapse onto one primitive.
 *
 * Radix has no indicator part, so the list measures its own active trigger and
 * publishes the result as --tab-x/--tab-w for a single absolutely-positioned
 * span to follow. A MutationObserver on data-state catches selection changes
 * (Radix flips that attribute, and it is the only signal that works for both
 * click and keyboard activation), a ResizeObserver catches width changes from
 * layout or font loading. `offsetLeft` and `left: 0` both resolve against the
 * offsetParent's padding edge, so the indicator lands exactly on the trigger.
 */
const TabsList = React.forwardRef(({ className, children, ...props }, ref) => {
  const listRef = React.useRef(null)
  const [measured, setMeasured] = React.useState(false)

  // Keep the forwarded ref working while still owning a ref internally.
  React.useImperativeHandle(ref, () => listRef.current)

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const sync = () => {
      const active = list.querySelector('[role="tab"][data-state="active"]')
      if (!active) return
      list.style.setProperty('--tab-x', `${active.offsetLeft}px`)
      list.style.setProperty('--tab-w', `${active.offsetWidth}px`)
      setMeasured(true)
    }

    sync()

    const mutations = new MutationObserver(sync)
    mutations.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state'] })

    const resizes = new ResizeObserver(sync)
    resizes.observe(list)

    return () => {
      mutations.disconnect()
      resizes.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn(
        'relative inline-flex h-11 w-full items-center rounded-lg border border-line-subtle bg-surface-2 p-1 text-ink-subtle',
        className
      )}
      {...props}
    >
      {/* Hidden until the first measurement, otherwise it flashes at x=0 on
          mount before the effect runs. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-md bg-surface-1 shadow-e1 transition-[transform,width,opacity] duration-200 ease-out-quart',
          measured ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: 'var(--tab-w, 0px)', transform: 'translateX(var(--tab-x, 0px))' }}
      />
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative z-10 inline-flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-ink [&_svg]:size-4 [&_svg]:shrink-0',
      // Without this an inactive tab gave no pointer feedback at all before you
      // clicked it — the only segmented control on /flares and /activity.
      'data-[state=inactive]:hover:text-ink',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-none data-[state=active]:animate-fade-in', className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
