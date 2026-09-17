'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/docflow/docflow'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console (and any monitoring you add later).
    console.error(error)
  }, [error])

  return (
    <>
      <Navbar />
      <main className="error-page">
        <div className="container error-inner">
          <span className="error-code">500</span>
          <h1>Something went wrong</h1>
          <p>
            An unexpected error occurred while loading this page. You can try again, or head back to
            the homepage.
          </p>
          <div className="error-actions">
            <button className="button button-primary button-large" onClick={() => reset()}>
              Try again
            </button>
            <Link href="/" className="button button-secondary button-large">Back to home</Link>
          </div>
          {error?.digest && <p className="error-digest">Reference: {error.digest}</p>}
        </div>
      </main>
      <Footer />
    </>
  )
}
