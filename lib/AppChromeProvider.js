'use client'

/**
 * A single slot in the desktop top bar that the current page can fill.
 *
 * The top bar wants an inline search field, but search belongs to the page —
 * /flares owns the query, the filter and the interest suggestions, and the
 * shell has no business knowing any of that. Lifting the state into the shell
 * would invert the ownership; rendering a second search field in the bar would
 * mean two inputs fighting over one query.
 *
 * So the shell exposes a DOM node and the page portals its *existing* search
 * into it. One component instance, one piece of state, rendered wherever the
 * viewport puts it. `useTopBarSlot` returns null below md (the bar renders no
 * slot there), which is the page's signal to render the field inline instead.
 */

import { createContext, useContext, useState } from 'react'

const AppChromeContext = createContext({ slot: null, setSlot: () => {} })

export function AppChromeProvider({ children }) {
  // The node itself, not a ref: the page has to re-render when it appears, and
  // a ref mutation wouldn't tell it. `setSlot` is a stable useState setter, so
  // AppTopBar can pass it straight to `ref=` with no re-attach loop.
  const [slot, setSlot] = useState(null)

  return (
    <AppChromeContext.Provider value={{ slot, setSlot }}>{children}</AppChromeContext.Provider>
  )
}

/** The top bar's slot node, or null when the bar isn't showing one. */
export function useTopBarSlot() {
  return useContext(AppChromeContext).slot
}

/** Used by AppTopBar only — hands the shell's slot node to the provider. */
export function useSetTopBarSlot() {
  return useContext(AppChromeContext).setSlot
}
