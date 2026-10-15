'use client'

import { useState, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ConfirmDialog from '@/components/ConfirmDialog'
import StepProgress from '@/components/StepProgress'
import FormBanner from '@/components/FormBanner'
import InterestChip from '@/components/InterestChip'
import InterestSelector from '@/components/InterestSelector'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Search,
  Users,
} from 'lucide-react'
import { resolveInterest } from '@/lib/interests'
import { useInterestCatalog } from '@/lib/useInterestCatalog'
import { CAMPUS_LOCATIONS, LOCATION_GROUPS, toLocationValue } from '@/lib/campusLocations'

const STEPS = ['Details', 'When & where']
const PARTICIPANT_CHOICES = [2, 3, 4, 5, 6, 8, 10]

const IDEAS = [
  'Looking for gym buddy',
  'Going for cycling',
  'Slots for board game',
  'Tennis match needed',
  'Coffee & coding session',
  'Evening jog partner',
]

/** "Starting in ..." shortcuts; they set the date too, so crossing midnight works. */
const QUICK_OFFSETS = [
  { label: 'In 30 min', minutes: 30 },
  { label: 'In 1 hr', minutes: 60 },
  { label: 'In 2 hrs', minutes: 120 },
]

const pad = (n) => String(n).padStart(2, '0')

/**
 * Date/time values in the *browser's* timezone.
 *
 * The previous `todayISO()` used `toISOString()`, which is UTC: for a student
 * in IST between midnight and 05:30 it produced yesterday's date, so the date
 * input's `min` sat a day behind and "today" wasn't selectable. The quick
 * offsets below need local values for the same reason.
 */
const toDateValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toTimeValue = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const todayValue = () => toDateValue(new Date())
const dateValueIn = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toDateValue(d)
}

// Which field an invalid step should send the user to, in the order they read.
const STEP_FIELDS = {
  1: ['title', 'description', 'interests'],
  2: ['time', 'location'],
}

/**
 * Create-flare flow, previously a modal inside app/(app)/flares/page.js.
 *
 * Now an inline mode on the flares page (spec: a Join | Create switch rather
 * than a floating button), still two steps, still posting exactly the same
 * body to POST /api/flares.
 *
 * The venue picker replaced free-text entry plus a non-functional map
 * placeholder; it writes the same location shape, with lat/lng null.
 */
