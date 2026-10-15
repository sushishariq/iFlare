'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import Logo from '@/components/Logo'
import UnreadBadge from '@/components/UnreadBadge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { MAIN_ITEMS, SECONDARY_ITEMS, isRouteActive } from '@/lib/navItems'
import { useNotificationContext } from '@/lib/NotificationProvider'

/*
 * The selected state.
 *
 * Stock shadcn's active row is `bg-sidebar-accent` + `font-medium` — a slate
 * fill, so the brand colour never appeared in the nav's selected state at all
 * and the current page read as barely distinct from a hover. This tints the
 * fill, the label and the icon, and adds the left indicator bar that says
 * "you are here" before any colour is even parsed.
 *
 * The bar is a ::before rather than an element because SidebarMenuButton styles
 * its *direct* children (`[&>svg]`, `[&>span:last-child]`); an extra child
 * would be picked up as the label.
 */
const ACTIVE_STYLES = [
  'relative',
  'before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2',
  'before:rounded-full before:bg-brand-500 before:opacity-0 before:transition-opacity',
  'data-[active=true]:before:opacity-100',
  'data-[active=true]:bg-brand-500/10 data-[active=true]:text-brand-300',
  'data-[active=true]:[&>svg]:text-brand-400',
  'data-[active=true]:hover:bg-brand-500/15 data-[active=true]:hover:text-brand-300',
].join(' ')

function NavItem({ item, isActive, unreadCount, onNavigate }) {
  const Icon = item.icon
  const showBadge = item.badge === 'unread' && unreadCount > 0

  // The icon and label must stay *direct* children of whatever the button
  // renders — the sidebar's styles target `[&>svg]` and `[&>span:last-child]`,
  // so wrapping them in an extra element breaks the row layout.
  const isLink = item.available

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild={isLink}
        isActive={isActive}
        tooltip={item.title}
        aria-disabled={!item.available}
        className={
          item.available ? ACTIVE_STYLES : `${ACTIVE_STYLES} cursor-not-allowed opacity-50`
        }
      >
        {isLink ? (
          // On mobile the sidebar is a modal sheet that does not close itself on
          // navigation — without this, tapping a row routed the page *behind* a
          // still-open sheet.
          <Link href={item.href} onClick={onNavigate}>
            <Icon />
            <span>{item.title}</span>
          </Link>
        ) : (
          <>
            <Icon />
            <span>{item.title}</span>
          </>
        )}
      </SidebarMenuButton>
      {showBadge && (
        // SidebarMenuBadge hides itself when the sidebar is collapsed to icons,
        // so the count would silently vanish; the dot rides on the row instead.
        <>
          <SidebarMenuBadge className="p-0">
            <UnreadBadge count={unreadCount} />
          </SidebarMenuBadge>
          <span className="pointer-events-none absolute right-1.5 top-1.5 hidden group-data-[collapsible=icon]:block">
            <UnreadBadge count={unreadCount} dot />
          </span>
        </>
      )}
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const { unreadCount } = useNotificationContext()
  const { isMobile, setOpenMobile } = useSidebar()

  const isActive = (href) => isRouteActive(pathname, href)
  // Only the mobile sheet needs dismissing; on desktop the sidebar is permanent.
  const closeOnNavigate = isMobile ? () => setOpenMobile(false) : undefined

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              {/* Logo emits a single <Link>, which is what asChild requires. */}
              <Logo href="/flares" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_ITEMS.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={isActive(item.href)}
                  unreadCount={unreadCount}
                  onNavigate={closeOnNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_ITEMS.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={isActive(item.href)}
                  onNavigate={closeOnNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-2xs text-ink-subtle group-data-[collapsible=icon]:hidden">
          Real connections. Right now.
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
