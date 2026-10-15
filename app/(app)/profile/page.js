'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, Loader2, Building } from 'lucide-react'

import ConfirmDialog from '@/components/ConfirmDialog'
import InterestSelector from '@/components/InterestSelector'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { clearStoredSession, readStoredSession } from '@/lib/session'

const MIN_INTERESTS = 3
const BIO_MAX_LENGTH = 300

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Get email domain for community display
  const getEmailDomain = (email) => {
    if (!email) return ''
    const parts = email.split('@')
    return parts.length > 1 ? `@${parts[1]}` : ''
  }

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user: userData, token, ok } = readStoredSession()

        if (!ok) {
          router.push('/login')
          return
        }

        setUser(userData)
        setSelectedInterests(userData.interests || [])
        setBio(userData.bio || '')

        // The cached copy predates the bio field for existing accounts, so
        // refresh from the server and reconcile. This is the only fetch in the
        // app that blocks the whole page's first render, so it must not be able
        // to hang — see lib/fetchWithTimeout.js.
        const response = await fetchWithTimeout('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const { user: fresh } = await response.json()
          setUser(fresh)
          setSelectedInterests(fresh.interests || [])
          setBio(fresh.bio || '')
          localStorage.setItem('iflare_user', JSON.stringify(fresh))
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const originalInterests = user?.interests || []
  const interestsChanged =
    selectedInterests.length !== originalInterests.length ||
    selectedInterests.some(i => !originalInterests.includes(i))
  const bioChanged = bio.trim() !== (user?.bio || '')
  const hasChanges = interestsChanged || bioChanged
  const tooFewInterests = selectedInterests.length < MIN_INTERESTS

  const handleSaveSettings = async () => {
    if (tooFewInterests) {
      toast.error(`Pick at least ${MIN_INTERESTS} interests`)
      return
    }

    setIsSaving(true)
    try {
      const { token } = readStoredSession()
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          interests: selectedInterests,
          bio: bio.trim()
        })
      })

      if (response.ok) {
        // Update local storage and state
        const updatedUser = { ...user, interests: selectedInterests, bio: bio.trim() }
        localStorage.setItem('iflare_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        toast.success('Profile updated')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    clearStoredSession()
    router.push('/login')
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
      {/*
        Below md this header is the page's title bar. From md up the shell's
        top bar carries the title and the account menu carries the logout, so
        the whole thing steps aside rather than duplicating both.
      */}
      <header className="flex items-center justify-between py-2 md:hidden">
        <h1 className="font-display text-xl font-bold">Profile</h1>
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-subtle hover:text-danger"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/*
        Two columns from lg. Identity and university are read-only facts and
        belong together on the left; everything editable — bio, interests, save
        — is the right-hand working column. On one column they simply stack in
        the order they always did.
      */}
      <div className="py-6 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-20">
          {/* User Info */}
          <div className="mb-8 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand-500 font-display text-2xl font-bold text-primary-foreground">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold">{user?.name}</h2>
              <p className="truncate text-sm text-ink-muted">{user?.email}</p>
            </div>
          </div>

          {/* University (read-only, derived from email domain) */}
          <div className="mb-8">
            <h3 className="mb-2 font-display text-lg font-semibold">Your university</h3>
            <p className="mb-4 text-sm text-ink-muted">
              Flares are shared only within your campus community.
            </p>

            <div className="w-full rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 shadow-e1">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500">
                  <Building className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-ink">
                    {user?.university || 'Your campus community'}
                  </h4>
                  <p className="mt-2 text-xs font-medium text-brand-400">
                    {getEmailDomain(user?.email)} community
                  </p>
                  <p className="mt-2 text-xs text-ink-subtle">
                    You&rsquo;ll only see and be seen by other students from this domain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {/* Bio */}
          <div className="mb-8">
            <h3 className="mb-2 font-display text-lg font-semibold">About you</h3>
            <p className="mb-4 text-sm text-ink-muted">
              A line people see when you host or join a flare. Optional.
            </p>
            {/* Textarea: Enter inserts a newline and must not save. */}
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
              rows={3}
              placeholder="Second year CS. Usually at the gym or the library. Always up for chai."
              className="resize-y"
            />
            <p className="tabular mt-2 text-right text-xs text-ink-subtle">
              {bio.length}/{BIO_MAX_LENGTH}
            </p>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <h3 className="mb-2 font-display text-lg font-semibold">Your interests</h3>
            <p className="mb-4 text-sm text-ink-muted">
              They decide which flares reach you. At least {MIN_INTERESTS}.
            </p>

            {/*
              The shared picker, not a raw INTERESTS.map. The fixed 12-chip grid
              this replaces could only render the built-ins, so a custom
              interest — which the create flow and the register wizard both
              support — was invisible here and impossible to remove: it stayed
              on the account with no control that could see it.
            */}
            <InterestSelector
              value={selectedInterests}
              onChange={setSelectedInterests}
              userId={user?.id}
              min={MIN_INTERESTS}
            />
          </div>
        </div>
      </div>

      {/*
        The save bar. It used to be an ordinary button at the end of a long
        two-section scroll, so on a phone the confirmation of a change you had
        just made was off-screen. It sticks to the bottom of the viewport while
        there is something to save, and is not rendered at all when there isn't.
      */}
      {hasChanges && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-2 animate-fade-in-up border-t border-line-subtle bg-surface-0/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-xs text-ink-muted">
              {tooFewInterests
                ? `${MIN_INTERESTS - selectedInterests.length} more interest${
                    MIN_INTERESTS - selectedInterests.length === 1 ? '' : 's'
                  } to go`
                : 'You have unsaved changes'}
            </p>
            <Button
              onClick={handleSaveSettings}
              disabled={tooFewInterests || isSaving}
              className="shrink-0 font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Signing out is one tap from a page you reach by accident, and the
          session is the only thing standing between you and the login form. */}
      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Log out?"
        description="You'll need your email and password to sign back in."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onConfirm={handleLogout}
      />
    </main>
  )
}