export default function CreateFlareForm({ currentUser, onCreated, onCancel }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interests: [],
    location: toLocationValue(''),
    date: todayValue(),
    time: '',
    maxAttendees: 4,
  })
  const [ideasOpen, setIdeasOpen] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Per-field messages. The primary button used to be `disabled` under exactly
  // the conditions the error branches tested, so the branches were unreachable
  // and a grey button was the only signal about what was missing.
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmCancel, setConfirmCancel] = useState(false)

  const fieldRefs = {
    title: useRef(null),
    description: useRef(null),
    interests: useRef(null),
    time: useRef(null),
    location: useRef(null),
  }

  // Needed outside the popover too: the chips that stay on screen once it
  // closes have to resolve a custom interest's real name, not its slug.
  const { catalog } = useInterestCatalog(currentUser?.id)
  const selectedInterests = useMemo(
    () => formData.interests.map((id) => resolveInterest(id, catalog)),
    [formData.interests, catalog]
  )

  const visibleLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase()
    if (!q) return null // grouped view
    return CAMPUS_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.group.toLowerCase().includes(q)
    )
  }, [locationQuery])

  /** Editing a field clears its own message, so fixing one thing doesn't leave
      the complaint about it on screen until the next submit. */
  const patch = (changes, clearedFields = []) => {
    setError('')
    if (clearedFields.length) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        clearedFields.forEach((f) => delete next[f])
        return next
      })
    }
    setFormData((prev) => ({ ...prev, ...changes }))
  }

  const setInterests = (next) => patch({ interests: next }, ['interests'])

  const removeInterest = (interest) =>
    setInterests(formData.interests.filter((id) => id !== interest.id))

  /** Quick offset: set date *and* time, rounded to the next 5 minutes. */
  const startIn = (minutes) => {
    const at = new Date(Date.now() + minutes * 60000)
    at.setMinutes(Math.ceil(at.getMinutes() / 5) * 5, 0, 0)
    patch({ date: toDateValue(at), time: toTimeValue(at) }, ['time'])
  }

  // Enter advances the step; the hook skips the description textarea and the
  // interest/venue chips.
  const detailsStepKeyDown = useEnterSubmit(() => handleContinue())
  const whenWhereStepKeyDown = useEnterSubmit(() => handleCreate())

  const isDirty =
    formData.title.trim() ||
    formData.description.trim() ||
    formData.interests.length > 0 ||
    formData.location.name ||
    formData.time

  /** Reports every problem on the step at once, then sends focus to the first. */
  const reportErrors = (errors) => {
    setFieldErrors(errors)
    const first = STEP_FIELDS[step].find((f) => errors[f])
    fieldRefs[first]?.current?.focus()
    return Object.keys(errors).length === 0
  }

  const handleContinue = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Say what you’re doing — this is the headline.'
    if (!formData.description.trim()) {
      errors.description = 'Add a line so people know what they’re joining.'
    }
    if (formData.interests.length === 0) {
      errors.interests = 'Pick at least one interest so the right people see this.'
    }
    if (!reportErrors(errors)) return
    setError('')
    setStep(2)
  }

  const handleCreate = async () => {
    const errors = {}
    if (!formData.time) errors.time = 'Pick a start time.'
    if (!formData.location.name) errors.location = 'Pick a venue.'

    // Only meaningful once both halves exist, so it goes after the two checks
    // above rather than replacing them.
    const startTime = new Date(`${formData.date}T${formData.time}`)
    if (!errors.time && isNaN(startTime.getTime())) {
      errors.time = 'That start time doesn’t look right.'
    }
    if (!reportErrors(errors)) return

    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('iflare_token')
      const response = await fetch('/api/flares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          interests: formData.interests,
          location: formData.location,
          startTime: startTime.toISOString(),
          maxAttendees: formData.maxAttendees,
          hostId: currentUser?.id,
          hostName: currentUser?.name,
        }),
      })

      if (response.ok) {
        const savedFlare = await response.json()
        // The page routes to /activity from onCreated, so without this the
        // flow ends on a different screen with nothing confirming it worked.
        toast.success(`${savedFlare.title || 'Your flare'} is live`, {
          description: `${formData.location.name} · we'll show it to your campus.`,
        })
        onCreated(savedFlare)
        return
      }

      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to create flare')
      setIsSubmitting(false)
    } catch (err) {
      console.error('Error creating flare:', err)
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  /** Cancel discards a filled two-step form, so it asks first. */
  const handleCancel = () => {
    if (isDirty) {
      setConfirmCancel(true)
      return
    }
    onCancel()
  }

  return (
    <div>
      <StepProgress steps={STEPS} currentStep={step} />

      <FormBanner tone="error">{error}</FormBanner>

      {/* ---------------- Step 1: Details ---------------- */}
      {step === 1 && (
        <div key="step-1" className="animate-fade-in-up" onKeyDown={detailsStepKeyDown}>
          {/* Collapsed by default: six title suggestions are helpful once and
              then only push Continue below the fold on a phone. */}
          <Collapsible open={ideasOpen} onOpenChange={setIdeasOpen} className="mb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-300 hover:bg-brand-500/15">
              <span>💡 Need an idea?</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${ideasOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 px-1 pt-3">
                {IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      patch({ title: idea }, ['title'])
                      setIdeasOpen(false)
                    }}
                    className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-3 hover:text-ink"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <div>
              <label htmlFor="flare-title" className="mb-2 block text-sm text-ink-muted">
                What are you doing?
              </label>
              <Input
                id="flare-title"
                ref={fieldRefs.title}
                value={formData.title}
                onChange={(e) => patch({ title: e.target.value }, ['title'])}
                placeholder="e.g. Looking for a gym buddy"
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? 'flare-title-error' : undefined}
                className={`h-12 ${fieldErrors.title ? 'border-danger focus:border-danger' : ''}`}
              />
              <FieldError id="flare-title-error">{fieldErrors.title}</FieldError>
            </div>

            <div>
              <label htmlFor="flare-desc" className="mb-2 block text-sm text-ink-muted">
                Tell people more
              </label>
              {/* Textarea: Enter inserts a newline, never submits. */}
              <Textarea
                id="flare-desc"
                ref={fieldRefs.description}
                value={formData.description}
                onChange={(e) => patch({ description: e.target.value }, ['description'])}
                rows={2}
                placeholder="Skill level, what to bring, how long you'll be there..."
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'flare-desc-error' : undefined}
                className={`resize-y ${
                  fieldErrors.description ? 'border-danger focus:border-danger' : ''
                }`}
              />
              <FieldError id="flare-desc-error">{fieldErrors.description}</FieldError>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ink-muted">
                How many people can join?
              </label>
              <div className="flex flex-wrap gap-2">
                {PARTICIPANT_CHOICES.map((n) => {
                  const selected = formData.maxAttendees === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patch({ maxAttendees: n })}
                      aria-pressed={selected}
                      className={`tabular flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold ${
                        selected
                          ? 'border-brand-500 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
                          : 'border-line bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-subtle">
                <Users className="h-3 w-3" />
                Counting you — {formData.maxAttendees - 1} other
                {formData.maxAttendees - 1 === 1 ? '' : 's'} can join.
              </p>
            </div>

            <div>
              <label id="flare-interests-label" className="mb-2 block text-sm text-ink-muted">
                Who should see this?
              </label>

              {/* The picker lives in a popover so the step stays one screen
                  tall: the old always-visible grid of every interest pushed
                  Continue off the bottom on a phone. Same selector as the
                  register wizard, so custom interests work here too. */}
              <Popover open={interestsOpen} onOpenChange={setInterestsOpen}>
                <PopoverTrigger asChild>
                  <button
                    ref={fieldRefs.interests}
                    type="button"
                    aria-labelledby="flare-interests-label"
                    aria-invalid={Boolean(fieldErrors.interests)}
                    aria-describedby={
                      fieldErrors.interests ? 'flare-interests-error' : undefined
                    }
                    className={`flex h-12 w-full items-center justify-between rounded-lg border bg-surface-3 px-4 text-sm text-ink-muted shadow-e1 hover:bg-surface-2 ${
                      fieldErrors.interests ? 'border-danger' : 'border-line'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-ink-subtle" />
                      {formData.interests.length
                        ? `${formData.interests.length} interest${
                            formData.interests.length === 1 ? '' : 's'
                          } selected`
                        : 'Choose interests'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-ink-subtle" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[min(22rem,calc(100vw-2rem))] rounded-xl border-line-subtle bg-surface-2 p-3 shadow-e3"
                >
                  <InterestSelector
                    value={formData.interests}
                    onChange={setInterests}
                    userId={currentUser?.id}
                    // The chips stay visible under the trigger after this
                    // closes, so repeating them inside would just be noise.
                    showSelected={false}
                    suggestionLimit={12}
                    placeholder="Search or add an interest"
                  />
                </PopoverContent>
              </Popover>

              {selectedInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <InterestChip
                      key={interest.id}
                      interest={interest}
                      size="sm"
                      onRemove={removeInterest}
                    />
                  ))}
                </div>
              )}

              {fieldErrors.interests ? (
                <FieldError id="flare-interests-error">{fieldErrors.interests}</FieldError>
              ) : (
                <p className="mt-2 text-xs text-ink-subtle">
                  Only students at your university will see this flare.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
              Cancel
            </Button>
            {/* Not disabled on purpose — see fieldErrors above. */}
            <Button type="button" size="lg" className="flex-1" onClick={handleContinue}>
              Continue
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- Step 2: When & where ---------------- */}
      {step === 2 && (
        <div key="step-2" className="animate-fade-in-up" onKeyDown={whenWhereStepKeyDown}>
          <div className="space-y-5">
            <div>
              <label htmlFor="flare-time" className="mb-2 block text-sm text-ink-muted">
                When does it start?
              </label>

              {/* Time before date: a spontaneous meetup is decided as "in an
                  hour" or "at 9", and the day is almost always today — so the
                  field people actually have to think about comes first. */}
              <div className="rounded-xl border border-line-subtle bg-surface-1 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-ink-subtle">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_OFFSETS.map((offset) => (
                    <button
                      key={offset.minutes}
                      type="button"
                      onClick={() => startIn(offset.minutes)}
                      className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-ink-muted hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-brand-300"
                    >
                      {offset.label}
                    </button>
                  ))}
                </div>
                <Input
                  id="flare-time"
                  ref={fieldRefs.time}
                  type="time"
                  value={formData.time}
                  onChange={(e) => patch({ time: e.target.value }, ['time'])}
                  aria-invalid={Boolean(fieldErrors.time)}
                  aria-describedby={fieldErrors.time ? 'flare-time-error' : undefined}
                  className={`tabular mt-3 h-12 w-full ${
                    fieldErrors.time ? 'border-danger focus:border-danger' : ''
                  }`}
                />
              </div>

              <div className="mt-3 rounded-xl border border-line-subtle bg-surface-1 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-ink-subtle">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Date
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Today', value: todayValue() },
                    { label: 'Tomorrow', value: dateValueIn(1) },
                  ].map((choice) => {
                    const selected = formData.date === choice.value
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => patch({ date: choice.value }, ['time'])}
                        aria-pressed={selected}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                          selected
                            ? 'border-brand-500/60 bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
                            : 'border-line bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink'
                        }`}
                      >
                        {choice.label}
                      </button>
                    )
                  })}
                </div>
                <Input
                  type="date"
                  value={formData.date}
                  min={todayValue()}
                  onChange={(e) => patch({ date: e.target.value }, ['time'])}
                  aria-label="Start date"
                  className="tabular mt-3 h-12 w-full"
                />
              </div>

              <FieldError id="flare-time-error">{fieldErrors.time}</FieldError>

              {/* Make the consequence of the chosen time immediately legible. */}
              <StartTimePreview date={formData.date} time={formData.time} />
            </div>

            <div>
              <label htmlFor="flare-venue-search" className="mb-2 block text-sm text-ink-muted">
                Where?
              </label>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <Input
                  id="flare-venue-search"
                  ref={fieldRefs.location}
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search campus venues"
                  aria-invalid={Boolean(fieldErrors.location)}
                  aria-describedby={fieldErrors.location ? 'flare-venue-error' : undefined}
                  className={`pl-9 ${
                    fieldErrors.location ? 'border-danger focus:border-danger' : ''
                  }`}
                />
              </div>

              <FieldError id="flare-venue-error">{fieldErrors.location}</FieldError>

              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {visibleLocations ? (
                  <VenueList
                    venues={visibleLocations}
                    selectedName={formData.location.name}
                    onSelect={(venue) => patch({ location: toLocationValue(venue) }, ['location'])}
                  />
                ) : (
                  LOCATION_GROUPS.map((group) => (
                    <div key={group}>
                      <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-ink-subtle">
                        {group}
                      </p>
                      <VenueList
                        venues={CAMPUS_LOCATIONS.filter((l) => l.group === group)}
                        selectedName={formData.location.name}
                        onSelect={(venue) =>
                          patch({ location: toLocationValue(venue) }, ['location'])
                        }
                      />
                    </div>
                  ))
                )}

                {visibleLocations?.length === 0 && (
                  <p className="py-2 text-sm text-ink-subtle">
                    No venue matches &ldquo;{locationQuery}&rdquo;.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label="Back to details"
              onClick={() => {
                setError('')
                setFieldErrors({})
                setStep(1)
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create flare'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel used to discard a filled two-step form silently. */}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Discard this flare?"
        description="What you've filled in so far won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={onCancel}
      />
    </div>
  )
}

/** One field's message. Sits in the same slot as the field's hint text. */
function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-xs text-danger">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

function VenueList({ venues, selectedName, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {venues.map((venue) => {
        const selected = selectedName === venue.name
        return (
          <button
            key={venue.id}
            type="button"
            onClick={() => onSelect(venue)}
            aria-pressed={selected}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
              selected
                ? 'border-brand-500 bg-brand-500/10 hover:bg-brand-500/20'
                : 'border-line-subtle bg-surface-2 hover:bg-surface-3'
            }`}
          >
            <span className="text-base">{venue.emoji}</span>
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                selected ? 'font-medium text-ink' : 'text-ink-muted'
              }`}
            >
              {venue.name}
            </span>
            {selected && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
          </button>
        )
      })}
    </div>
  )
}

/** Restates the picked date/time as "starts in X" so mistakes are obvious. */
function StartTimePreview({ date, time }) {
  if (!date || !time) {
    return (
      <p className="mt-2 text-xs text-ink-subtle">Pick a time to see when this goes live.</p>
    )
  }

  const start = new Date(`${date}T${time}`)
  if (isNaN(start.getTime())) return null

  const diffMins = Math.round((start.getTime() - Date.now()) / 60000)

  let message
  let tone = 'text-ink-muted'
  if (diffMins < 0) {
    message = 'That time has already passed.'
    tone = 'text-danger'
  } else if (diffMins < 90) {
    message = `Starts in ${diffMins} min — it'll show on the feed straight away.`
    tone = 'text-brand-300'
  } else {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    const rel = hours >= 24 ? `${Math.round(hours / 24)} day(s)` : `${hours}h ${mins}m`
    message = `Starts in ${rel} — it appears on the feed 90 minutes before.`
  }

  return (
    <p className={`mt-2 text-xs ${tone}`}>
      {start.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}
      {' · '}
      {message}
    </p>
  )
}
