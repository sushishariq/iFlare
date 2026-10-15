'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FormBanner from '@/components/FormBanner'
import Logo from '@/components/Logo'
import { ArrowLeft, Eye, EyeOff, Mail, Loader2, AlertCircle } from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // The server can't tell us whether an account exists (it returns the same
  // 401 either way, deliberately), so on any failed sign-in we surface the
  // "create an account" route alongside the error.
  const [showSignupHint, setShowSignupHint] = useState(false)
  const [domainError, setDomainError] = useState('')
  const [notice, setNotice] = useState('')

  /*
   * /forgot-password ends by pushing here with ?reset=1, and nothing read it —
   * so the last thing a password reset did was drop you on a plain sign-in
   * form with no word about whether it had worked.
   *
   * Read from location rather than useSearchParams: that hook forces this page
   * under a Suspense boundary at build time, and the fallback would flash on
   * every cold load of the app's main entrance for the sake of one flag.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      setNotice('Password updated. Sign in with your new password.')
    }
  }, [])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setShowSignupHint(false)
    if (e.target.name === 'email') setDomainError('')
  }

  // Mirrors the server's own check so a non-university address is caught
  // before we spend a round trip on it. The server remains the authority.
  const validateDomain = () => {
    const email = formData.email.trim()
    if (!email || !email.includes('@')) return true
    const uni = resolveUniversity(email)
    if (!uni.valid) {
      setDomainError(uni.reason || 'This email domain is not allowed on iFLARE.')
      return false
    }
    setDomainError('')
    return true
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!formData.email || !formData.password || isLoading) return
    if (!validateDomain()) return

    setIsLoading(true)
    setError('')
    setNotice('')
    setShowSignupHint(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        if (response.status === 401) setShowSignupHint(true)
        setIsLoading(false)
        return
      }

      // Store user session
      localStorage.setItem('iflare_user', JSON.stringify(data.user))
      localStorage.setItem('iflare_token', data.token)

      // Redirect to flares page
      router.push('/flares')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">

      <div className="app-column app-gutter relative flex min-h-screen flex-col py-8">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Logo size="md" />

          <div className="w-10" />
        </div>

        {/* Login form — a real <form> so Enter submits from either field. */}
        <form onSubmit={handleLogin} className="flex flex-1 flex-col">
          <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
          <p className="mb-8 text-ink-muted">Sign in to continue to iFLARE</p>

          <FormBanner tone="success">{notice}</FormBanner>

          <FormBanner tone="error">
            {error && (
              <>
                <p>{error}</p>
                {showSignupHint && (
                  <p className="mt-2 text-ink-muted">
                    Don&apos;t have an account yet?{' '}
                    <Link
                      href="/register"
                      className="font-medium text-brand-400 hover:text-brand-300"
                    >
                      Create one
                    </Link>
                  </p>
                )}
              </>
            )}
          </FormBanner>

          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-ink-muted">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={validateDomain}
                  aria-invalid={Boolean(domainError)}
                  aria-describedby="email-hint"
                  placeholder="you@university.ac.in"
                  className={`h-14 rounded-xl pl-12 ${
                    domainError ? 'border-danger focus:border-danger' : ''
                  }`}
                />
              </div>
              {domainError ? (
                <p id="email-hint" className="mt-2 flex items-start gap-1.5 text-xs text-danger">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{domainError}</span>
                </p>
              ) : (
                <p id="email-hint" className="mt-2 text-xs text-ink-subtle">
                  Use the email your university gave you.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-ink-muted">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="h-14 rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="mb-8 self-start text-sm text-brand-400 hover:text-brand-300"
          >
            Forgot password?
          </button>

          <div className="mt-auto">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!formData.email || !formData.password || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="mt-6 text-center text-sm text-ink-subtle">
              Still not registered?{' '}
              <Link
                href="/register"
                className="font-medium text-brand-400 hover:text-brand-300"
              >
                Get started
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
