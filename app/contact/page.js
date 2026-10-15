/*
 * PUBLIC copy of the Contact page. Its signed-in twin is
 * app/(app)/info/contact/page.js — keep the prose in the two in step.
 */

import Link from 'next/link'
import { Mail, MessageSquareHeart } from 'lucide-react'

import PublicInfoShell, { PublicInfoSection } from '@/components/PublicInfoShell'
import { CONTACT_EMAIL, hasContactEmail, mailtoLink } from '@/lib/site'

export const metadata = {
  title: 'Contact · iFLARE',
  description: 'How to get in touch with the iFLARE team.',
}

export default function ContactPage() {
  const mailto = mailtoLink('iFLARE — Contact')

  return (
    <PublicInfoShell
      title="Contact"
      subtitle="Questions, issues, or anything about your account."
    >
      <PublicInfoSection>
        {hasContactEmail ? (
          <a
            href={mailto}
            className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-1 px-4 py-3.5 transition-colors hover:border-line hover:bg-surface-2"
          >
            <Mail className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="text-sm text-ink">{CONTACT_EMAIL}</span>
          </a>
        ) : (
          <div className="rounded-xl border border-line-subtle bg-surface-1 px-4 py-3.5">
            <p className="text-sm text-ink-muted">
              A contact address hasn&apos;t been set up yet.
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              iFLARE is an early-stage student project — this page will carry a
              real address before launch.
            </p>
          </div>
        )}
      </PublicInfoSection>

      <PublicInfoSection heading="Reporting a problem">
        <p>
          If something in the app is broken, the{' '}
          <Link href="/feedback" className="text-brand-400 hover:underline">
            feedback page
          </Link>{' '}
          is the fastest route — it goes to the same place and you can describe
          what happened.
        </p>
      </PublicInfoSection>

      <PublicInfoSection heading="Account and data requests">
        <p>
          To ask what data is held about you, or to have your account deleted,
          get in touch using the details above. See the{' '}
          <Link href="/privacy" className="text-brand-400 hover:underline">
            Privacy Policy
          </Link>{' '}
          for what iFLARE stores.
        </p>
      </PublicInfoSection>

      <div className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface-1 px-4 py-3.5">
        <MessageSquareHeart className="h-4 w-4 shrink-0 text-brand-500" />
        <p className="text-xs text-ink-subtle">
          This is a student project, so replies come from a real person rather
          than a support desk — please be patient.
        </p>
      </div>
    </PublicInfoShell>
  )
}
