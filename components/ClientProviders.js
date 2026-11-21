'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { NotificationProvider } from '@/lib/NotificationProvider'

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NotificationProvider>
        {children}
        <Toaster position="top-center" richColors />
      </NotificationProvider>
    </ThemeProvider>
  )
}
