// FILE: src/lib/hooks/use-notifications.ts
// Notifications data hook for managing user notifications

import { NotificationState } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

interface Notification extends NotificationState {
  read: boolean
  data?: any
  action?: {
    label: string
    url?: string
    onClick?: () => void
  }
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  clearRead: () => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      read: false,
      duration: notification.duration ?? 5000,
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove if autoClose is enabled
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }
  }, [])

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Clear read notifications
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read))
  }, [])

  // Simulate some initial notifications for demo
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Pick Won!',
        message: 'Your Lakers -4.5 pick just won. Great call!',
        autoClose: false,
        duration: 5000,
        read: false,
        data: { pickId: '123', result: 'won' },
        action: {
          label: 'View Pick',
          url: '/picks/123',
        },
      },
      {
        id: '2',
        type: 'info',
        title: 'New Subscriber',
        message: '@newbettor23 just subscribed to your Premium tier',
        autoClose: false,
        duration: 5000,
        read: false,
        data: { subscriberId: '456', tier: 'premium' },
        action: {
          label: 'View Subscriber',
          url: '/sell/subscribers',
        },
      },
      {
        id: '3',
        type: 'warning',
        title: 'Sportsbook Sync Issue',
        message: 'BetMGM connection failed. Please reconnect.',
        autoClose: false,
        duration: 5000,
        read: true,
        data: { sportsbook: 'betmgm' },
        action: {
          label: 'Reconnect',
          url: '/settings/sportsbooks',
        },
      },
    ]

    // Only set demo notifications if none exist
    setNotifications(prev => (prev.length === 0 ? demoNotifications : prev))
  }, [])

  // Helper functions for common notification types
  const showSuccess = useCallback(
    (message: string, title?: string) => {
      addNotification({
        type: 'success',
        title: title || 'Success',
        message,
        autoClose: true,
        duration: 3000,
      })
    },
    [addNotification]
  )

  const showError = useCallback(
    (message: string, title?: string) => {
      addNotification({
        type: 'error',
        title: title || 'Error',
        message,
        autoClose: true,
        duration: 5000,
      })
    },
    [addNotification]
  )

  const showWarning = useCallback(
    (message: string, title?: string) => {
      addNotification({
        type: 'warning',
        title: title || 'Warning',
        message,
        autoClose: true,
        duration: 4000,
      })
    },
    [addNotification]
  )

  const showInfo = useCallback(
    (message: string, title?: string) => {
      addNotification({
        type: 'info',
        title: title || 'Info',
        message,
        autoClose: true,
        duration: 3000,
      })
    },
    [addNotification]
  )

  return {
    notifications,
    unreadCount,
    isLoading: false,
    error: null,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    // Helper methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
