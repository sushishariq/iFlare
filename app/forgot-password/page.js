'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import StepProgress from '@/components/StepProgress'
import FormBanner from '@/components/FormBanner'
import Logo from '@/components/Logo'
import { ArrowRight, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'

/*
 * The reset flow is the same shape as signup's — email, then a 6-digit code —
 * so it now uses the same parts. It previously ran on a bespoke two-bar
 * progress indicator, a plain text field with tracking-[0.5em] standing in for
 * the OTP input, an orange info banner where /register used emerald, a
 * placeholder hardcoded to one institution, and no htmlFor/id on any field.
 */
const STEPS = ['Email', 'New password']

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: enter email, 2: OTP + new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown ticker for the Resend button.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const sendResetCode = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }
    // Same domain gate as signup — we only serve university emails.
    const uni = resolveUniversity(trimmed)
    if (!uni.valid) {
      setError(uni.reason || 'Please use your university email.')
      return
    }

    setIsLoading(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/auth/forgot-password/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not send reset code')
        return
      }
      setInfo(`If ${trimmed} has an iFLARE account, we've sent a 6-digit reset code.`)
      setOtp('')
      setNewPassword('')
      setResendCooldown(60)
      setStep(2)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndReset = async (submittedOtp) => {
    const code = (submittedOtp ?? otp).trim()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Reset failed')
        return
      }
      // Back to sign-in, where ?reset=1 is now actually read and confirmed.
      router.push('/login?reset=1')
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return
    await sendResetCode()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">

      <div className="app-column app-gutter relative flex min-h-screen flex-col py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => {
              setError('')
              setInfo('')
              if (step === 1) router.push('/login')
              else setStep(1)
            }}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Logo size="md" />

          <div className="w-10" />
        </div>

        <StepProgress steps={STEPS} currentStep={step} />

        <FormBanner tone="error">{error}</FormBanner>
        {!error && <FormBanner tone="success">{info}</FormBanner>}

        {step === 1 && (
          <div key="step-1" className="flex flex-1 animate-fade-in-up flex-col">
            <h1 className="mb-2 text-3xl font-bold">Reset your password</h1>
            <p className="mb-6 text-ink-muted">
              Enter your iFLARE college email and we&apos;ll send you a 6-digit
              code to set a new password.
            </p>

            <div>
              <label htmlFor="reset-email" className="mb-2 block text-sm text-ink-muted">
                College email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="you@university.ac.in"
                  className="h-14 rounded-xl pl-12"
                />
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Button
                size="lg"
                className="w-full"
                onClick={sendResetCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send reset code
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="step-2" className="flex flex-1 animate-fade-in-up flex-col">
            <h1 className="mb-2 text-3xl font-bold">Enter your code</h1>
            <p className="mb-6 text-ink-muted">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-ink">{email.trim().toLowerCase()}</span>. It
              expires in 10 minutes.
            </p>

            <div className="mb-6">
              <label htmlFor="reset-otp" className="mb-2 block text-sm text-ink-muted">
                Verification code
              </label>
              <InputOTP
                id="reset-otp"
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  setError('')
                  setInfo('')
                }}
                // The password below is still required, so a complete code
                // submits only when there is something to submit with it.
                onComplete={(value) => {
                  if (newPassword.length >= 6) verifyAndReset(value)
                }}
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

            <div>
              <label htmlFor="reset-password" className="mb-2 block text-sm text-ink-muted">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                <Input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Choose a new password"
                  aria-describedby="reset-password-hint"
                  className="h-14 rounded-xl pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p id="reset-password-hint" className="mt-2 text-xs text-ink-subtle">
                At least 6 characters.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="mt-4 self-start text-sm text-brand-400 hover:text-brand-300 disabled:text-ink-disabled"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>

            <div className="mt-auto pt-8">
              <Button
                size="lg"
                className="w-full"
                onClick={() => verifyAndReset()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Update password
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
