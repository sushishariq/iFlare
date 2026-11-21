'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function ThemeToggle({ className = '' }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Toggle theme'}
      className={`group inline-flex h-11 items-center gap-1 rounded-full border border-slate-600 bg-slate-900 p-1 text-slate-300 shadow-sm transition-colors hover:border-orange-500 ${className}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${!isDark ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
        <Sun className="h-4 w-4" />
      </span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
        <Moon className="h-4 w-4" />
      </span>
    </button>
  )
}
