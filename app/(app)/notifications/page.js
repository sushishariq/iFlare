'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'

import NotificationsPanel from '@/components/NotificationsPanel'
import UnreadBadge from '@/components/UnreadBadge'
import { useNotificationContext } from '@/lib/NotificationProvider'
import { readStoredSession } from '@/lib/session'

/**
 * /notifications — the notification history as a normal authenticated page.
 *
 * Replaces the modal that used to float over the feed. Same shell, same session
 * guard and same loading treatment as the other authenticated pages; the list
 * itself is NotificationsPanel, reading the existing NotificationProvider.
 */
export default function NotificationsPage() {
  const router = useRouter()
  const { unreadCount } = useNotificationContext()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // isLoading is cleared on *both* paths. It used to be cleared only on the
    // authenticated one, so a visitor being redirected sat on the spinner for
    // the whole navigation — and forever if the push was swallowed.
    if (!readStoredSession().ok) router.push('/login')
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <main>
      {/* The shell's top bar carries the title from md up. */}
      <header className="mb-5 flex items-center gap-2 py-2 md:hidden">
        <Bell className="h-6 w-6 text-brand-500" />
        <h1 className="font-display text-xl font-bold">Notifications</h1>
        <UnreadBadge count={unreadCount} />
      </header>

      <NotificationsPanel />
    </main>
  )
}
