'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Clock, Flame, Radar, RotateCw } from 'lucide-react'

import FlareCard, { FlareCardSkeleton } from '@/components/FlareCard'
import FlareDetailModal from '@/components/FlareDetailModal'
import FlareDetailPanel from '@/components/FlareDetailPanel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTimeInfo } from '@/lib/flareTime'
import { readStoredSession } from '@/lib/session'

const EMPTY = { created: [], joined: [] }

export default function ActivityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [flares, setFlares] = useState(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'created', 'joined'
  const [selectedFlare, setSelectedFlare] = useState(null)
  // The clock every card's timing is derived from. Without it a card opened
  // before its flare started never flipped to "Ended" — the page rendered once
  // and then sat there, which is exactly the window this page is about.
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const { user: storedUser, ok } = readStoredSession()
    if (!ok) {
      // Stop loading on this path too. It used to return with isLoading still
      // true, so a redirected visitor sat on the skeletons for the whole
      // navigation — and forever if the push never resolved.
      router.push('/login')
      setIsLoading(false)
      return
    }
    setUser(storedUser)
  }, [router])

  const loadActivity = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setLoadError(null)
    try {
      const { token } = readStoredSession()
      const response = await fetch(`/api/user/${user.id}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Activity request failed (${response.status})`)

      const data = await response.json()
      setFlares({ created: data.created || [], joined: data.joined || [] })
    } catch (err) {
      // A failed fetch used to leave `flares` at its empty default, so the page
      // told you that you had never created or joined anything — the one thing
      // it exists to prove otherwise.
      console.error('Error loading activity:', err)
      setLoadError('We couldn’t load your activity.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Keep the open flare pointing at the current object. The pane sits beside
  // the list from lg up, so a reload that changed a flare must reach it too.
  useEffect(() => {
    if (!selectedFlare) return
    const live = [...flares.created, ...flares.joined].find(f => f.id === selectedFlare.id)
    if (live && live !== selectedFlare) setSelectedFlare(live)
  }, [flares, selectedFlare])

  const counts = {
    all: flares.created.length + flares.joined.length,
    created: flares.created.length,
    joined: flares.joined.length,
  }

  const visibleFlares = (
    activeTab === 'created'
      ? flares.created
      : activeTab === 'joined'
        ? flares.joined
        : [...flares.created, ...flares.joined]
  )
    .slice()
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

  const showList = !isLoading && !loadError

  return (
    <main>
      {/*
        The two-pane layout /flares uses, inherited here. It is also what
        retires the sessionStorage handoff: opening a flare from this page used
        to write it to `iflare_open_flare` and route to /flares, which remounted
        the whole feed — flashing its empty state — just to show a sheet. The
        sheet lives here now, and no navigation happens at all.
      */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="min-w-0">
            {/* The top bar carries the title from md up. */}
            <header className="py-2">
              <h1 className="font-display text-xl font-bold md:hidden">My Activity</h1>

              {/* The shared segmented control. This page's own hand-rolled
                  switch was the second of the two the primitive replaces. */}
              <TabsList aria-label="Activity filter" className="mt-4 md:mt-0">
                <TabsTrigger value="all">
                  All <span className="tabular text-ink-subtle">{counts.all}</span>
                </TabsTrigger>
                <TabsTrigger value="created">
                  Created <span className="tabular text-ink-subtle">{counts.created}</span>
                </TabsTrigger>
                <TabsTrigger value="joined">
                  Joined <span className="tabular text-ink-subtle">{counts.joined}</span>
                </TabsTrigger>
              </TabsList>
            </header>

            {/* Visibility helper */}
            <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3">
              <p className="flex items-start gap-1.5 text-xs text-ink-muted">
                <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Flares you create appear on the feed 90 minutes before they start. All of
                  yours stay here.
                </span>
              </p>
            </div>

            {/* `key` so switching tabs replays the panel's fade rather than
                swapping the rows underneath a static container. */}
            <TabsContent key={activeTab} value={activeTab} className="py-4">
              {isLoading && (
                <div className="space-y-3" aria-busy="true" aria-label="Loading your activity">
                  {[0, 1, 2].map(i => (
                    <FlareCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {loadError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-danger/30 bg-danger/5 px-5 py-8 text-center"
                >
                  <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
                  <p className="font-display text-lg font-semibold">{loadError}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Your flares are still there — this is us, not them.
                  </p>
                  <Button variant="soft" className="mt-4" onClick={loadActivity}>
                    <RotateCw className="h-4 w-4" />
                    Try again
                  </Button>
                </div>
              )}

              {showList && visibleFlares.length === 0 && (
                <EmptyState tab={activeTab} onExplore={() => router.push('/flares')} />
              )}

              {showList && visibleFlares.length > 0 && (
                <div className="space-y-3">
                  {visibleFlares.map(flare => {
                    const timeInfo = getTimeInfo(flare.startTime, currentTime)
                    const isCreator = flare.host?.id === user?.id
                    const hasEnded = timeInfo.urgency === 'ended'

                    return (
                      <FlareCard
                        key={flare.id}
                        flare={flare}
                        currentUser={user || {}}
                        timeInfo={timeInfo}
                        muted={hasEnded}
                        selected={selectedFlare?.id === flare.id}
                        onClick={() => setSelectedFlare(flare)}
                        meta={
                          <>
                            <span className="flex min-w-0 items-center gap-2">
                              <RoleBadge isCreator={isCreator} muted={hasEnded} />
                              {hasEnded && (
                                <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                                  Ended
                                </span>
                              )}
                            </span>
                            <StartsAt startTime={flare.startTime} />
                          </>
                        }
                      />
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </div>

          {/* Detail pane — lg and up only; it hides itself below that. */}
          <FlareDetailPanel
            flare={selectedFlare}
            onClose={() => setSelectedFlare(null)}
            currentUser={user || {}}
            timeInfo={selectedFlare ? getTimeInfo(selectedFlare.startTime, currentTime) : null}
          />
        </div>
      </Tabs>

      {/* Sheet form, below lg. No onJoin: everything on this page is a flare
          the user already hosts or attends, so the CTA is never the join one. */}
      {selectedFlare && (
        <div className="lg:hidden">
          <FlareDetailModal
            flare={selectedFlare}
            onClose={() => setSelectedFlare(null)}
            currentUser={user || {}}
            timeInfo={getTimeInfo(selectedFlare.startTime, currentTime)}
          />
        </div>
      )}
    </main>
  )
}

/** Hosted-by-you or joined — the one fact the feed's card never has to say. */
function RoleBadge({ isCreator, muted }) {
  const Icon = isCreator ? Flame : Check
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-semibold ${
        muted
          ? 'border-line bg-surface-2 text-ink-subtle'
          : isCreator
            ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
            : 'border-success/30 bg-success/10 text-success'
      }`}
    >
      <Icon className="h-3 w-3" />
      {isCreator ? 'You created this' : 'You joined'}
    </span>
  )
}

/**
 * When it starts, as a real `<time>`.
 *
 * The card's urgency chip says "Tomorrow" or "12 min"; this is the exact
 * moment, which the feed doesn't need but a list spanning weeks does.
 */
function StartsAt({ startTime }) {
  const date = new Date(startTime)
  if (isNaN(date.getTime())) return null

  return (
    <time
      dateTime={date.toISOString()}
      className="tabular shrink-0 text-2xs text-ink-subtle"
    >
      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
    </time>
  )
}

function EmptyState({ tab, onExplore }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-1 py-12 text-center">
      <Radar className="mx-auto mb-3 h-10 w-10 text-brand-500/70" />
      <p className="font-display text-lg font-semibold">
        {tab === 'created'
          ? "You haven't created a flare yet"
          : tab === 'joined'
            ? "You haven't joined a flare yet"
            : 'Nothing here yet'}
      </p>
      <p className="mt-1 text-sm text-ink-subtle">
        {tab === 'created'
          ? 'Post what you’re doing and let people come to you.'
          : 'Flares you join show up here, with their chat.'}
      </p>
      <Button variant="soft" className="mt-4" onClick={onExplore}>
        {tab === 'created' ? 'Create a flare' : 'Explore flares'}
      </Button>
    </div>
  )
}
