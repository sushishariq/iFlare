'use client'

/**
 * The signed-in user as cached in localStorage under `iflare_user`.
 *
 * Session state lives in localStorage and every page re-reads it by hand; this
 * is that read, for chrome that needs the user's name or initial rather than
 * the full profile. It deliberately does *not* fetch /user/me — the top bar
 * must not add a request to every page load, and a stale display name is
 * harmless where a stale `bio` on /profile was not (that page keeps its own
 * refetch).
 *
 * Null until mount, because localStorage doesn't exist during SSR; callers
 * render a neutral placeholder for that first paint.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function useSessionUser() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  // Re-read on navigation: /profile writes the updated user back to storage,
  // so leaving that page is when the cached copy most often goes stale.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('iflare_user')
      setUser(raw ? JSON.parse(raw) : null)
    } catch (e) {
      setUser(null) // storage blocked or a malformed payload — render neutrally
    }
  }, [pathname])

  return user
}
