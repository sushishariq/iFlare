/**
 * `fetch` that gives up instead of hanging forever.
 *
 * None of the app's fetches had a timeout or an AbortController, so a stalled
 * connection — the normal case on campus wifi, which is this product's entire
 * audience — left the awaiting effect pending, its `finally` unreached, and the
 * page's spinner up permanently. A request that fails is recoverable; one that
 * never settles is not.
 *
 * Use it for the fetches that gate a render. Fire-and-forget background polls
 * don't need it: they already have a next tick.
 */

const DEFAULT_TIMEOUT_MS = 15000

export async function fetchWithTimeout(input, { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = {}) {
  // AbortSignal.timeout is not in every browser this app targets, so fall back
  // to a controller we clear ourselves.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
