'use client'

/**
 * The iFLARE lockup.
 *
 * There were three hand-written copies of this and they disagreed on the two
 * things a brand mark cannot disagree on: whether the Radar sits in a filled
 * tile (`bg-orange-600`) or floats bare (`text-orange-500`), and whether the
 * wordmark is one colour or two-tone. This is the single definition; the mark
 * is always the tile, the wordmark is one flat brand colour, and both scale
 * together.
 *
 * The wordmark used to split into a grey "i" and an orange "FLARE". A brand
 * name that changes colour partway through reads as a rendering fault rather
 * than a decision, so it is one colour now.
 *
 * `href` is optional because only two of the three call sites link: the info
 * pages render the lockup as a static header. When it is passed, the whole
 * lockup is a single <Link> element, which is what AppSidebar needs for
 * <SidebarMenuButton asChild>.
 */

import Link from 'next/link'
import { Radar } from 'lucide-react'

import { cn } from '@/lib/utils'

const SIZES = {
  sm: { mark: 'h-7 w-7 rounded-md', icon: 'h-4 w-4', word: 'text-sm' },
  md: { mark: 'h-8 w-8 rounded-lg', icon: 'h-5 w-5', word: 'text-lg' },
  lg: { mark: 'h-11 w-11 rounded-xl', icon: 'h-6 w-6', word: 'text-2xl' },
}

export default function Logo({ size = 'md', showWordmark = true, href, className, ...props }) {
  const scale = SIZES[size] || SIZES.md
  // A link needs no aria-label when the wordmark is visible; without it the
  // mark alone would be an unlabelled control.
  const Root = href ? Link : 'span'
  const rootProps = href ? { href, 'aria-label': showWordmark ? undefined : 'iFLARE home' } : {}

  return (
    <Root className={cn('inline-flex items-center gap-2', className)} {...rootProps} {...props}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center bg-brand-500 shadow-brand',
          scale.mark
        )}
      >
        <Radar className={cn('text-primary-foreground', scale.icon)} strokeWidth={2} />
      </span>

      {showWordmark && (
        <span
          className={cn(
            'font-display font-bold leading-none tracking-tight text-brand-500',
            scale.word
          )}
        >
          iFLARE
        </span>
      )}
    </Root>
  )
}
