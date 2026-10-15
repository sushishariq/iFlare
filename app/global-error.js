'use client'

/**
 * The last-resort boundary, for a throw in the root layout itself.
 *
 * app/error.js cannot catch those — it renders *inside* the layout that failed.
 * This one replaces the whole document, so it must supply its own <html> and
 * <body>, and it cannot rely on the app's providers, fonts or components. The
 * styles are inline for the same reason: if the failure was in the layout, the
 * stylesheet link may not be there either.
 */

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          background: '#0e1016',
          color: '#f5f6fa',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
          iFLARE hit an unexpected error
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#a8adbd', margin: 0, maxWidth: '28rem' }}>
          {error?.message || 'The app failed to start. Reloading usually clears it.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            cursor: 'pointer',
            borderRadius: '0.875rem',
            border: 'none',
            background: '#f97316',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
