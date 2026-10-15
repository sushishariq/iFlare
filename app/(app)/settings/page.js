'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  BellRing,
  ChevronRight,
  LogOut,
  Sparkles,
  Trash2,
  User,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useNotificationContext } from '@/lib/NotificationProvider'
import { clearStoredSession, readStoredSession } from '@/lib/session'
import { replayOnboarding } from '@/components/OnboardingWalkthrough'

export default function SettingsPage() {
  const router = useRouter()
  const { permission, requestPermission, clearAll, inAppNotifications } =
    useNotificationContext()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [confirm, setConfirm] = useState(null) // 'logout' | 'clear' | null

  useEffect(() => {
    // isLoading is cleared on *both* paths — see lib/session.js for why the
    // read itself must not be allowed to throw.
    const { user: storedUser, ok } = readStoredSession()
    if (!ok) router.push('/login')
    else setUser(storedUser)
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    clearStoredSession()
    router.push('/login')
  }

  const handleClearHistory = () => {
    clearAll()
    toast.success('Notification history cleared')
  }

  // The tour writes a per-user "seen" flag and never shows itself again.
  // Clearing that flag is the only way back to it, and there was no control
  // that could — a user who dismissed it on their first tap lost it for good.
  const handleReplayTour = () => {
    if (!replayOnboarding(user?.id)) return
    toast.success('The guide will open on your next screen')
    router.push('/flares')
  }

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
      <header className="py-2 md:hidden">
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </header>

      {/*
        Two columns from lg. Notifications is the one section with state and
        an action, so it takes the left column on its own; Account and About
        are link lists and stack in the right. Below lg it is the single
        stack it has always been.
      */}
      <div className="space-y-8 py-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:space-y-0">
        {/* Notifications */}
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Notifications</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Get told when a flare matching your interests appears.
          </p>

          <div className="rounded-2xl border border-line-subtle bg-surface-1 p-4 shadow-e1">
            <div className="flex items-start gap-3">
              {permission === 'granted' ? (
                <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              ) : permission === 'denied' ? (
                <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" />
              ) : (
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
              )}

              <div className="min-w-0 flex-1">
                {permission === 'granted' && (
                  <>
                    <p className="text-sm font-medium text-ink">Notifications are on</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      Turn them off in your browser&apos;s site settings.
                    </p>
                  </>
                )}

                {permission === 'denied' && (
                  <>
                    <p className="text-sm font-medium text-ink">Notifications are blocked</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      Your browser is blocking them. Re-enable them in its site
                      settings for this page, then reload.
                    </p>
                  </>
                )}

                {permission === 'default' && (
                  <>
                    <p className="text-sm font-medium text-ink">Notifications are off</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      We&apos;ll only use them for flares that match your interests.
                    </p>
                    <Button size="sm" onClick={requestPermission} className="mt-3">
                      Turn on notifications
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {inAppNotifications.length > 0 && (
            <button
              onClick={() => setConfirm('clear')}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear notification history (
              <span className="tabular">{inAppNotifications.length}</span>)
            </button>
          )}
        </section>

        <div className="space-y-8">
          {/* Account */}
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold">Account</h2>
            <p className="mb-4 truncate text-sm text-ink-muted">{user?.email}</p>

            <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-1 shadow-e1">
              <Link
                href="/profile"
                className="flex items-center gap-3 border-b border-line-subtle px-4 py-3.5 transition-colors hover:bg-surface-2"
              >
                <User className="h-4 w-4 shrink-0 text-ink-subtle" />
                <span className="flex-1 text-sm text-ink">
                  Edit profile, bio and interests
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
              </Link>

              {/* The first-run guide, reachable again. */}
              <button
                onClick={handleReplayTour}
                className="flex w-full items-center gap-3 border-b border-line-subtle px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-ink-subtle" />
                <span className="flex-1 text-sm text-ink">Replay the welcome guide</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
              </button>

              <button
                onClick={() => setConfirm('logout')}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <LogOut className="h-4 w-4 shrink-0 text-danger" />
                <span className="flex-1 text-sm text-danger">Log out</span>
              </button>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="mb-4 font-display text-lg font-semibold">About</h2>
            <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-1 shadow-e1">
              {/* The /info/* copies, not the public /about etc. — these live
                  inside the (app) group, so following one keeps the sidebar
                  instead of dropping the user into logged-out chrome. */}
              {[
                { href: '/info/about', label: 'About iFLARE' },
                { href: '/info/feedback', label: 'Send feedback' },
                { href: '/info/contact', label: 'Contact' },
                { href: '/info/privacy', label: 'Privacy Policy' },
                { href: '/info/terms', label: 'Terms & Conditions' },
              ].map((item, i, arr) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 ${
                    i < arr.length - 1 ? 'border-b border-line-subtle' : ''
                  }`}
                >
                  <span className="flex-1 text-sm text-ink">{item.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Both of these were one unconfirmed tap: the history is not recoverable
          and the session is the only thing between here and the login form. */}
      <ConfirmDialog
        open={confirm === 'clear'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Clear notification history?"
        description="Every notification on this device is removed. This can't be undone."
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        onConfirm={handleClearHistory}
      />

      <ConfirmDialog
        open={confirm === 'logout'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Log out?"
        description="You'll need your email and password to sign back in."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onConfirm={handleLogout}
      />
    </main>
  )
}
