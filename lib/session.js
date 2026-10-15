'use client'

/**
 * The one safe read of the stored session.
 *
 * Every authenticated page hand-rolled `localStorage.getItem('iflare_user')`
 * followed by a `JSON.parse`, and in four of five the read sat *outside* the
 * page's try/catch. That matters here more than it usually would:
 * next.config.js sets `frame-ancestors *`, so this app is explicitly meant to
 * run inside an iframe — and in a third-party iframe (and Safari private mode)
 * `localStorage.getItem` throws `SecurityError` rather than returning null.
 * When it threw, the effect aborted before its `setIsLoading(false)`, and since
 * these pages are statically prerendered with `isLoading === true` and the app
 * has no error boundary, the spinner was the last thing ever painted.
 *
 * Returns a consistent shape so callers never branch on undefined:
 *   { user, token, ok }  — `ok` means both a parsed user and a token exist.
 */
export function readStoredSession() {
  let rawUser = null
  let token = null

  try {
    rawUser = window.localStorage.getItem('iflare_user')
    token = window.localStorage.getItem('iflare_token')
  } catch (e) {
    // Storage blocked (iframe, private mode, or the user's settings). Treat it
    // as "no session" rather than letting the throw escape and strand the page.
    return { user: null, token: null, ok: false }
  }

  if (!rawUser || !token) return { user: null, token, ok: false }

  try {
    const user = JSON.parse(rawUser)
    return { user, token, ok: Boolean(user?.id) }
  } catch (e) {
    // A malformed payload is the same as no session — it cannot identify a user.
    return { user: null, token, ok: false }
  }
}

/**
 * Clears the session. Wrapped for the same reason as the read: a throw here
 * during logout would leave the user on a page that thinks they're still in.
 */
export function clearStoredSession() {
  try {
    window.localStorage.removeItem('iflare_user')
    window.localStorage.removeItem('iflare_token')
  } catch (e) {
    // Nothing to clear if storage is unavailable.
  }
}
