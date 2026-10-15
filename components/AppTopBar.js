'use client'

/**
 * The app's top chrome.
 *
 * Before this there was one `md:hidden` bar, which meant every viewport at or
 * above 768px had *no* top chrome whatsoever — no title, no search, no bell,
 * no account control. The only nav was the sidebar, and the only way to log out
 * was an unlabelled icon on /profile.
 *
 * One bar now serves both:
 *  - below md it is what it was — space for the fixed sidebar toggle, plus the
 *    wordmark, since there is no sidebar on screen to carry it;
 *  - from md up the sidebar already shows the wordmark, so the bar carries the
 *    page title, the page's own search (portalled in — see lib/AppChromeProvider),
 *    the notification bell and the account menu.
 *
 * The title is derived from the route rather than pushed up by each page, and
 * the pages hide their own <h1> from md up, so exactly one page heading exists
 * at every viewport. Routes outside the app (the info pages, which render this
 * shell when the visitor is signed in) are absent from the map on purpose —
 * their own <h1> carries a subtitle and stays visible at every width.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Settings, User } from 'lucide-react'

import Logo from '@/components/Logo'
import UnreadBadge from '@/components/UnreadBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { useSetTopBarSlot } from '@/lib/AppChromeProvider'
import { useNotificationContext } from '@/lib/NotificationProvider'
import { useSessionUser } from '@/lib/useSessionUser'

const PAGE_TITLES = {
  '/flares': 'Flares',
  '/activity': 'My Activity',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export default function AppTopBar() {
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const setSlot = useSetTopBarSlot()
  const { unreadCount } = useNotificationContext()
  const title = PAGE_TITLES[pathname]

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line-subtle bg-surface-0/85 px-4 backdrop-blur-md sm:px-6">
      {/* Reserves the space the fixed toggle sits in, so nothing shifts when
          the icon swaps between menu and close. */}
      <span aria-hidden className="w-11 shrink-0 md:hidden" />

      {/* The sidebar carries the lockup from md up; below that there is no
          sidebar on screen, so the bar has to. */}
      <Logo href="/flares" className="md:hidden" />

      {title && (
        <h1 className="hidden truncate font-display text-xl font-bold md:block">{title}</h1>
      )}

      {/*
       * The page's search lands here. Rendered only when the sidebar reports a
       * non-mobile viewport, because a slot that merely *looked* hidden (a
       * `md:hidden` div) would still be a live portal target on a phone and
       * would swallow the field into an invisible container.
       */}
      {!isMobile && <div ref={setSlot} className="ml-auto min-w-0 max-w-sm flex-1 md:ml-6" />}

      <div className="ml-auto hidden items-center gap-1 md:flex">
        <Link
          href="/notifications"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
        >
          <Bell className="h-5 w-5" />
          <UnreadBadge count={unreadCount} className="absolute right-1.5 top-1.5" />
        </Link>

        <AccountMenu />
      </div>
    </header>
  )
}

/**
 * Account menu — the home the icon-only logout never had.
 *
 * /profile keeps its own logout button below md, where this menu isn't shown.
 * Neither confirms yet; that lands with the rest of the destructive-action
 * dialogs in Phase F.
 */
function AccountMenu() {
  const router = useRouter()
  const user = useSessionUser()

  const handleLogout = () => {
    localStorage.removeItem('iflare_user')
    localStorage.removeItem('iflare_token')
    router.push('/login')
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-2"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-brand-500 text-sm font-bold text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name || 'Your account'}</p>
          <p className="truncate text-2xs font-normal text-ink-subtle">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-danger focus:text-danger">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
