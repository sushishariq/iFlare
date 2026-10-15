'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, Loader2, Send } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * FlareChat — a minimal per-flare group chat.
 *
 * Design goals:
 *  - Signal, not noise: no reactions/typing/read-receipts.
 *  - Participants only (host + attendees); backend also enforces this.
 *  - Cheap: polls only while this component is mounted (i.e. the detail sheet
 *    or panel is open), uses ?since=<lastCreatedAt> so each poll returns just
 *    deltas.
 *
 * Two Phase D changes to how it reads and behaves:
 *  - Consecutive messages from one sender are one group with one name on top.
 *    Every bubble used to repeat the sender's name, including your own, which
 *    in a two-person chat meant the names outnumbered the words.
 *  - Polling no longer yanks the scroller to the bottom every 6 seconds. It
 *    only auto-scrolls when you were already at the bottom; otherwise a "new
 *    messages" pill appears and you decide.
 *
 * Props:
 *  - flareId   : string
 *  - currentUser : { id, name }
 */

/** How close to the bottom still counts as "following the conversation". */
const AT_BOTTOM_SLOP_PX = 48

export default function FlareChat({ flareId, currentUser }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [hasUnseen, setHasUnseen] = useState(false)
  const listRef = useRef(null)
  const lastCreatedAtRef = useRef(null) // ISO string of most-recent createdAt

  const isAtBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_SLOP_PX
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
      setHasUnseen(false)
    })
  }, [])

  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/flares/${flareId}/messages?userId=${encodeURIComponent(currentUser.id)}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Unable to load chat')
        return
      }
      const data = await res.json()
      const msgs = Array.isArray(data.messages) ? data.messages : []
      setMessages(msgs)
      if (msgs.length > 0) {
        lastCreatedAtRef.current = msgs[msgs.length - 1].createdAt
      }
      setError('')
    } catch (e) {
      setError('Network error')
    } finally {
      setLoadingInitial(false)
      scrollToBottom()
    }
  }, [flareId, currentUser.id, scrollToBottom])

  const fetchDelta = useCallback(async () => {
    if (!lastCreatedAtRef.current) return
    try {
      const since = encodeURIComponent(lastCreatedAtRef.current)
      const res = await fetch(
        `/api/flares/${flareId}/messages?userId=${encodeURIComponent(currentUser.id)}&since=${since}`
      )
      if (!res.ok) return
      const data = await res.json()
      const newer = Array.isArray(data.messages) ? data.messages : []
      if (newer.length === 0) return

      // Decide *before* the state update: once React re-renders with the new
      // messages the scroller is already taller, so "were you at the bottom?"
      // can no longer be answered.
      const following = isAtBottom()

      setMessages(prev => {
        const seen = new Set(prev.map(m => m.id))
        const merged = [...prev]
        for (const m of newer) if (!seen.has(m.id)) merged.push(m)
        return merged
      })
      lastCreatedAtRef.current = newer[newer.length - 1].createdAt

      if (following) scrollToBottom()
      else setHasUnseen(true)
    } catch (e) {
      // silent — next tick will try again
    }
  }, [flareId, currentUser.id, isAtBottom, scrollToBottom])

  // Initial load + polling every 6s
  useEffect(() => {
    fetchInitial()
    const interval = setInterval(fetchDelta, 6000)
    return () => clearInterval(interval)
  }, [fetchInitial, fetchDelta])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    if (trimmed.length > 1000) {
      setError('Message is too long (max 1000 characters)')
      return
    }

    setSending(true)
    setError('')

    // Optimistic append
    const tempId = `local-${Date.now()}`
    const optimistic = {
      id: tempId,
      flareId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
      _pending: true,
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    scrollToBottom()

    try {
      const res = await fetch(`/api/flares/${flareId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Roll back optimistic
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setError(data.error || 'Failed to send')
        setText(trimmed) // Give user their text back
        return
      }
      const saved = data.message
      setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)))
      lastCreatedAtRef.current = saved.createdAt
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Network error')
      setText(trimmed)
    } finally {
      setSending(false)
      scrollToBottom()
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groups = useMemo(
    () => groupMessages(messages, currentUser.id),
    [messages, currentUser.id]
  )

  return (
    <div className="mt-6 border-t border-line-subtle pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-ink">Chat</h3>
        <span className="text-2xs text-ink-subtle">Only for people going to this flare</span>
      </div>

      {/* Messages list */}
      <div className="relative">
        <div
          ref={listRef}
          onScroll={() => {
            if (hasUnseen && isAtBottom()) setHasUnseen(false)
          }}
          // overscroll-contain: this scroller is nested inside the sheet's own
          // scroller, and without it reaching either end hands the gesture up
          // and scrolls the sheet — or the page — out from under you.
          className="h-64 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-line-subtle bg-surface-0 p-3"
        >
          {loadingInitial ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-subtle">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading messages…
            </div>
          ) : groups.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-subtle">
              No messages yet. Say hi 👋
            </div>
          ) : (
            groups.map((group) =>
              group.type === 'day' ? (
                <DaySeparator key={group.key} label={group.label} />
              ) : (
                <MessageGroup key={group.key} group={group} />
              )
            )
          )}
        </div>

        {/* "New messages" instead of a scroll yank. */}
        {hasUnseen && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 animate-fade-in-up items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-2xs font-semibold text-primary-foreground shadow-e3 hover:bg-brand-600 active:scale-95"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            New messages
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message the group…"
          aria-label="Message the group"
          maxLength={1000}
          className="flex-1"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-primary-foreground shadow-brand hover:bg-brand-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

/** A run of consecutive messages from one sender, rendered with one name. */
function MessageGroup({ group }) {
  const { mine, senderName, items } = group

  return (
    <div className={cn('flex flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
      <span className="px-1 text-2xs font-medium text-ink-subtle">
        {mine ? 'You' : senderName}
      </span>
      {items.map((m, i) => (
        <div
          key={m.id}
          className={cn(
            'max-w-[85%] px-3 py-2 text-sm',
            mine
              ? 'rounded-2xl rounded-br-md bg-brand-600 text-primary-foreground'
              : 'rounded-2xl rounded-bl-md bg-surface-2 text-ink',
            // Only the last bubble in a run carries the tail.
            i < items.length - 1 && (mine ? 'rounded-br-2xl' : 'rounded-bl-2xl'),
            m._pending && 'opacity-70'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
          <time
            dateTime={m.createdAt}
            className={cn('tabular mt-1 block text-2xs', mine ? 'opacity-75' : 'text-ink-subtle')}
          >
            {formatTime(m.createdAt)}
          </time>
        </div>
      ))}
    </div>
  )
}

function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gradient-hairline" />
      <span className="text-2xs font-medium uppercase tracking-wide text-ink-subtle">{label}</span>
      <span className="h-px flex-1 bg-gradient-hairline" />
    </div>
  )
}

/**
 * Flatten messages into render groups: a day separator whenever the calendar
 * day changes, then runs of consecutive messages from the same sender.
 */
function groupMessages(messages, viewerId) {
  const groups = []
  let currentDay = null
  let run = null

  for (const m of messages) {
    // A day separator resets the run too: the first message of a new day gets
    // its sender's name again even if the same person sent the last one.
    const day = dayKey(m.createdAt)
    if (day !== currentDay) {
      currentDay = day
      run = null
      groups.push({ type: 'day', key: `day-${day}-${m.id}`, label: formatDay(m.createdAt) })
    }

    if (!run || run.senderId !== m.senderId) {
      run = {
        type: 'run',
        key: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        mine: m.senderId === viewerId,
        items: [],
      }
      groups.push(run)
    }
    run.items.push(m)
  }

  return groups
}

function dayKey(iso) {
  const d = new Date(iso)
  return isNaN(d) ? 'unknown' : d.toDateString()
}

function formatDay(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
