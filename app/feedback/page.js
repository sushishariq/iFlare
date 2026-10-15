/*
 * PUBLIC copy of the Feedback page. Its signed-in twin is
 * app/(app)/info/feedback/page.js — keep the prose in the two in step.
 *
 * A server component so it can export `metadata`; the interactive composer is
 * the client child. As a single 'use client' page this route silently had no
 * title and fell back to the root default.
 */

import PublicInfoShell from '@/components/PublicInfoShell'
import PublicFeedbackForm from '@/components/PublicFeedbackForm'

export const metadata = {
  title: 'Feedback · iFLARE',
  description: 'Tell us what is working, what is not, and what is missing.',
}

export default function FeedbackPage() {
  return (
    <PublicInfoShell
      title="Feedback"
      subtitle="Tell us what's working, what isn't, and what's missing."
    >
      <PublicFeedbackForm />
    </PublicInfoShell>
  )
}
