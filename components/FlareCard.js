'use client'

import { MapPin, Users, ChevronRight } from 'lucide-react'
import { interestEmoji } from '@/lib/interests'

/**
 * Feed row for a single flare. Extracted from app/(app)/flares/page.js so the
 * feed, search results and any future list can share one presentation.
 *
 * Attendee counts include the host, which is why they read `attendees.length + 1`
 * against maxAttendees — the same convention the join endpoint enforces.
 */
export default function FlareCard({ flare, onClick, timeInfo, getUrgencyStyles }) {
  const spotsTaken = flare.attendees.length + 1
  const nearlyFull = flare.attendees.length >= flare.maxAttendees - 1

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1.4rem] border-2 p-5 text-left shadow-[0_5px_0_hsl(var(--slate-700))] transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-orange-500/40 active:translate-y-0 active:shadow-none ${
        timeInfo.urgency === 'critical'
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-slate-700 bg-slate-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-orange-500/10 text-xl">
          {interestEmoji(flare.interests[0])}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold">{flare.title}</h3>
            <span
              className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-bold ${getUrgencyStyles(
                timeInfo.urgency
              )}`}
            >
              {timeInfo.text}
            </span>
          </div>

          <p className="mb-2 line-clamp-1 text-sm text-slate-400">{flare.description}</p>

          <div className="mb-2 flex flex-wrap gap-1">
            {flare.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400"
              >
                {interestEmoji(interest)}
              </span>
            ))}
            {flare.interests.length > 3 && (
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                +{flare.interests.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {flare.location?.name}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className={nearlyFull ? 'text-orange-400' : ''}>
                {spotsTaken}/{flare.maxAttendees}
              </span>
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-400" />
      </div>
    </button>
  )
}
