/*
 * IN-APP copy of the About page, for signed-in users reaching it from the
 * sidebar or Settings. Its public twin is app/about/page.js — keep the prose in
 * the two in step.
 *
 * Living inside the (app) group means app/(app)/layout.js supplies the sidebar
 * server-side, so there is no session read here and no flash of public chrome.
 */

import AppInfoShell, { AppInfoSection } from '@/components/AppInfoShell'

export const metadata = {
  title: 'About · iFLARE',
  description: 'What iFLARE is and why it exists.',
}

export default function AboutPage() {
  return (
    <AppInfoShell title="About iFLARE" subtitle="Real connections. Right now.">
      <AppInfoSection heading="What it is">
        <p>
          iFLARE is a place to post what you&apos;re about to do on campus and
          find someone to do it with. A gym session, a coffee run, a study
          grind, an evening ride — you post it as a &ldquo;flare&rdquo;, and
          people at your university can join.
        </p>
      </AppInfoSection>

      <AppInfoSection heading="Why spontaneous">
        <p>
          Most plans die in group chats. iFLARE is built for the next hour, not
          next month. Flares appear on the feed 90 minutes before they start and
          drop off once they begin, so what you see is always something you can
          actually turn up to.
        </p>
      </AppInfoSection>

      <AppInfoSection heading="Why campus-only">
        <p>
          You sign up with your university email, and you only ever see flares
          from people at your own university. It keeps the feed relevant, keeps
          meetups within walking distance, and means you&apos;re meeting peers
          rather than strangers from across the country.
        </p>
      </AppInfoSection>

      <AppInfoSection heading="Where it's at">
        <p>
          iFLARE is an early-stage student project and is still being built. If
          something is broken or missing, telling us is genuinely useful — use
          the feedback page and it will be read.
        </p>
      </AppInfoSection>
    </AppInfoShell>
  )
}
