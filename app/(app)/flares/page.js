'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Bell, Clock, Plus, Radar, RotateCw, Sparkles, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotificationContext } from '@/lib/NotificationProvider'
import { useTopBarSlot } from '@/lib/AppChromeProvider'
import { getFlareCapacity } from '@/lib/flareCapacity'
import { getTimeInfo } from '@/lib/flareTime'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { readStoredSession } from '@/lib/session'
import FlareCard, { FlareCardSkeleton } from '@/components/FlareCard'
import FlareDetailModal from '@/components/FlareDetailModal'
import FlareDetailPanel from '@/components/FlareDetailPanel'
import CreateFlareForm from '@/components/CreateFlareForm'
import FlareSearch from '@/components/FlareSearch'
import UnreadBadge from '@/components/UnreadBadge'

// Default until the stored user loads from localStorage.
const DEFAULT_USER = {
  id: null,
  name: '',
  interests: []
}

export default function FlaresPage() {
  const router = useRouter()
  const {
    permission,
    hasAskedPermission,
    requestPermission,
    unreadCount,
  } = useNotificationContext()

  // The top bar's inline search slot, present only from md up. When it exists
  // the search field is portalled into it; when it doesn't (mobile), the field
  // renders in place. Either way there is exactly one FlareSearch instance, so
  // the query and the suggestion panel never fork.
  const topBarSlot = useTopBarSlot()

  const [currentUser, setCurrentUser] = useState(DEFAULT_USER)
  const [flares, setFlares] = useState([])
  // Starts true, and that is the whole fix for the feed's worst bug: `flares`
  // began as [] while the fetch waited on a *second* effect to read
  // localStorage, so every user was told "No flares in the next 90 minutes"
  // on every visit before their data had even been requested.
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  // 'join' (default) or 'create' — replaces the old floating-button modal.
  const [mode, setMode] = useState('join')
  const [selectedFlare, setSelectedFlare] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load user from localStorage
  useEffect(() => {
    const { user: userData, ok } = readStoredSession()
    if (!ok) {
      // Nothing to fetch for — stop loading rather than leaving the skeletons
      // spinning forever behind a session that doesn't exist.
      setIsLoading(false)
      return
    }
    setCurrentUser(userData)
  }, [])

  // Fetch from the database (the API scopes the feed to the requesting user's
  // university by email domain).
  //
  // `silent` is for the background refresh: it must not drop the feed the user
  // is reading back to skeletons, and a failed refresh must not replace a
  // perfectly good feed with an error screen.
  const fetchFlares = useCallback(async ({ silent = false } = {}) => {
    if (!currentUser.id) return

    if (!silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const { token } = readStoredSession()
      // Optional-chained: accounts created before the interests field exist, and
      // the signup flow itself writes the user *before* step 4 adds interests.
      const interests = (currentUser.interests || []).join(',')

      const response = await fetchWithTimeout(
        `/api/flares?interests=${interests}&userId=${encodeURIComponent(currentUser.id)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (!response.ok) throw new Error(`Feed request failed (${response.status})`)

      const dbFlares = await response.json()
      setFlares(Array.isArray(dbFlares) ? dbFlares : [])
      setLoadError(null)
    } catch (err) {
      // A failure used to become `setFlares([])`, so a 500 and a quiet campus
      // rendered identically — the user was told there was nothing on, and
      // given no way to find out otherwise.
      console.error('Error fetching flares:', err)
      if (!silent) setLoadError('We couldn’t load your campus feed.')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [currentUser.id, currentUser.interests])

  useEffect(() => {
    fetchFlares()
  }, [fetchFlares])

  // The minute tick. It also refetches: flares appear 90 minutes before they
  // start, so a feed left open used to go stale the moment another student
  // posted one, and only a full page reload brought it back.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      fetchFlares({ silent: true })
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchFlares])

  // Filter and sort flares based on:
  // 1. Visibility window: 90 min before start → 30 min after start
  // 2. User interests match
  // 3. Sorted by start time
  //
  // Derived, not state written by an effect. As state it was always one render
  // behind `flares`: the render in which the fetch resolved still had the
  // previous (on first load, empty) filtered list, and anything reading both in
  // the same pass — the ?flare= deep link below does exactly that — saw a feed
  // that had loaded and a filtered list that had not.
  const filteredFlares = useMemo(() => {
    const nowMs = currentTime.getTime()
    const windowStart = nowMs - 30 * 60 * 1000  // events that started up to 30 min ago
    const windowEnd = nowMs + 90 * 60 * 1000    // events starting within the next 90 min

    let filtered = flares.filter(flare => {
      const startMs = new Date(flare.startTime).getTime()
      if (isNaN(startMs)) return false
      // Inside the visibility window?
      if (startMs <= windowStart || startMs > windowEnd) return false
      // Interest match?
      // Both sides optional-chained: a user document written before the
      // interests field existed threw here during render, and only once the
      // feed had data — so it presented as "spinner, then blank page".
      return flare.interests?.some(interest => currentUser.interests?.includes(interest))
    })

    // Apply interest filter if not 'all'
    if (activeFilter !== 'all') {
      filtered = filtered.filter(flare => flare.interests?.includes(activeFilter))
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(flare =>
        flare.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flare.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by start time - upcoming first
    filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()
      return timeA - timeB
    })

    return filtered
  }, [flares, activeFilter, searchQuery, currentTime, currentUser.interests])

  // Keep the open flare in step with the feed.
  //
  // A flare that leaves the feed (its window closed, or a filter excluded it)
  // must not stay open in the desktop pane, which sits beside a feed that no
  // longer contains it. One that is still there but has been refreshed — a new
  // attendee arrived in the 60s refetch — swaps in, so the pane's attendee list
  // and Join CTA don't go stale while it's on screen. The identity check is
  // what stops that second branch looping: `filteredFlares` is a new array on
  // every clock tick, but its elements are the same objects until `flares`
  // actually changes.
  useEffect(() => {
    if (!selectedFlare) return
    const live = filteredFlares.find(f => f.id === selectedFlare.id)
    if (!live) setSelectedFlare(null)
    else if (live !== selectedFlare) setSelectedFlare(live)
  }, [filteredFlares, selectedFlare])

  // Open the flare a notification pointed at.
  //
  // Notification rows used to be dead ends: you were told a flare matched your
  // interests and then left on a list with no way to reach it. They link to
  // `/flares?flare=<id>` now, and this is the other half — it waits for the
  // feed rather than racing it, says so when the flare is no longer on the
  // feed (which is a real outcome: the window is 90 minutes), and strips the
  // parameter either way so a later reload doesn't reopen it.
  //
  // `location.search` rather than `useSearchParams`, for the reason Phase E
  // recorded: that hook forces the route under a Suspense boundary whose
  // fallback would flash on every cold load of the app's main screen.
  useEffect(() => {
    if (isLoading || loadError || !currentUser.id) return

    const params = new URLSearchParams(window.location.search)
    const wanted = params.get('flare')
    if (!wanted) return

    window.history.replaceState({}, '', '/flares')

    const known = flares.find(f => f.id === wanted)
    if (!known) {
      toast.error('That flare isn’t around any more')
      return
    }
    // In the feed's list but outside its visibility window — the flare exists,
    // it just isn't showing, and silently doing nothing would look broken.
    if (!filteredFlares.some(f => f.id === wanted)) {
      toast('That flare has already started or ended', {
        description: 'You can still find it under My Activity if you joined it.',
      })
      return
    }
    setMode('join')
    setSelectedFlare(known)
  }, [isLoading, loadError, currentUser.id, flares, filteredFlares])

  // Asking for notification permission is deferred until the user has actually
  // done something (joined or created), so the request has obvious context
  // instead of firing on a timer the moment the feed loads.
  const maybeAskForNotifications = () => {
    if (hasAskedPermission || permission !== 'default') return
    setTimeout(() => requestPermission(), 600)
  }

  const handleJoinFlare = async (flareId) => {
    const target = flares.find(f => f.id === flareId)
    if (!target) return

    // The capacity rule lives in one place now. This guard used to read
    // `attendees.length < maxAttendees`, one seat looser than the rule the API
    // enforces, so the last "successful" join was optimistically shown and
    // silently rejected by a 400 nobody read.
    if (getFlareCapacity(target).isFull) {
      toast.error('That flare just filled up')
      return
    }

    const joined = {
      ...target,
      // Guarded the way lib/flareCapacity.js does: this line sits outside the
      // try below, so a flare document with no attendees array threw an
      // unhandled rejection — no rollback, no toast, the join just died.
      attendees: [...(target.attendees || []), { id: currentUser.id, name: currentUser.name }],
    }

    // Optimistic. Stay on the flare instead of closing: joining is what unlocks
    // its chat, and in the desktop pane there is nothing being covered up.
    setFlares(prev => prev.map(flare => (flare.id === flareId ? joined : flare)))
    setSelectedFlare(prev => (prev?.id === flareId ? joined : prev))

    try {
      const { token } = readStoredSession()
      const res = await fetch(`/api/flares/${flareId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Deliberately no `flareData`: the endpoint has a leftover
        // sample-data branch that *inserts* a client-supplied flare when the id
        // isn't found, which would turn a join against a stale id into a
        // silently created flare instead of the 404 this now reports.
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not join this flare')
      }

      toast.success(`You’re going to ${target.title}`)
      maybeAskForNotifications()
    } catch (err) {
      console.error('Error joining flare:', err)
      // Roll back to exactly what was there before, in both places.
      setFlares(prev => prev.map(flare => (flare.id === flareId ? target : flare)))
      setSelectedFlare(prev => (prev?.id === flareId ? target : prev))
      toast.error(err.message || 'Could not join this flare')
    }
  }

  const handleFlareCreated = (newFlare) => {
    setFlares(prev => [newFlare, ...prev])
    // No notification here: this flare is the user's own, and being told your
    // own flare matches your interests is noise. Other users are notified
    // through notifyNewFlare, which now refuses to fire on your own flare.
    maybeAskForNotifications()
    // Created flares live in Activity — that's where the user can find and
    // manage them, so land them there rather than back on a feed the flare
    // may not even appear in yet.
    router.push('/activity')
  }

  const startingSoon = filteredFlares.filter(f => getTimeInfo(f.startTime).mins > 0)
  const happeningNow = filteredFlares.filter(f => getTimeInfo(f.startTime).mins <= 0)
  const showFeed = !isLoading && !loadError

  const searchField = (
    <FlareSearch
      value={searchQuery}
      onChange={setSearchQuery}
      userId={currentUser.id}
      userInterests={currentUser.interests}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    />
  )

  return (
    <>
      {/* The top bar owns the title and the bell from md up, so this header is
          the mobile-only half of the same thing. */}
      <header className="mb-4 flex items-center justify-between gap-2 py-2 md:hidden">
        <h1 className="font-display text-xl font-bold">Flares</h1>

        <Link
          href="/notifications"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-subtle hover:text-ink"
        >
          <Bell className="h-5 w-5" />
          <UnreadBadge count={unreadCount} className="absolute -right-1 -top-1" />
        </Link>
      </header>

      {/*
        The two-pane desktop layout. Below lg this collapses to the single
        column it has always been and the detail opens as a sheet; from lg the
        feed keeps its 30rem reading width and the flare opens *beside* it, so
        the chat stays on screen while the feed is still scannable.
      */}
      <Tabs value={mode} onValueChange={setMode}>
        <div className="lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="min-w-0">
            {/* The shared segmented control, replacing one of the app's two
                divergent hand-rolled switches. Join is the default. */}
            <TabsList aria-label="Flare mode">
              <TabsTrigger value="join">
                <Zap />
                Join a flare
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus />
                Create a flare
              </TabsTrigger>
            </TabsList>

            {/* ---------------- Join mode ---------------- */}
            <TabsContent value="join" className="mt-5">
              {topBarSlot ? (
                createPortal(searchField, topBarSlot)
              ) : (
                <div className="mb-4">{searchField}</div>
              )}

              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-500/15"
                >
                  Filtered by {activeFilter} · clear
                </button>
              )}

              {showFeed && (
                <div className="mb-5 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
                    <Radar className="h-4 w-4" />
                    <span>
                      <span className="tabular">{filteredFlares.length}</span> flare
                      {filteredFlares.length === 1 ? '' : 's'} matching your interests
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                    <Clock className="h-3 w-3 shrink-0" />
                    Flares appear 90 minutes before they start and drop off once they begin.
                  </p>
                </div>
              )}

              {isLoading && <FeedSkeleton />}

              {loadError && <FeedError message={loadError} onRetry={() => fetchFlares()} />}

              {showFeed && startingSoon.length > 0 && (
                <FeedSection
                  icon={Clock}
                  iconClassName="text-brand-400"
                  title="Starting Soon"
                  count={startingSoon.length}
                >
                  {startingSoon.map(flare => (
                    <FlareCard
                      key={flare.id}
                      flare={flare}
                      currentUser={currentUser}
                      selected={selectedFlare?.id === flare.id}
                      onClick={() => setSelectedFlare(flare)}
                      timeInfo={getTimeInfo(flare.startTime)}
                    />
                  ))}
                </FeedSection>
              )}

              {showFeed && happeningNow.length > 0 && (
                <FeedSection
                  icon={Sparkles}
                  iconClassName="text-success"
                  title="Happening Now"
                  count={happeningNow.length}
                >
                  {happeningNow.map(flare => (
                    <FlareCard
                      key={flare.id}
                      flare={flare}
                      currentUser={currentUser}
                      selected={selectedFlare?.id === flare.id}
                      onClick={() => setSelectedFlare(flare)}
                      timeInfo={getTimeInfo(flare.startTime)}
                    />
                  ))}
                </FeedSection>
              )}

              {showFeed && filteredFlares.length === 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-1 py-12 text-center">
                  <Sparkles className="mx-auto mb-3 h-10 w-10 text-brand-500/70" />
                  <p className="font-display text-lg font-semibold">
                    {searchQuery || activeFilter !== 'all'
                      ? 'Nothing matches that right now'
                      : 'No flares in the next 90 minutes'}
                  </p>
                  <p className="mt-1 text-sm text-ink-subtle">Be the first to create one!</p>
                </div>
              )}

              {/* Create prompt at the end of the feed */}
              {showFeed && (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface-1/60 p-5 text-center">
                  <p className="mb-1 font-display text-base font-semibold">Nothing here for you?</p>
                  <p className="mb-4 text-sm text-ink-muted">
                    Post what you&apos;re doing and let people come to you.
                  </p>
                  <Button size="lg" className="w-full" onClick={() => setMode('create')}>
                    <Plus className="h-5 w-5" />
                    Create a flare
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ---------------- Create mode ---------------- */}
            <TabsContent value="create" className="mt-5">
              <CreateFlareForm
                currentUser={currentUser}
                onCreated={handleFlareCreated}
                onCancel={() => setMode('join')}
              />
            </TabsContent>
          </div>

          {/* Detail pane — lg and up only; it hides itself below that. */}
          <FlareDetailPanel
            flare={mode === 'join' ? selectedFlare : null}
            onClose={() => setSelectedFlare(null)}
            onJoin={() => handleJoinFlare(selectedFlare.id)}
            currentUser={currentUser}
            timeInfo={selectedFlare ? getTimeInfo(selectedFlare.startTime) : null}
          />
        </div>
      </Tabs>

      {/* Same flare, sheet form, below lg. The wrapper is what keeps the sheet
          and the pane from both being on screen for one selection. */}
      {selectedFlare && (
        <div className="lg:hidden">
          <FlareDetailModal
            flare={selectedFlare}
            onClose={() => setSelectedFlare(null)}
            onJoin={() => handleJoinFlare(selectedFlare.id)}
            currentUser={currentUser}
            timeInfo={getTimeInfo(selectedFlare.startTime)}
          />
        </div>
      )}
    </>
  )
}

/** A titled run of cards — "Starting Soon", "Happening Now". */
function FeedSection({ icon: Icon, iconClassName, title, count, children }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <span className="tabular text-sm text-ink-subtle">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/**
 * What the feed shows while it is actually fetching. Three cards rather than a
 * spinner, so the layout it is about to fill is already the shape on screen —
 * which also means the two-pane grid doesn't jump when the data lands.
 */
function FeedSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading flares">
      {[0, 1, 2].map(i => (
        <FlareCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** The state a failed fetch used to be indistinguishable from an empty campus. */
function FeedError({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger/30 bg-danger/5 px-5 py-8 text-center"
    >
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
      <p className="font-display text-lg font-semibold">{message}</p>
      <p className="mt-1 text-sm text-ink-muted">
        This is us, not your campus — there may well be flares on right now.
      </p>
      <Button variant="soft" className="mt-4" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
