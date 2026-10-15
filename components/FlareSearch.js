'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, Sparkles, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useInterestCatalog } from '@/lib/useInterestCatalog'
import { cn } from '@/lib/utils'

/**
 * Feed search with interest recommendations that appear on focus.
 *
 * Recommendations combine the user's own interests with generally popular ones,
 * deduped and with the user's own listed first — the point is that a newly
 * focused search field suggests something useful rather than sitting empty.
 * They now resolve through the campus interest catalogue, so a student whose
 * interests are custom ones sees them here; the old `INTEREST_MAP` filter
 * silently dropped every custom interest even though the create form supports
 * them fully.
 *
 * The panel is a real combobox: `role="combobox"` on the field, `role="listbox"`
 * on the panel, arrow keys to move, Enter to select, Escape to dismiss. None of
 * that existed — the suggestions were only reachable with a pointer.
 *
 * Since Phase C this renders in two places: inline below md, and portalled into
 * the sticky top bar above it. The panel is absolutely positioned against this
 * component either way, so it follows the field into the bar; inside the bar it
 * opens over page content from a z-30 sticky ancestor, hence z-40 here.
 *
 * Searching stays entirely client-side over the already-fetched, already
 * university-scoped feed; no new endpoint is involved.
 */

// Fallback suggestions for users whose own interests are few or very niche.
const POPULAR_INTEREST_IDS = ['sports', 'social', 'food', 'tech', 'learning']

export default function FlareSearch({
  value,
  onChange,
  userId,
  userInterests = [],
  activeFilter,
  onFilterChange,
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listboxId = useId()

  const { catalog } = useInterestCatalog(userId)

  const recommended = useMemo(() => {
    const byId = new Map(catalog.map((i) => [i.id, i]))
    const mine = userInterests.filter((id) => byId.has(id))
    const ids = [...new Set([...mine, ...POPULAR_INTEREST_IDS])]
      .filter((id) => byId.has(id))
      .slice(0, 8)
    return ids.map((id) => ({ ...byId.get(id), isMine: mine.includes(id) }))
  }, [catalog, userInterests])

  // Close the suggestion panel on an outside click.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // A highlight left pointing at an option that no longer exists (the catalogue
  // arrived, the list re-ordered) would send Enter to the wrong interest.
  useEffect(() => {
    setActiveIndex((i) => (i >= recommended.length ? -1 : i))
  }, [recommended.length])

  const openPanel = () => {
    setOpen(true)
    setActiveIndex(-1)
  }

  const pickInterest = (id) => {
    onFilterChange(activeFilter === id ? 'all' : id)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (recommended.length === 0) return
      e.preventDefault()
      if (!open) {
        openPanel()
        return
      }
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((i) => (i + step + recommended.length) % recommended.length)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // Enter on a highlighted suggestion picks it; otherwise it just confirms
      // the query and dismisses the panel — the feed already filters as you
      // type, so there is nothing to submit.
      if (open && activeIndex >= 0 && recommended[activeIndex]) {
        pickInterest(recommended[activeIndex].id)
      } else {
        setOpen(false)
        e.currentTarget.blur()
      }
      return
    }

    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const activeId = open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={openPanel}
          onKeyDown={handleKeyDown}
          placeholder="Search flares near you…"
          aria-label="Search flares"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          className="h-12 rounded-xl pl-10 pr-12"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            // 44px target. It was a bare 16px icon — under half the tap target
            // every other control in the app meets.
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && recommended.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 animate-scale-in origin-top rounded-xl border border-line-subtle bg-surface-2 p-3 shadow-e4"
        >
          <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-ink-subtle">
            <Sparkles className="h-3 w-3 text-brand-400" />
            Browse by interest
          </p>
          <div id={listboxId} role="listbox" aria-label="Interests" className="flex flex-wrap gap-1.5">
            {recommended.map((interest, i) => {
              const selected = activeFilter === interest.id
              return (
                <button
                  key={interest.id}
                  id={`${listboxId}-opt-${i}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  // Keeps focus in the field, so aria-activedescendant stays the
                  // thing describing the selection.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pickInterest(interest.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium',
                    selected
                      ? 'border-brand-500/60 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
                      : 'border-line-subtle bg-surface-3 text-ink-muted hover:text-ink',
                    i === activeIndex && !selected && 'border-line-strong bg-surface-1 text-ink',
                    i === activeIndex && 'ring-2 ring-brand-500/50'
                  )}
                >
                  <span aria-hidden="true">{interest.emoji}</span>
                  {interest.name}
                  {interest.isMine && (
                    <span className="ml-0.5 text-2xs text-brand-400/80">yours</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
