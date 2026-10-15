'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { requestNotificationPermission, getNotificationPermission, sendNotification, isNotificationSupported } from './notifications'
import { interestEmoji } from './interests'

const NotificationContext = createContext(null)

/*
 * Storage writes that cannot throw.
 *
 * Three of these calls happen inside a setState updater, so a raw
 * localStorage.setItem there throws during React's render phase — and this
 * provider wraps the entire app, so that takes down every page rather than one
 * feature. Storage is unavailable in a third-party iframe (which
 * next.config.js explicitly allows via `frame-ancestors *`), in Safari private
 * mode, and when it is simply full. Notification history is a convenience, so
 * losing the write is the right trade; losing the app is not.
 */
function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch (e) {
    // Non-fatal: the in-memory state is still correct for this session.
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch (e) {
    // Non-fatal.
  }
}

/**
 * True when the flare was hosted by the person currently signed in.
 *
 * Read from localStorage at call time rather than held in state: the session is
 * stored there by every page in the app, and the provider mounts above the
 * pages that load it.
 */
function isOwnFlare(flare) {
  const hostId = flare?.host?.id
  if (!hostId || typeof window === 'undefined') return false
  try {
    const stored = window.localStorage.getItem('iflare_user')
    if (!stored) return false
    return JSON.parse(stored)?.id === hostId
  } catch (e) {
    return false // unreadable session — fall back to notifying
  }
}

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('default')
  const [inAppNotifications, setInAppNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasAskedPermission, setHasAskedPermission] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // The getItem calls used to sit outside the try. This provider wraps the
      // whole app, so when storage throws — a third-party iframe, which
      // next.config.js explicitly allows, or Safari private mode — the throw
      // took out the mount effect of every page at once.
      let stored = null
      let asked = null
      try {
        stored = localStorage.getItem('iflare_notifications')
        asked = localStorage.getItem('iflare_notification_asked')
      } catch (e) {
        // Storage unavailable: fall through on the initialised empty state.
      }

      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setInAppNotifications(parsed)
          setUnreadCount(parsed.filter(n => !n.read).length)
        } catch (e) {
          console.error('Error parsing notifications:', e)
        }
      }

      if (asked) {
        setHasAskedPermission(true)
      }

      if (isNotificationSupported()) {
        setPermission(Notification.permission)
      }
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    setHasAskedPermission(true)
    safeWrite('iflare_notification_asked', 'true')
    return granted
  }, [])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }

    setInAppNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50) // Keep last 50
      safeWrite('iflare_notifications', JSON.stringify(updated))
      return updated
    })

    setUnreadCount(prev => prev + 1)

    // Also send browser notification if permitted
    if (getNotificationPermission() === 'granted') {
      sendNotification(notification.title, {
        body: notification.body,
        url: notification.url
      })
    }

    return newNotification
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setInAppNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      safeWrite('iflare_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setInAppNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      safeWrite('iflare_notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setInAppNotifications([])
    setUnreadCount(0)
    safeRemove('iflare_notifications')
  }, [])

  // Notify about a new flare that matches the user's interests.
  //
  // Never fires for the recipient's own flare: they just created it, so telling
  // them it matches their interests is noise. The check lives here rather than
  // at the call site so every future caller — including a real server-side
  // fan-out — inherits it. Notifications for other users are unaffected.
  const notifyNewFlare = useCallback((flare, matchedInterests) => {
    if (isOwnFlare(flare)) return

    // interestEmoji, not a local map: this file used to carry its own copy of
    // the twelve built-in emoji, which meant a custom interest fell back to 🔥
    // here and to ✨ everywhere else, and a new built-in would have had to be
    // added in two places.
    addNotification({
      type: 'new_flare',
      title: `${interestEmoji(flare.interests?.[0])} A new flare matches your interests`,
      body: flare.title,
      description: flare.description,
      flareId: flare.id,
      url: '/flares',
      matchedInterests
    })
  }, [addNotification])

  const value = {
    permission,
    hasAskedPermission,
    inAppNotifications,
    unreadCount,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    notifyNewFlare
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
