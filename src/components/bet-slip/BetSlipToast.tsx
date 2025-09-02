'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BetSlipToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function BetSlipToast({ message, type, onClose }: BetSlipToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setIsVisible(true)

    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 150) // Wait for animation to finish
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex transform items-center space-x-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'} ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      } `}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
