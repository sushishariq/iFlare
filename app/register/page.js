'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import StepProgress from '@/components/StepProgress'
import FormBanner from '@/components/FormBanner'
import Logo from '@/components/Logo'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  User,
  Lock,
  Loader2,
  Search,
  Building2,
  Eye,
  EyeOff,
  PartyPopper,
} from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'
import {
  OTHER_UNIVERSITY,
  emailMatchesUniversity,
  searchUniversities,
} from '@/lib/universityOptions'
import InterestSelector from '@/components/InterestSelector'

const STEPS = ['University', 'Account', 'Verify', 'Personalise']
const BIO_MAX_LENGTH = 300
const MIN_INTERESTS = 3

export default function RegisterPage() {
  const router = useRouter()
  // 1: University, 2: Account, 3: OTP, 4: Personalisation (interests + bio).
  // Interests deliberately come *after* verification: the account exists by
  // then, so the selector can create custom interests under the user's campus.
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [selectedInterests, setSelectedInterests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Step-1 state
  const [university, setUniversity] = useState(null)
  const [uniQuery, setUniQuery] = useState('')

  // Step-2 state
  const [showPassword, setShowPassword] = useState(false)

  // Step-3 state
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [info, setInfo] = useState('')

  // Step-4 state
  const [bio, setBio] = useState('')
  const [savedSession, setSavedSession] = useState(null)

  // Cooldown ticker for the Resend button.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const uniResults = useMemo(() => searchUniversities(uniQuery), [uniQuery])

  // Enter advances these steps; the hook skips textareas and buttons so
  // interest chips still toggle and the bio can contain newlines.
  const universityStepKeyDown = useEnterSubmit(() => handleUniversityContinue())
  // The OTP field fires onComplete for a full code, but Enter on a
  // partially-typed one used to do nothing at all — this makes it report the
  // same "enter the 6-digit code" error the Verify button gives.
  const otpStepKeyDown = useEnterSubmit(() => handleVerifyOtp(), {
    disabled: isLoading,
  })

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  // ---- Step 1 → 2 -----------------------------------------------------
  const handleSelectUniversity = (uni) => {
    setUniversity(uni)
    setError('')
  }

  const handleUniversityContinue = () => {
    if (!university) {
      setError('Pick your university to continue')
      return
    }
    setError('')
    setStep(2)
  }

  // ---- Step 2 → 3: validate locally, then request the OTP. --------------
  const handleAccountContinue = () => {
    // Basic completeness check
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all fields')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      return
    }
    // University domain gate — blocks gmail / yahoo / outlook etc. RIGHT HERE
    // so the user can never proceed to the interests step with a bad email.
    const uni = resolveUniversity(formData.email)
    if (!uni.valid) {
      setError(
        uni.reason ||
          'iFLARE is exclusive to Indian college students. Please use your official university email.'
      )
      return
    }
    // Keep the step-1 choice and the email honest with each other, otherwise
    // the university shown on the profile wouldn't match the scoping domain.
    if (!emailMatchesUniversity(formData.email, university)) {
      setError(
        `That email doesn't belong to ${university.name}. Change the email, or go back and pick a different university.`
      )
      return
    }
    setError('')
    handleStartSignup()
  }

  // Requests an OTP; does NOT create the account yet. Interests are omitted
  // on purpose — they're collected on step 4, and the endpoint treats them as
  // optional for exactly that reason.
  const handleStartSignup = async () => {
    setIsLoading(true)
    setError('')
    setInfo('')

    try {
      const response = await fetch('/api/auth/signup/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not send verification code')
        setIsLoading(false)
        return
      }

      setInfo(`We sent a 6-digit code to ${formData.email.trim().toLowerCase()}.`)
      setOtp('')
      setResendCooldown(60)
      setStep(3)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---- Step 3: verify OTP → creates the account. -----------------------
  const handleVerifyOtp = async (submittedOtp) => {
    const trimmedOtp = (submittedOtp ?? otp).trim()
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit code from your email')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: trimmedOtp,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setIsLoading(false)
        return
      }

      // The account exists and we're signed in from here on. Step 4 is still
      // required though — the feed is interest-matched, so an account with no
      // interests would land on an empty /flares.
      localStorage.setItem('iflare_user', JSON.stringify(data.user))
      localStorage.setItem('iflare_token', data.token)
      setSavedSession(data)
      setIsLoading(false)
      setInfo('')
      setStep(4)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')
    setInfo('')
    try {
      const response = await fetch('/api/auth/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not resend code')
      } else {
        setInfo('A new code has been sent.')
        setResendCooldown(60)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // ---- Step 4: personalisation — interests required, bio optional -------
  const finishSignup = () => router.push('/flares')

  const handleSavePersonalisation = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      setError(`Please pick at least ${MIN_INTERESTS} interests`)
      return
    }

    // An empty bio is a legitimate value, not a skipped field — the endpoint
    // treats bio as optional and stores '' the same way pre-bio accounts read.
    const trimmed = bio.trim()

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedSession?.token}`,
        },
        body: JSON.stringify({
          userId: savedSession?.user?.id,
          interests: selectedInterests,
          bio: trimmed,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not save your profile')
        setIsLoading(false)
        return
      }

      // Keep the cached session in step with what the server now holds.
      const updated = {
        ...savedSession.user,
        interests: selectedInterests,
        bio: trimmed,
      }
      localStorage.setItem('iflare_user', JSON.stringify(updated))
      finishSignup()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  // Step 4 has no Back: the account already exists, so there's nothing to
  // return to, and interests are required to reach the feed.
  const canGoBack = step < 4

  const goBack = () => {
    setError('')
    setInfo('')
    if (step === 1) {
      router.push('/')
    } else {
      setStep(step - 1)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient brand flare behind the header, shared with /login and the
          landing page so the three read as one entrance. */}

      <div className="app-column app-gutter relative flex min-h-screen flex-col py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          {canGoBack ? (
            <button
              onClick={goBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <Logo size="md" />

          <div className="w-10" />
        </div>

        <StepProgress steps={STEPS} currentStep={step} />

        <FormBanner tone="error">{error}</FormBanner>
        {!error && <FormBanner tone="success">{info}</FormBanner>}

        {/* ---------------- Step 1: University ---------------- */}
        {step === 1 && (
          <div
            key="step-1"
            className="flex flex-1 animate-fade-in-up flex-col"
            onKeyDown={universityStepKeyDown}
          >
            <h1 className="mb-2 text-3xl font-bold">Where do you study?</h1>
            <p className="mb-6 text-ink-muted">
              iFLARE only shows you flares from your own campus, so we need to
              know which one that is.
            </p>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
              <Input
                value={uniQuery}
                onChange={(e) => setUniQuery(e.target.value)}
                placeholder="Search your university"
                aria-label="Search your university"
                className="h-14 rounded-xl pl-12"
              />
            </div>

            <div className="mb-4 max-h-[19rem] space-y-2 overflow-y-auto pr-1 sm:max-h-[46vh]">
              {uniResults.map((uni) => {
                const selected = university?.name === uni.name
                return (
                  <button
                    key={uni.name}
                    type="button"
                    onClick={() => handleSelectUniversity(uni)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                      selected
                        ? 'border-brand-500 bg-brand-500/10 hover:bg-brand-500/20'
                        : 'border-line-subtle bg-surface-1 hover:bg-surface-2'
                    }`}
                  >
                    <Building2
                      className={`h-4 w-4 shrink-0 ${
                        selected ? 'text-brand-400' : 'text-ink-subtle'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {uni.name}
                      </span>
                      <span className="block truncate text-xs text-ink-subtle">
                        {uni.domains.join(' · ')}
                      </span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
                  </button>
                )
              })}

              {uniResults.length === 0 && (
                <p className="px-1 py-3 text-sm text-ink-subtle">
                  No match for &ldquo;{uniQuery}&rdquo;. Your university may
                  still work — pick the option below.
                </p>
              )}

              {/* Not an error case: any .ac.in / .edu.in address is accepted. */}
              <button
                type="button"
                onClick={() => handleSelectUniversity(OTHER_UNIVERSITY)}
                aria-pressed={Boolean(university?.other)}
                className={`flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left ${
                  university?.other
                    ? 'border-brand-500 bg-brand-500/10 hover:bg-brand-500/20'
                    : 'border-line bg-surface-1/60 hover:bg-surface-2'
                }`}
              >
                <Building2
                  className={`h-4 w-4 shrink-0 ${
                    university?.other ? 'text-brand-400' : 'text-ink-subtle'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {OTHER_UNIVERSITY.name}
                  </span>
                  <span className="block text-xs text-ink-subtle">
                    Any .ac.in or .edu.in email works
                  </span>
                </span>
                {university?.other && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
              </button>
            </div>

            <div className="mt-auto pt-4">
              {/* Not disabled: its "pick your university" branch was otherwise
                  unreachable, which left a grey button as the only explanation. */}
              <Button size="lg" className="w-full" onClick={handleUniversityContinue}>
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>

              <p className="mt-6 text-center text-sm text-ink-subtle">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-brand-400 hover:text-brand-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ---------------- Step 2: Account ---------------- */}
        {step === 2 && (
          <form
            key="step-2"
            className="flex flex-1 animate-fade-in-up flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              handleAccountContinue()
            }}
          >
            <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
            <p className="mb-6 text-ink-muted">
              {university?.other
                ? 'Use your university email address.'
                : `Use your ${university?.name} email address.`}
            </p>

            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm text-ink-muted">
                  Nickname
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                  <Input
                    id="name"
                    name="name"
                    autoComplete="nickname"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="What should people call you?"
                    className="h-14 rounded-xl pl-12"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-subtle">
                  Shown to people on flares you host or join.
                </p>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-ink-muted">
                  University email
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
                    placeholder={
                      university?.other
                        ? 'you@university.ac.in'
                        : `you@${university?.domains?.[0] ?? 'university.ac.in'}`
                    }
                    className="h-14 rounded-xl pl-12"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm text-ink-muted">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 6 characters"
                    className="h-14 rounded-xl pl-12 pr-12"
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

            <div className="mt-auto pt-4">
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-ink-subtle">
                By continuing you agree to our{' '}
                <Link href="/terms" className="text-ink-muted underline hover:text-ink">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-ink-muted underline hover:text-ink">
                  Privacy Policy
                </Link>
                .
              </p>

              <p className="mt-4 text-center text-sm text-ink-subtle">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-brand-400 hover:text-brand-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* ---------------- Step 3: OTP ---------------- */}
        {step === 3 && (
          <div
            key="step-3"
            className="flex flex-1 animate-fade-in-up flex-col"
            onKeyDown={otpStepKeyDown}
          >
            <h1 className="mb-2 text-3xl font-bold">Check your inbox</h1>
            <p className="mb-8 text-ink-muted">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-ink">
                {formData.email.trim().toLowerCase()}
              </span>
              .
            </p>

            <div className="mb-6 flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  setError('')
                }}
                onComplete={(value) => handleVerifyOtp(value)}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="tabular h-14 w-12 border-line bg-surface-3 text-lg text-ink shadow-e1 first:rounded-l-lg last:rounded-r-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendLoading}
                className="text-sm text-brand-400 hover:text-brand-300 disabled:text-ink-disabled"
              >
                {resendLoading
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend code'}
              </button>
            </div>

            <div className="mt-auto pt-6">
              {/* Only the in-flight state disables this: with the code short,
                  pressing it is how the user asks what's wrong. */}
              <Button
                size="lg"
                className="w-full"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 w-full text-center text-sm text-ink-subtle hover:text-ink"
              >
                Wrong email? Change it
              </button>
            </div>
          </div>
        )}

        {/* ---------------- Step 4: Personalisation ---------------- */}
        {step === 4 && (
          <div key="step-4" className="flex flex-1 animate-fade-in-up flex-col">
            <div className="mb-6 flex items-center gap-2 text-success">
              <PartyPopper className="h-5 w-5" />
              <span className="text-sm font-medium">You&apos;re in!</span>
            </div>

            <h1 className="mb-2 text-3xl font-bold">Finish your profile</h1>
            <p className="mb-6 text-ink-muted">
              Pick at least {MIN_INTERESTS} interests — they decide which flares
              show up in your feed. Add your own if something is missing.
            </p>

            <InterestSelector
              value={selectedInterests}
              onChange={(next) => {
                setSelectedInterests(next)
                setError('')
              }}
              userId={savedSession?.user?.id}
              min={MIN_INTERESTS}
              className="mb-8"
            />

            <div className="mb-2">
              <label htmlFor="bio" className="mb-2 block text-sm text-ink-muted">
                Short bio <span className="text-ink-subtle">(optional)</span>
              </label>
              {/* No Enter-to-submit here on purpose: Enter inserts a newline. */}
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                rows={4}
                placeholder="Second year CS. Usually at the gym or the library. Always up for chai."
                className="resize-y rounded-xl"
              />
              <p className="tabular mt-2 text-right text-xs text-ink-subtle">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>

            <div className="mt-auto pt-6">
              {/* One primary action, no Skip: without interests the feed has
                  nothing to match against, so /flares would open empty. */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleSavePersonalisation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
