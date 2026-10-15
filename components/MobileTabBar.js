'use client'

/**
 * The mobile bottom navigation tray.
 *
 * Below `md` the sidebar is an off-canvas sheet, which meant every move between
 * the app's four main screens cost a menu open, a scan and a tap — and on a
 * phone the sheet covers the thing you were looking at. The primary
 * destinations live down here instead, in thumb reach; the sheet stays for the
 * secondary items (Settings and the info pages).
 *
 * Items come from lib/navItems.js, the same list the sidebar renders, so the two
 * cannot drift.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import UnreadBadge from '@/components/UnreadBadge'
import { MAIN_ITEMS, TAB_LABELS, isRouteActive } from '@/lib/navItems'
import { useNotificationContext } from '@/lib/NotificationProvider'
import { cn } from '@/lib/utils'

export default function MobileTabBar() {
  const pathname = usePathname()
  const { unreadCount } = useNotificationContext()

  return (
    <nav
      aria-label="Primary"
      // pb-[safe-area] keeps the row clear of the iOS home indicator; the root
      // layout already sets viewportFit: 'cover', so the inset resolves to a
      // real value instead of 0.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-subtle bg-surface-1 pb-[env(safe-area-inset-bottom)] shadow-e3 md:hidden"
    >
      <ul className="flex items-stretch">
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isRouteActive(pathname, item.href)
          const showBadge = item.badge === 'unread' && unreadCount > 0

          return (
            <li key={item.title} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // h-16 is the comfortable minimum for a two-line (icon +
                  // label) touch target; the whole tab is the hit area, not
                  // just the icon.
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-2xs font-medium',
                  'active:scale-95',
                  active
                    ? 'text-brand-300'
                    : 'text-ink-subtle hover:bg-surface-2 hover:text-ink'
                )}
              >
                {/* The same "you are here" bar the sidebar rows use, rotated to
                    sit along the tray's top edge. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-0 top-0 mx-auto h-[3px] w-8 rounded-full bg-brand-500 transition-opacity',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />

                <span className="relative">
                  <Icon className={cn('h-5 w-5', active && 'text-brand-400')} />
                  {showBadge && (
                    <UnreadBadge
                      count={unreadCount}
                      className="absolute -right-2.5 -top-1.5"
                    />
                  )}
                </span>

                <span>{TAB_LABELS[item.title] || item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
