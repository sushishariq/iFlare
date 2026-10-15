/*
 * IN-APP copy of the Feedback page. Its public twin is app/feedback/page.js —
 * keep the prose in the two in step.
 *
 * A server component so it can export `metadata`; the interactive composer is
 * the client child.
 */

import AppInfoShell from '@/components/AppInfoShell'
import AppFeedbackForm from '@/components/AppFeedbackForm'

export const metadata = {
  title: 'Feedback · iFLARE',
  description: 'Tell us what is working, what is not, and what is missing.',
}

export default function FeedbackPage() {
  return (
    <AppInfoShell
      title="Feedback"
      subtitle="Tell us what's working, what isn't, and what's missing."
    >
      <AppFeedbackForm />
    </AppInfoShell>
  )
}
