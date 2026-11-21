'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'

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
} from '@/components/ui/sidebar'
import { useNotificationContext } from '@/lib/NotificationProvider'
import ThemeToggle from '@/components/ThemeToggle'

// `available: false` items are nav destinations the redesign introduces but
// whose pages land in a later phase — they render disabled rather than as
// links to a 404. Flip the flag when the page exists.
const MAIN_ITEMS = [
  { title: 'Flares', href: '/flares', icon: Radar, available: true },
  { title: 'My Activity', href: '/activity', icon: CalendarCheck, available: true },
  { title: 'Notifications', href: '/notifications', icon: Bell, available: true, badge: 'unread' },
  { title: 'Profile', href: '/profile', icon: User, available: true },
]

const SECONDARY_ITEMS = [
  { title: 'Settings', href: '/settings', icon: Settings, available: true },
  { title: 'Feedback', href: '/feedback', icon: MessageSquareHeart, available: true },
  { title: 'About', href: '/about', icon: Info, available: true },
  { title: 'Contact', href: '/contact', icon: Mail, available: true },
  { title: 'Privacy Policy', href: '/privacy', icon: ShieldCheck, available: true },
]

function NavItem({ item, isActive, unreadCount }) {
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
        className={item.available ? 'rounded-full border border-transparent font-semibold data-[active=true]:border-orange-500/20 data-[active=true]:bg-orange-500/10 data-[active=true]:text-orange-500' : 'cursor-not-allowed opacity-50'}
      >
        {isLink ? (
          <Link href={item.href}>
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
        <SidebarMenuBadge className="bg-orange-500 text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const { unreadCount } = useNotificationContext()

  const isActive = (href) => href && (pathname === href || pathname?.startsWith(`${href}/`))

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-700">
      <SidebarHeader className="pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/flares">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600">
                  <Radar className="h-5 w-5 text-white" />
                </span>
                <span className="text-lg font-semibold tracking-[-0.03em] text-slate-100">iFLARE</span>
              </Link>
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
                <NavItem key={item.title} item={item} isActive={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 group-data-[collapsible=icon]:hidden"><ThemeToggle /></div>
        <p className="border-t border-slate-700 px-2 pt-4 text-xs leading-5 text-muted-foreground group-data-[collapsible=icon]:hidden">
          Campus plans, while they&apos;re still happening.
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
