/**
 * How full a flare is — one answer, for every surface that asks.
 *
 * There were three, and two of them disagreed. The rule the API enforces
 * (`POST /flares/:id/join`) is that a flare is full when
 * `attendees.length >= maxAttendees - 1`, because `maxAttendees` counts the
 * host and `attendees[]` does not. `FlareDetailBody` matched that; the feed
 * page's join handler guarded `attendees.length < maxAttendees` instead, so it
 * would optimistically add the (maxAttendees + 1)-th person, show them as
 * going, and only the server's 400 — which nothing was reading — knew better.
 *
 * Anything that renders "3/6", greys out a Join button, or decides whether a
 * card is nearly full reads this.
 */
export function getFlareCapacity(flare) {
  const max = Number(flare?.maxAttendees) || 0
  // The host holds the first seat and is not in attendees[]. Not clamped to
  // `max`: if a document ever goes over capacity, "7/6" is the honest render.
  const taken = (flare?.attendees?.length || 0) + 1
  const openSpots = Math.max(max - taken, 0)

  return {
    max,
    taken,
    openSpots,
    isFull: openSpots <= 0,
    /** One seat left — worth colouring, not worth alarming about. */
    nearlyFull: openSpots === 1,
  }
}
