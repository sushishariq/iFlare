'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock3, GraduationCap, MapPin, MessageSquareHeart, Plus, Radar, ShieldCheck, Users } from 'lucide-react'

import ThemeToggle from '@/components/ThemeToggle'

const SAMPLE_FLARES = [
  { title: 'Pickup basketball', location: 'Rec Center Courts', time: 'Happening now', people: 12, tag: 'Sports', glyph: '🏀' },
  { title: 'Library study sprint', location: 'Main Library · 204', time: 'Starts in 18 min', people: 8, tag: 'Study', glyph: '📚' },
  { title: 'Dinner, anyone?', location: 'North Dining Hall', time: 'Starts in 34 min', people: 5, tag: 'Social', glyph: '🍜' },
]

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-40 border-b border-slate-700 bg-slate-950/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12" aria-label="Main navigation">
          <Brand />
          <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#live" className="scribble-underline text-slate-100">What&apos;s happening</a>
            <a href="#how" className="text-slate-400 transition-colors hover:text-slate-100">How it works</a>
            <Link href="/about" className="text-slate-400 transition-colors hover:text-slate-100">About</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="scale-90 sm:scale-100" />
            <button type="button" onClick={() => router.push('/login')} className="h-11 rounded-full px-4 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-800">Sign in</button>
            <button type="button" onClick={() => router.push('/register')} className="hidden h-11 rounded-full bg-orange-600 px-5 text-sm font-bold text-white shadow-[0_4px_0_hsl(var(--brand-800))] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none sm:block">Join iFlare</button>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[46rem] w-full max-w-[90rem] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-20">
        <div className="relative z-10">
          <p className="eyebrow mb-5">Made for campus life</p>
          <h1 className="display-type max-w-4xl text-[clamp(4.6rem,9.2vw,9.4rem)] leading-[.78] tracking-[-.055em] text-slate-50">
            Your campus.<br />Right <span className="scribble-underline text-orange-500">now.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400 sm:text-xl">
            The plans worth joining are already happening. iFlare helps you find the people, places, and moments around you before they disappear.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => router.push('/register')} className="h-14 rounded-full bg-orange-600 px-8 text-base font-bold text-white shadow-[0_5px_0_hsl(var(--brand-800))] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">See what&apos;s live</button>
            <button type="button" onClick={() => router.push('/register')} className="h-14 rounded-full border-2 border-slate-200 bg-slate-950 px-8 text-base font-bold text-slate-100 transition-colors hover:border-orange-500">Start something</button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-500"><ShieldCheck className="h-4 w-4 text-orange-500" />University email required. Your campus stays your campus.</p>
        </div>

        <CampusPoster />
      </section>

      <section className="border-y border-slate-700 bg-orange-600 text-white">
        <div className="mx-auto grid w-full max-w-[90rem] md:grid-cols-3">
          {[
            ['90 min', 'A focused window for plans that are actually relevant now.'],
            ['Campus only', 'Your verified university community, without the noise.'],
            ['Interest matched', 'Flares shaped around the things you already care about.'],
          ].map(([title, text], index) => (
            <div key={title} className={`px-6 py-8 sm:px-10 ${index > 0 ? 'border-t border-white/20 md:border-l md:border-t-0' : ''}`}>
              <p className="display-type text-4xl tracking-tight">{title}</p>
              <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-white/80">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="live" className="mx-auto w-full max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="eyebrow mb-4">The campus pulse</p>
            <h2 className="display-type text-6xl leading-[.86] tracking-[-.04em] text-slate-50 sm:text-7xl">Small plans.<br /><span className="text-orange-500">Real people.</span></h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-400 lg:justify-self-end">No endless feed. No events from last week. Just a clear view of spontaneous plans close enough to join.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SAMPLE_FLARES.map((flare, index) => <SampleFlare key={flare.title} flare={flare} index={index} />)}
        </div>
      </section>

      <section id="how" className="relative border-y border-slate-700 bg-slate-100 text-slate-950">
        <div className="mx-auto grid w-full max-w-[90rem] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-12 lg:py-28">
          <div className="relative flex min-h-[30rem] items-center justify-center">
            <div className="absolute h-[25rem] w-[25rem] rotate-[-7deg] rounded-[38%_62%_51%_49%/44%_38%_62%_56%] bg-orange-500" />
            <div className="relative w-[20rem] rotate-3 rounded-[2rem] border-2 border-slate-950 bg-slate-950 p-5 text-slate-50 shadow-[12px_14px_0_hsl(var(--brand-200))]">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <span className="flex items-center gap-2 font-bold"><Radar className="h-5 w-5 text-orange-400" />Tonight nearby</span>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300">3 live</span>
              </div>
              <div className="space-y-3 pt-4">
                {SAMPLE_FLARES.slice(0, 2).map((flare) => (
                  <div key={flare.title} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="font-bold">{flare.glyph} {flare.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{flare.location}</p>
                  </div>
                ))}
              </div>
            </div>
            <span className="display-type absolute right-[2%] top-[8%] rotate-12 text-2xl text-orange-700 sm:right-[12%]">This way!</span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="eyebrow mb-4">Less scrolling, more showing up</p>
            <h2 className="display-type max-w-xl text-6xl leading-[.86] tracking-[-.04em] sm:text-7xl">From “anyone free?” to <span className="scribble-underline">see you there.</span></h2>
            <div className="mt-10 space-y-7">
              {[
                { icon: Radar, title: 'Spot the signal', text: 'Open iFlare and see plans starting around your campus now.' },
                { icon: Users, title: 'Find your crowd', text: 'Interests keep the feed relevant without locking you into a bubble.' },
                { icon: Plus, title: 'Make the first move', text: 'Create a flare in a few taps and let the right people find it.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="grid grid-cols-[3.5rem_1fr] gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white"><Icon className="h-6 w-6" /></span>
                  <div><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-1 max-w-lg leading-7 text-slate-400">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-orange-600 px-6 py-16 text-center text-white sm:px-10 lg:py-24">
          <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full border-[24px] border-white/15" />
          <span className="absolute -bottom-16 -right-8 h-52 w-52 rounded-full border-[28px] border-white/15" />
          <GraduationCap className="mx-auto h-12 w-12" />
          <h2 className="display-type mx-auto mt-5 max-w-4xl text-6xl leading-[.85] tracking-[-.04em] sm:text-8xl">Campus is better when you&apos;re in it.</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">Join your verified university community and make the next ninety minutes count.</p>
          <button type="button" onClick={() => router.push('/register')} className="mt-9 h-14 rounded-full bg-white px-8 text-base font-extrabold text-orange-700 shadow-[0_5px_0_hsl(var(--brand-900))] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">Create your account</button>
        </div>
      </section>

      <footer className="border-t border-slate-700 bg-slate-950">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center justify-between gap-6 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:px-8 lg:px-12">
          <div><Brand /><p className="mt-2">Real connections, right now.</p></div>
          <nav className="flex flex-wrap justify-center gap-5"><Link href="/about" className="hover:text-slate-200">About</Link><Link href="/contact" className="hover:text-slate-200">Contact</Link><Link href="/privacy" className="hover:text-slate-200">Privacy</Link><Link href="/terms" className="hover:text-slate-200">Terms</Link><Link href="/feedback" className="flex items-center gap-1.5 hover:text-slate-200"><MessageSquareHeart className="h-4 w-4" />Feedback</Link></nav>
        </div>
      </footer>
    </main>
  )
}

function CampusPoster() {
  return (
    <div className="relative mx-auto min-h-[34rem] w-full max-w-[38rem]" aria-hidden>
      <div className="absolute inset-[6%_4%_5%_9%] rotate-3 rounded-[44%_56%_43%_57%/55%_42%_58%_45%] bg-orange-500" />
      <div className="absolute left-[8%] top-[3%] w-[72%] -rotate-6 rounded-[2rem] border-2 border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[12px_14px_0_hsl(var(--brand-200))] sm:p-8">
        <div className="flex items-center justify-between"><span className="eyebrow">Live signal</span><Radar className="h-6 w-6 text-orange-400" /></div>
        <p className="display-type mt-10 text-5xl leading-[.82] sm:text-6xl">Something&apos;s happening.</p>
        <div className="mt-8 flex items-center gap-3 border-t border-slate-700 pt-5">
          <div className="flex -space-x-2">{['A', 'M', 'R'].map((letter) => <span key={letter} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-orange-500 text-xs font-bold text-white">{letter}</span>)}</div>
          <p className="text-sm text-slate-400"><strong className="text-slate-100">12 students</strong><br />nearby right now</p>
        </div>
      </div>
      <div className="absolute bottom-[3%] right-[1%] w-[58%] rotate-6 rounded-[1.7rem] border-2 border-slate-200 bg-slate-950 p-5 text-slate-50 shadow-[-8px_10px_0_hsl(var(--plum-500))]">
        <span className="text-3xl">🏀</span><p className="mt-3 text-lg font-extrabold">Pickup basketball</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />Rec Center · now</p>
      </div>
      <p className="display-type absolute bottom-[7%] left-0 -rotate-6 text-2xl text-orange-700">Don&apos;t miss it!</p>
    </div>
  )
}

function SampleFlare({ flare, index }) {
  const rotations = ['md:-rotate-1', 'md:rotate-1', 'md:-rotate-[.5deg]']
  return (
    <article className={`group relative overflow-hidden rounded-[1.75rem] border-2 border-slate-700 bg-slate-950 p-6 shadow-[0_8px_0_hsl(var(--slate-700))] transition-transform hover:-translate-y-1 ${rotations[index]}`}>
      <div className="flex items-start justify-between"><span className="text-4xl">{flare.glyph}</span><span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-500">{flare.tag}</span></div>
      <h3 className="mt-8 text-2xl font-extrabold tracking-[-.035em] text-slate-100">{flare.title}</h3>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4 text-orange-500" />{flare.location}</p>
      <div className="mt-7 flex items-end justify-between border-t border-slate-700 pt-5">
        <span className="text-sm font-bold text-orange-500"><Clock3 className="mr-1.5 inline h-4 w-4" />{flare.time}</span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500"><Users className="h-4 w-4" />{flare.people}</span>
      </div>
    </article>
  )
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="iFLARE home">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white"><Radar className="h-5 w-5" /></span>
      <span className="text-xl font-extrabold tracking-[-.05em] text-slate-100">iFLARE</span>
    </Link>
  )
}
