'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Radar,
  Plus,
  Bell,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react'

// Scoped per account: a shared laptop shouldn't swallow the walkthrough for
// the next person who signs in, and a returning user shouldn't see it again.
const storageKeyFor = (userId) => `iflare_onboarding_seen:${userId}`

// How /settings asks for the guide back. The panel is mounted in AppShell,
// which survives navigation inside the (app) group, so clearing the flag alone
// would do nothing until the next full page load — the component that reads it
// has long since mounted. An event reaches the live instance instead.
const REPLAY_EVENT = 'iflare:replay-onboarding'

/**
 * Reopen the guide for `userId`.
 *
 * Returns false when there is no user to scope the flag to, so the caller can
 * skip its confirmation rather than promising something that won't happen.
 */
export function replayOnboarding(userId) {
  if (!userId || typeof window === 'undefined') return false
  try {
    window.localStorage.removeItem(storageKeyFor(userId))
  } catch (e) {
    return false // storage blocked — the flag can't be cleared, so don't claim it was
  }
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT))
  return true
}

const SLIDES = [
  {
    icon: Radar,
    title: 'Your flares feed',
    body: "Join is your home screen — live flares from students at your university, matched to your interests. Tap one to see it or join it.",
  },
  {
    icon: Plus,
    title: 'Create your own',
    body: 'Switch to Create at the top to post what you’re doing, how many can join, and where and when.',
  },
  {
    icon: Bell,
    title: 'Timing matters',
    body: 'Flares appear 90 minutes before they start and drop off once they begin. My Activity keeps everything you’ve created or joined.',
  },
  {
    icon: User,
    title: 'Make it yours',
    body: 'The menu has your profile, activity, notifications and settings. Your university comes from your college email.',
  },
]

/**
 * First-run guide.
 *
 * Deliberately *not* a modal: it's a small panel anchored to the bottom of the
 * screen with no backdrop and no blur, so the app it's describing stays visible
 * and fully usable while it's open. It opens by asking whether the user wants a
 * guide at all, and any click outside it — or Escape, or Skip — finishes it for
 * good.
 *
 * It is also the first thing a new user reads, and it used to run entirely at
 * the app's *smallest* type: `text-xs` body copy above `h-9 text-xs` buttons,
 * i.e. smaller than anything it was explaining. It is on the normal scale now.
 */
export default function OnboardingWalkthrough() {
  const [visible, setVisible] = useState(false)
  // 'ask' → the do-you-want-a-guide prompt; 'tour' → the slides.
  const [stage, setStage] = useState('ask')
  const [step, setStep] = useState(0)
  const [userId, setUserId] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const storedUser = window.localStorage.getItem('iflare_user')
      if (!storedUser) return // logged out — nothing to introduce yet

      const { id } = JSON.parse(storedUser)
      if (!id) return

      setUserId(id)
      if (!window.localStorage.getItem(storageKeyFor(id))) setVisible(true)
    } catch (e) {
      // ignore storage / parse errors
    }
  }, [])

  // Settings can ask for the tour back. Reset to the first slide rather than
  // resuming wherever the last run stopped — a replay is a fresh read.
  useEffect(() => {
    const onReplay = () => {
      setStage('ask')
      setStep(0)
      setVisible(true)
    }
    window.addEventListener(REPLAY_EVENT, onReplay)
    return () => window.removeEventListener(REPLAY_EVENT, onReplay)
  }, [])

  // `useCallback` because the listener effect below depends on it, and an
  // identity that changed every render would put that effect back where it
  // started: re-subscribing three document listeners on every single render.
  const dismiss = useCallback(() => {
    try {
      if (userId) window.localStorage.setItem(storageKeyFor(userId), '1')
    } catch (e) {
      // ignore
    }
    setVisible(false)
  }, [userId])

  // Escape and any click outside the panel both leave the tour. There's no
  // overlay to click, so the outside click is detected on the document —
  // which keeps the rest of the app clickable while the panel is open.
  //
  // The dependency array is the fix, not an addition: without one, all three
  // listeners were removed and re-registered on every render of a component
  // that re-renders on every step of the tour.
  useEffect(() => {
    if (!visible) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) dismiss()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Welcome guide"
      className="fixed bottom-4 left-4 right-4 z-50 animate-sheet-up rounded-2xl border border-line bg-surface-2 p-5 shadow-e4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[22rem]"
    >
      <button
        onClick={dismiss}
        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
        aria-label={stage === 'ask' ? 'Dismiss' : 'Skip guide'}
      >
        <X className="h-4 w-4" />
      </button>

      {stage === 'ask' ? (
        <AskStage onYes={() => setStage('tour')} onNo={dismiss} />
      ) : (
        <TourStage step={step} onStep={setStep} onFinish={dismiss} />
      )}
    </div>
  )
}

/** The header both stages share: a tinted icon tile beside the title. */
function PanelHeading({ icon: Icon, children }) {
  return (
    <div className="mb-3 flex items-center gap-3 pr-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10">
        <Icon className="h-5 w-5 text-brand-400" strokeWidth={1.75} />
      </span>
      <h2 className="font-display text-base font-semibold text-ink">{children}</h2>
    </div>
  )
}

/** The opening prompt — a guide is offered, never forced. */
function AskStage({ onYes, onNo }) {
  return (
    <>
      <PanelHeading icon={Sparkles}>Welcome to iFLARE</PanelHeading>

      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
        Want a quick guide? Four short tips on finding flares near you and
        posting your own. Takes about 20 seconds.
      </p>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onNo} className="flex-1">
          No thanks
        </Button>
        <Button onClick={onYes} autoFocus className="flex-1 font-semibold">
          Show me
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

function TourStage({ step, onStep, onFinish }) {
  const slide = SLIDES[step]
  const total = SLIDES.length
  const isLast = step === total - 1

  return (
    <>
      <PanelHeading icon={slide.icon}>{slide.title}</PanelHeading>

      {/* Keyed so each slide fades in rather than swapping its text in place. */}
      <p key={step} className="mb-4 animate-fade-in text-sm leading-relaxed text-ink-muted">
        {slide.body}
      </p>

      <div className="mb-4 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-200 ease-out-quart ${
              i === step ? 'w-5 bg-brand-500' : 'w-1.5 bg-surface-3'
            }`}
          />
        ))}
        <span className="tabular ml-auto text-2xs text-ink-subtle">
          {step + 1} of {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {step > 0 ? (
          <Button variant="outline" onClick={() => onStep(step - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onFinish} className="flex-1">
            Skip
          </Button>
        )}

        <Button
          onClick={() => (isLast ? onFinish() : onStep(step + 1))}
          autoFocus
          className="flex-1 font-semibold"
        >
          {isLast ? 'Let’s go' : 'Continue'}
          {!isLast && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </>
  )
}
