'use client'

import { useEffect, useRef, useState } from 'react'

import FlareDetailBody from '@/components/FlareDetailBody'

/** Everything that can hold focus inside the sheet. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The flare detail sheet, for viewports below lg.
 *
 * Everything it shows lives in FlareDetailBody, shared with FlareDetailPanel —
 * the persistent side panel used from lg up. This file is just the container:
 * the overlay, the bottom-anchored panel, and the three things that make it an
 * actual modal rather than a div that happens to sit on top — Escape, a focus
 * trap, and a body scroll lock.
 *
 * Those three belong to the sheet *only*. The panel is a non-modal region by
 * design: nothing is blocked behind it, so trapping focus there would just take
 * the keyboard away from the feed beside it.
 *
 * Callers render this inside an `lg:hidden` wrapper, so the sheet and the panel
 * are never both on screen for the same selection.
 *
 * Chat behaviour is deliberately unchanged — same component, same access rule
 * (host or attendee, and only while the flare hasn't ended).
 */
export default function FlareDetailModal({ flare, onClose, onJoin, currentUser, timeInfo }) {
  const sheetRef = useRef(null)

  /*
   * Callers suppress the sheet with an `lg:hidden` wrapper rather than
   * unmounting it, so on a desktop this component still mounts — behind a
   * display:none ancestor, beside the panel that is the real detail view there.
   * Its modal behaviours must not run in that state: a scroll lock would freeze
   * the page for a sheet nobody can see, and a Tab trap would confine focus to
   * an invisible subtree. (Escape was already leaking that way before this
   * phase, closing the desktop pane that Phase C deliberately made non-modal.)
   *
   * matchMedia gates the *effects* only. The markup is identical either way, so
   * there is no hydration mismatch and nothing flashes.
   */
  const [isSheetViewport, setIsSheetViewport] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)')
    const sync = () => setIsSheetViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Escape closes the sheet — expected of any modal, and the only way out on
  // a tablet without hunting for the X.
  useEffect(() => {
    if (!isSheetViewport) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Focus trap. Without it, tabbing past the join CTA walks into the feed
      // *behind* the overlay — invisible focus, and on a phone the sheet covers
      // the whole viewport, so there is no way to see where you are.
      const sheet = sheetRef.current
      if (!sheet) return
      const focusable = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === first || !sheet.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, isSheetViewport])

  // Scroll lock. The sheet has its own scroller; without this the page behind
  // it scrolls under your finger once that scroller hits its end, and closing
  // the sheet leaves you somewhere else in the feed. Focus is returned to
  // whatever opened it — the card in the feed — on the way out.
  useEffect(() => {
    if (!isSheetViewport) return

    const opener = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [isSheetViewport])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={flare.title}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-surface-0/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="relative max-h-[88vh] w-full max-w-lg animate-sheet-up overflow-y-auto overscroll-contain rounded-t-3xl bg-surface-1 shadow-e4 sm:rounded-3xl"
      >
        {/* Drag affordance, matching the one Phase B added to Dialog/Sheet. It
            is aria-hidden: the sheet closes via the overlay, Escape or the X. */}
        <div aria-hidden="true" className="flex justify-center pt-2 sm:hidden">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        <FlareDetailBody
          flare={flare}
          currentUser={currentUser}
          timeInfo={timeInfo}
          onJoin={onJoin}
          onClose={onClose}
          autoFocusJoin
        />
      </div>
    </div>
  )
}
