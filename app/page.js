'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Users,
  MapPin,
  ArrowRight,
  Clock,
  GraduationCap,
  MessageSquareHeart,
} from 'lucide-react'

const venue = (id) => CAMPUS_LOCATIONS.find((l) => l.id === id)

// Illustrative only — these are not live flares. They use the real product
// vocabulary (title / location / start time / participants) so the landing
// page previews what the feed actually looks like after signup, and the venues
// come from lib/campusLocations.js rather than being retyped here — the create
// flow only offers those names, so an invented one would preview a place no
// flare can actually be at.
const SAMPLE_FLARES = [
  { venueId: 'gym', emoji: '🏋️', title: 'Leg day, need a spotter', startsIn: 'in 40 min', taken: 2, max: 3 },
  { venueId: 'campus-cafe', emoji: '☕', title: 'Coffee run before class', startsIn: 'in 15 min', taken: 1, max: 4 },
  { venueId: 'central-library', emoji: '📚', title: 'DSA revision, quiet study', startsIn: 'in 1 hr', taken: 3, max: 5 },
  { venueId: 'campus-park', emoji: '🚴', title: 'Evening ride around campus', startsIn: 'in 25 min', taken: 2, max: 6 },
].map((flare) => ({ ...flare, location: venue(flare.venueId)?.name }))

const WHY_IT_WORKS = [
  { icon: Sparkles, text: 'Spontaneous — plans for the next hour, not next month' },
  { icon: Users, text: 'Campus-only — verified by your university email' },
  { icon: Clock, text: 'Flares go live 90 minutes before they start' },
]

export default function Home() {
  const router = useRouter()

  // Someone already signed in has no use for the pitch — the sidebar links
  // here from nothing, so reaching it means a bookmark or the browser's
  // address bar. replace(), not push(), so Back doesn't bounce them here again.
  useEffect(() => {
    try {
      if (localStorage.getItem('iflare_token') && localStorage.getItem('iflare_user')) {
        router.replace('/flares')
      }
    } catch (e) {
      // Storage blocked — treat it as signed out and show the landing page.
    }
  }, [router])

  return (
    // One solid surface, shared with the rest of the app (--background).
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* The ambient flare behind the hero. Same backdrop as the auth screens. */}

      <div className="app-column app-gutter relative py-14">
        {/* Brand + tagline + description */}
        <Reveal className="flex flex-col items-center text-center">
          {/* The mark itself comes from Logo, so the landing page can't drift
              into being a fourth version of the lockup. */}
          <Logo size="lg" showWordmark={false} className="mb-6" />

          {/* One colour, matching components/Logo.js — the hero wordmark and
              the lockup must not disagree about what the brand looks like. */}
          <h1 className="mb-2 font-display text-5xl font-bold tracking-tight text-brand-500">
            iFLARE
          </h1>

          <p className="mb-4 text-sm font-medium text-brand-400">Real connections. Right now.</p>

          <p className="max-w-sm text-balance leading-relaxed text-ink-muted">
            Spontaneous meetups with people at your own university. Post what
            you&apos;re doing in the next hour — a gym session, a coffee run, a
            study grind — and find someone on campus to do it with.
          </p>
        </Reveal>

        {/* Primary + secondary CTAs */}
        <Reveal className="mt-9 flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => router.push('/register')}>
            Get started
            <ArrowRight className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Sign in
          </Button>

          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-ink-subtle">
            <GraduationCap className="h-3.5 w-3.5" />
            Open to students at Indian universities
          </p>
        </Reveal>

        {/* Sample flares */}
        <section className="mt-14">
          <Reveal as="div">
            <h2 className="mb-1 font-display text-lg font-semibold">
              What a flare looks like
            </h2>
            <p className="mb-4 text-sm text-ink-subtle">
              A few examples. You&apos;ll only ever see flares from your own campus.
            </p>
          </Reveal>

          <ul className="flex flex-col gap-2.5">
            {SAMPLE_FLARES.map((flare, i) => (
              <Reveal
                as="li"
                key={flare.title}
                style={{ '--i': i }}
                stagger
                // Inert by design — these aren't real flares — but they looked
                // tappable and did nothing at all. A hover lift matching
                // FlareCard's says "this is the shape of the thing", and the
                // CTA above is where it actually leads.
                className="group rounded-xl border border-line-subtle bg-surface-1 p-3.5 shadow-e1 transition-[transform,box-shadow,border-color] duration-200 ease-out-quart hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-e3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-lg"
                    aria-hidden
                  >
                    {flare.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{flare.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-subtle">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {flare.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="tabular">
                          {flare.taken} of {flare.max}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-ink-muted">
                    {flare.startsIn}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Why it works */}
        <section className="mt-12 flex flex-col gap-3">
          {WHY_IT_WORKS.map(({ icon: Icon, text }, i) => (
            <Reveal
              as="div"
              key={text}
              style={{ '--i': i }}
              stagger
              className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-1 px-4 py-3 text-ink-muted"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="text-sm">{text}</span>
            </Reveal>
          ))}
        </section>

        {/* Feedback entry point */}
        <Reveal className="mt-12">
          <Link
            href="/feedback"
            className="flex items-center justify-between gap-3 rounded-xl border border-line-subtle bg-surface-1 px-4 py-3.5 hover:border-line hover:bg-surface-2"
          >
            <span className="flex items-center gap-3">
              <MessageSquareHeart className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="text-sm text-ink-muted">
                Got an idea or found a bug? Tell us.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle" />
          </Link>
        </Reveal>

        {/* Footer */}
        <footer className="mt-14 border-t border-line-subtle pt-6">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ink-subtle">
            <Link href="/about" className="hover:text-ink-muted">
              About
            </Link>
            <Link href="/contact" className="hover:text-ink-muted">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-ink-muted">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink-muted">
              Terms
            </Link>
          </nav>
          <p className="mt-4 text-center text-xs text-ink-disabled">
            iFLARE · Campus meetups, made spontaneous
          </p>
        </footer>
      </div>
    </main>
  )
}

// useLayoutEffect is the whole point below — the hidden class has to be applied
// before the browser paints, or the section flashes visible first. It doesn't
// exist on the server, so fall back to useEffect there to keep React quiet.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Scroll-triggered entrance.
 *
 * The page used to fade in four buckets on mount, driven by an `isLoaded`
 * state that starts false — which meant the server rendered the *entire*
 * landing page at `opacity-0`. Anyone whose JS was slow, blocked or errored
 * got a blank page, and so did anything reading the HTML directly.
 *
 * Here the markup ships visible and is only hidden once the client has taken
 * over and confirmed it can animate: no IntersectionObserver, or
 * prefers-reduced-motion, and the element simply stays as rendered.
 */
function Reveal({ as: Tag = 'section', stagger, className, children, ...props }) {
  const ref = useRef(null)
  const [phase, setPhase] = useState('static') // static → hidden → shown

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    setPhase('hidden')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          setPhase('shown')
          io.disconnect() // one-shot: re-scrolling past it must not re-animate
        })
      },
      // Fires slightly before the element reaches the bottom edge, so the
      // animation reads as arriving rather than catching up.
      { rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn(
        className,
        phase === 'hidden' && 'opacity-0',
        phase === 'shown' && 'animate-fade-in-up',
        phase === 'shown' && stagger && 'stagger'
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
