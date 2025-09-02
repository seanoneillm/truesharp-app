'use client'

import BetSlipToast from '@/components/bet-slip/BetSlipToast'
import { useState } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error'
  id: number
}

export const useBetSlipToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { message, type, id }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <BetSlipToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, ToastContainer }
}
