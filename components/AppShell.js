'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import AppSidebar from '@/components/AppSidebar'
import AppTopBar from '@/components/AppTopBar'
import MobileTabBar from '@/components/MobileTabBar'
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough'
import SwipeToToggleSidebar from '@/components/SwipeToToggleSidebar'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { AppChromeProvider } from '@/lib/AppChromeProvider'
import { cn } from '@/lib/utils'

/**
 * The authenticated application chrome: sidebar, top bar, tab bar, onboarding.
 *
 * Rendered by app/(app)/layout.js for every route in the (app) group. The
 * informational pages exist twice — public copies at /about etc. that never
 * touch this, and in-app copies at /info/* that are inside the group and so get
 * this shell from the layout, server-side. That replaced a single shell which
 * chose its chrome from localStorage after mount and flashed the logged-out
 * page at every signed-in visitor.
 *
 * Layout intent (changed in Phase C): the single mobile-style column is still
 * the default, but it is no longer the *only* option. A page with a real
 * desktop layout — the feed beside a persistent detail pane, a two-column form
 * — opts into the wider canvas by being listed below. Everything else keeps the
 * reading column, because a 68rem-wide list of settings rows is worse, not
 * better, than a 34rem one.
 */

// Route-driven rather than page-driven on purpose: a page that announced its
// own width through context could only do so *after* mount, which is one
// hydration frame of the wrong layout and a visible reflow. The route is known
// on the server.
const WIDE_ROUTES = ['/flares', '/activity', '/profile', '/settings']

export default function AppShell({ children }) {
  const pathname = usePathname()
  const isWide = WIDE_ROUTES.includes(pathname)

  return (
    <AppChromeProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          {/* The sidebar collapses to an off-canvas sheet below md, so mobile
              needs a persistent affordance to open it. */}
          <MobileSidebarToggle />

          <AppTopBar />

          <div
            className={cn(
              'app-gutter flex-1 pt-4',
              // Clears the mobile tab bar (h-16 plus the home-indicator inset);
              // from md the tray is gone and the normal bottom padding applies.
              'pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] md:pb-10',
              isWide ? 'app-canvas' : 'app-column'
            )}
          >
            {children}
          </div>
        </SidebarInset>

        <SwipeToToggleSidebar />

        {/* Primary navigation below md. The sidebar sheet keeps the secondary
            items; these four are the ones worth a permanent thumb-reach slot. */}
        <MobileTabBar />

        {/* Mounted here rather than inside /flares so it survives whichever
            authenticated page a new user lands on first. */}
        <OnboardingWalkthrough />
      </SidebarProvider>
    </AppChromeProvider>
  )
}

/**
 * The "open menu" button for the mobile sidebar.
 *
 * It only ever opens. It used to toggle, morphing into an X once the sheet was
 * open — but that X could never work: a modal Radix sheet sets
 * `pointer-events: none` on <body> and restores it only on the portalled layer,
 * and this button renders in the normal tree, outside the portal. It painted
 * above the overlay and was not a hit target, and because it sits within the
 * 288px the sheet occupies, the click landed on the sheet content rather than
 * counting as an outside-dismiss. Closing is now the sheet's own close button
 * (components/ui/sheet.jsx), which is inside the portal.
 *
 * Unmounting while open also keeps it from covering that close button.
 */
function MobileSidebarToggle() {
  const { openMobile, toggleSidebar } = useSidebar()

  if (openMobile) return null

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Open menu"
      aria-expanded={false}
      className="fixed left-3 top-2.5 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink shadow-e3 hover:border-line-strong hover:bg-surface-3 active:scale-95 md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
