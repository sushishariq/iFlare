'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  MessageCircle,
  Radar,
  Trash2,
  UserPlus,
} from 'lucide-react'

import ConfirmDialog from '@/components/ConfirmDialog'
import { useNotificationContext } from '@/lib/NotificationProvider'

/**
 * Renders the in-app notification history.
 *
 * This used to be a modal floating over the feed, reached through a
 * sessionStorage handoff from the sidebar. It's now the body of
 * app/(app)/notifications/page.js — a normal page like Activity or Profile.
 * The provider API is unchanged: it still consumes markAsRead / markAllAsRead /
 * clearAll exactly as exposed.
 *
 * Every row is a link now. They were buttons whose only effect was marking
 * themselves read, so the entire screen was a list of things that had happened
 * somewhere else with no way to get there — you were told a flare matched your
 * interests and then left to find it yourself.
 */

/**
 * Where a notification actually goes.
 *
 * `flareId` is what the provider records for a flare notification, and
 * /flares reads `?flare=` to open that one; `url` is the older, coarser field
 * (always '/flares'), kept as the fallback for anything that predates this.
 */
function notificationHref(n) {
  if (n.flareId) return `/flares?flare=${encodeURIComponent(n.flareId)}`
  return n.url || '/flares'
}

// One icon per kind, so the list is scannable without reading it. `new_flare`
// is the only type the app emits today; the rest are here because
// addNotification is generic and the fallback should never be the only answer.
const TYPE_ICONS = {
  new_flare: Radar,
  join: UserPlus,
  message: MessageCircle,
}

export default function NotificationsPanel() {
  const {
    inAppNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    permission,
    requestPermission,
  } = useNotificationContext()

  const [confirmClear, setConfirmClear] = useState(false)

  // The timestamps were computed once, at mount, and never again — so a
  // notification that arrived while the page was open read "Just now"
  // permanently. This is the minute hand they were missing.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const groups = groupByDay(inAppNotifications, now)

  return (
    <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-1 shadow-e1">
      {/* Contextual permission nudge — shown here rather than as a banner
          pinned over the feed. */}
      {permission === 'default' && (
        <div className="border-b border-line-subtle bg-brand-500/10 px-5 py-3">
          <p className="text-sm text-ink">Get told when a flare matches you</p>
          <button
            onClick={requestPermission}
            className="mt-1.5 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            Turn on notifications
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex items-start gap-2 border-b border-line-subtle px-5 py-3 text-xs text-ink-subtle">
          <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Browser notifications are blocked. You can re-enable them in your
            browser&apos;s site settings.
          </span>
        </div>
      )}

      {inAppNotifications.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-ink-disabled" />
          <p className="font-display text-base font-semibold">Nothing yet</p>
          <p className="mt-1 text-sm text-ink-subtle">
            New flares matching your interests will show up here.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            {/* Day separators, so a week of history isn't one undifferentiated
                run of rows. */}
            <h2 className="sticky top-16 z-10 border-b border-line-subtle bg-surface-2/95 px-5 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle backdrop-blur">
              {group.label}
            </h2>
            <ul className="divide-y divide-line-subtle">
              {group.items.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    now={now}
                    onOpen={() => markAsRead(n.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {inAppNotifications.length > 0 && (
        <footer className="flex items-center gap-2 border-t border-line-subtle px-5 py-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Check className="h-4 w-4" />
            Mark all read
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        </footer>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear notification history?"
        description="Every notification on this device is removed. This can't be undone."
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        onConfirm={clearAll}
      />
    </div>
  )
}

function NotificationRow({ notification: n, now, onOpen }) {
  const Icon = TYPE_ICONS[n.type] || Bell
  const date = new Date(n.timestamp)
  const validDate = !isNaN(date.getTime())

  return (
    <Link
      href={notificationHref(n)}
      onClick={onOpen}
      className={`group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2 ${
        n.read ? '' : 'bg-brand-500/5'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          n.read
            ? 'border-line-subtle bg-surface-2 text-ink-subtle'
            : 'border-brand-500/30 bg-brand-500/10 text-brand-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.read ? 'font-medium text-ink-muted' : 'font-semibold text-ink'}`}>
          {n.title}
          {!n.read && <span className="sr-only"> (unread)</span>}
        </p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{n.body}</p>}
        {validDate && (
          <time dateTime={date.toISOString()} className="mt-1 block text-2xs text-ink-subtle">
            {formatRelative(date.getTime(), now)}
          </time>
        )}
      </div>

      {!n.read && (
        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      )}
      <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-ink-disabled transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-400" />
    </Link>
  )
}

/**
 * Split the (already newest-first) list into Today / Yesterday / date runs.
 *
 * Anything with an unreadable timestamp lands in its own trailing group rather
 * than being dropped — a notification you can't date is still one you may want
 * to open.
 */
function groupByDay(notifications, now) {
  const groups = []
  const today = startOfDay(new Date(now))

  for (const n of notifications) {
    const date = new Date(n.timestamp)
    const label = isNaN(date.getTime()) ? 'Earlier' : dayLabel(startOfDay(date), today)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }

  return groups
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayLabel(day, today) {
  const days = Math.round((today - day) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return day.toLocaleDateString('en-US', { weekday: 'long' })
  return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(then, now) {
  const mins = Math.round((now - then) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(then).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
