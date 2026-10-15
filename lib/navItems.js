/**
 * The app's navigation destinations — one list, two renderers.
 *
 * These used to live inside components/AppSidebar.js, which was fine while the
 * sidebar was the only navigation. It isn't any more: below `md` the primary
 * destinations render as a bottom tray (components/MobileTabBar.js) instead, and
 * a second hardcoded copy of the same four items is exactly the drift this
 * codebase keeps having to undo. Both renderers import from here.
 *
 * The informational routes point at the *in-app* `/info/*` copies, not the
 * public `/about` etc. Those are two deliberately separate page sets — a signed-
 * in user following this nav must stay inside the authenticated shell. See
 * components/AppInfoShell.js.
 */

import {
  Radar,
  Bell,
  CalendarCheck,
  User,
  Settings,
  MessageSquareHeart,
  Info,
  Mail,
  ShieldCheck,
  ScrollText,
} from 'lucide-react'

// `available: false` items are nav destinations the redesign introduces but
// whose pages land in a later phase — they render disabled rather than as
// links to a 404. Flip the flag when the page exists.
export const MAIN_ITEMS = [
  { title: 'Flares', href: '/flares', icon: Radar, available: true },
  { title: 'My Activity', href: '/activity', icon: CalendarCheck, available: true },
  { title: 'Notifications', href: '/notifications', icon: Bell, available: true, badge: 'unread' },
  { title: 'Profile', href: '/profile', icon: User, available: true },
]

export const SECONDARY_ITEMS = [
  { title: 'Settings', href: '/settings', icon: Settings, available: true },
  { title: 'Feedback', href: '/info/feedback', icon: MessageSquareHeart, available: true },
  { title: 'About', href: '/info/about', icon: Info, available: true },
  { title: 'Contact', href: '/info/contact', icon: Mail, available: true },
  { title: 'Privacy Policy', href: '/info/privacy', icon: ShieldCheck, available: true },
  { title: 'Terms', href: '/info/terms', icon: ScrollText, available: true },
]

/**
 * Shared active-route test. `startsWith` rather than equality so a future
 * `/flares/123` still lights the Flares row, but guarded with a `/` so `/info`
 * can never match `/information`.
 */
export function isRouteActive(pathname, href) {
  return Boolean(href && (pathname === href || pathname?.startsWith(`${href}/`)))
}

/**
 * The tray's shorter labels. "My Activity" is fine in a 288px sidebar row and
 * far too wide in a quarter-screen tab, and truncating it to "My Activi…" reads
 * as a bug rather than a choice.
 */
export const TAB_LABELS = {
  'My Activity': 'Activity',
  Notifications: 'Alerts',
}
