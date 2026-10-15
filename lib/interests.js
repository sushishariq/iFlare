/**
 * Single source of truth for interest categories.
 *
 * These ids are persisted on users.interests[] and flares.interests[], so they
 * must not be renamed without a data migration. The list previously existed as
 * four near-identical copies (register, profile, flares, activity) that had
 * already drifted apart in wording — this consolidates them.
 *
 * Each entry is `{ id, emoji, name }` and nothing more. There used to be a
 * `color` and a `tag` here too — a per-id Tailwind palette that only ever
 * covered these twelve, so a student's own interest rendered grey beside a
 * green "Sports & Fitness": the same concept in two visual languages.
 * components/InterestChip.js is the one treatment now, and both fields were
 * deleted once the last page stopped reading them.
 */
export const INTERESTS = [
  { id: 'sports', emoji: '🏃', name: 'Sports & Fitness' },
  { id: 'music', emoji: '🎵', name: 'Music & Concerts' },
  { id: 'food', emoji: '🍕', name: 'Food & Dining' },
  { id: 'art', emoji: '🎨', name: 'Art & Culture' },
  { id: 'tech', emoji: '💻', name: 'Tech & Gaming' },
  { id: 'outdoor', emoji: '🏕️', name: 'Outdoor & Adventure' },
  { id: 'nightlife', emoji: '🌙', name: 'Nightlife & Parties' },
  { id: 'wellness', emoji: '🧘', name: 'Wellness & Mindfulness' },
  { id: 'learning', emoji: '📚', name: 'Learning & Workshops' },
  { id: 'social', emoji: '☕', name: 'Casual Hangouts' },
  { id: 'pets', emoji: '🐕', name: 'Pets & Animals' },
  { id: 'travel', emoji: '✈️', name: 'Travel & Exploration' },
]

export const INTEREST_MAP = INTERESTS.reduce((acc, i) => {
  acc[i.id] = i
  return acc
}, {})

/** Emoji shown for a custom interest, which has none of its own. */
export const DEFAULT_INTEREST_EMOJI = '✨'

/** Upper bound for a user-created interest name, enforced on both ends. */
export const INTEREST_NAME_MAX_LENGTH = 40

export const interestEmoji = (id) => INTEREST_MAP[id]?.emoji ?? DEFAULT_INTEREST_EMOJI
export const interestName = (id) => INTEREST_MAP[id]?.name ?? id
export const interestLabel = (id) =>
  INTEREST_MAP[id] ? `${INTEREST_MAP[id].emoji} ${INTEREST_MAP[id].name}` : id

/**
 * Turn a free-text interest name into the id that gets persisted.
 *
 * Shared by the client (optimistic chip) and the API (`POST /interests`) so
 * both agree on the id for a given name — that agreement is what makes the
 * upsert idempotent and stops "Board Games" and "board games" becoming two
 * interests on the same campus.
 */
export function slugifyInterest(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, INTEREST_NAME_MAX_LENGTH)
    .replace(/-+$/g, '')
}

/**
 * The built-in list plus this university's custom interests.
 *
 * Built-ins always win a id collision: they're shared by every campus and
 * their ids are already persisted on existing users/flares.
 */
export function mergeInterests(custom = []) {
  const extras = custom
    .filter((i) => i?.id && !INTEREST_MAP[i.id])
    .map((i) => ({
      id: i.id,
      name: i.name || titleCase(i.id),
      emoji: i.emoji || DEFAULT_INTEREST_EMOJI,
      custom: true,
    }))
  return [...INTERESTS, ...extras]
}

/**
 * Look an id up in a catalogue, falling back to a readable shape.
 *
 * The fallback matters: `users.interests[]`/`flares.interests[]` hold bare
 * ids, so a chip may be asked to render an interest from another campus (or
 * one the catalogue fetch hasn't returned yet) — better a de-slugified name
 * than a raw `board-games`.
 */
export function resolveInterest(id, catalog = INTERESTS) {
  return (
    catalog.find((i) => i.id === id) || {
      id,
      name: titleCase(id),
      emoji: DEFAULT_INTEREST_EMOJI,
      custom: true,
    }
  )
}

export function searchInterests(query, catalog = INTERESTS) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return catalog
  return catalog.filter(
    (i) => i.name.toLowerCase().includes(q) || i.id.includes(q)
  )
}

function titleCase(id) {
  return String(id ?? '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
