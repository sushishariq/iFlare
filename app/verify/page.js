'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been verified!')

          // Auto-login: store user data
          if (data.user && data.token) {
            localStorage.setItem('iflare_user', JSON.stringify(data.user))
            localStorage.setItem('iflare_token', data.token)
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <VerifyShell>
      {status === 'verifying' && (
        <div className="flex animate-fade-in flex-col items-center text-center">
          <Loader2 className="mb-6 h-14 w-14 animate-spin text-brand-500" />
          <h1 className="mb-2 text-2xl font-bold">Verifying your email...</h1>
          <p className="text-ink-muted">Please wait a moment</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex animate-fade-in-up flex-col items-center text-center">
          {/* On --success, the one success colour. This page used to introduce
              a third one (green-500) next to /register's emerald. */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Email verified</h1>
          <p className="mb-8 text-ink-muted">{message}</p>
          <Button size="lg" className="w-64" onClick={() => router.push('/flares')}>
            Start exploring flares
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex animate-fade-in-up flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/15">
            <XCircle className="h-10 w-10 text-danger" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Verification failed</h1>
          <p className="mb-8 text-ink-muted" role="alert">
            {message}
          </p>
          <div className="w-64 space-y-3">
            <Button size="lg" className="w-full" onClick={() => router.push('/register')}>
              Try again
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
              Back to sign in
            </Button>
          </div>
        </div>
      )}
    </VerifyShell>
  )
}

/** Shared chrome, so the Suspense fallback and the page are the same screen. */
function VerifyShell({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="app-column app-gutter relative flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-12">
          <Logo size="lg" />
        </div>
        {children}
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <VerifyShell>
          <Loader2 className="h-14 w-14 animate-spin text-brand-500" />
        </VerifyShell>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
