'use client'

/**
 * The feedback composer for the PUBLIC /feedback page.
 *
 * Its signed-in twin is components/AppFeedbackForm.js. The two are kept
 * separate on purpose — the public and in-app info pages share no modules, so
 * neither set can drag the other's chrome or session assumptions along with it.
 *
 * Split out of the page so the page itself can stay a server component and
 * export `metadata`; as a single client component it silently had no title.
 */

import { useState } from 'react'
import { Bug, Lightbulb, MessageSquareHeart, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CONTACT_EMAIL, hasContactEmail } from '@/lib/site'

const CATEGORIES = [
  { id: 'idea', label: 'An idea', icon: Lightbulb },
  { id: 'bug', label: 'Something broken', icon: Bug },
  { id: 'other', label: 'Something else', icon: MessageSquareHeart },
]

/*
 * The section heading is re-declared here rather than taking PublicInfoSection
 * as a prop: that shell is a server component, and a component *type* cannot
 * cross the server/client boundary as a prop (only elements and serialisable
 * values can). Same markup, one file over.
 */
function Section({ heading, children }) {
  return (
    <section>
      {heading && (
        <h2 className="mb-2 font-display text-base font-semibold text-ink">{heading}</h2>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function PublicFeedbackForm() {
  const [category, setCategory] = useState('idea')
  const [message, setMessage] = useState('')

  const canSend = hasContactEmail && message.trim().length > 0

  // There's no feedback endpoint on the API, so rather than invent one this
  // hands off to the user's mail client with the message pre-filled. It is an
  // <a href> rather than a `window.location.href =` assignment: the latter is a
  // full document navigation, which on a browser with no mail handler can blank
  // the app and lose everything typed.
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Feedback'
  const mailto = hasContactEmail
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        `iFLARE feedback — ${label}`
      )}&body=${encodeURIComponent(message.trim())}`
    : undefined

  return (
    <>
      <Section heading="What's this about?">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, label: categoryLabel, icon: Icon }) => {
            const selected = category === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-brand-500 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
                    : 'border-line bg-surface-1 text-ink-subtle hover:border-line-strong hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {categoryLabel}
              </button>
            )
          })}
        </div>
      </Section>

      <Section heading="Your message">
        {/* Deliberately no Enter-to-submit here: this is a multiline field, so
            Enter must insert a newline. */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="What happened, or what would you like to see? The more specific, the more useful."
          className="resize-y"
        />

        {hasContactEmail ? (
          <Button asChild={canSend} disabled={!canSend} className="h-11 w-full font-medium">
            {canSend ? (
              <a href={mailto}>
                <Send className="mr-2 h-4 w-4" />
                Send feedback
              </a>
            ) : (
              <span>
                <Send className="mr-2 h-4 w-4" />
                Send feedback
              </span>
            )}
          </Button>
        ) : (
          <div className="rounded-xl border border-line-subtle bg-surface-1 px-4 py-3.5">
            <p className="text-sm text-ink-muted">
              The feedback inbox isn&apos;t set up yet.
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              iFLARE is an early-stage student project — this form will be
              connected before launch.
            </p>
          </div>
        )}
      </Section>

      <p className="text-xs text-ink-subtle">
        This opens your email app with the message ready to send, so you&apos;ll
        always see exactly what gets sent.
      </p>
    </>
  )
}
