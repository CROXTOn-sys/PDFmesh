'use client'

import { useEffect } from 'react'

// global-error catches errors thrown in the root layout itself. It must render
// its own <html>/<body> and cannot depend on the app's layout or providers, so
// it is intentionally self-contained with inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#f7fbff',
          color: '#0b1220',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#19b7c9', lineHeight: 1 }}>500</div>
          <h1 style={{ fontSize: 26, margin: '14px 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px' }}>
            An unexpected error occurred. Please try again, or return to the homepage.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#19b7c9',
                color: '#fff',
                border: 0,
                borderRadius: 10,
                padding: '11px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: '#fff',
                color: '#0b1220',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '11px 20px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </div>
          {error?.digest && (
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 18 }}>Reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
