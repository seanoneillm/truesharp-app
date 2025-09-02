'use client'

import { isValidElement, ReactNode, useEffect } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

interface DialogContentProps {
  children: ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: ReactNode
}

interface DialogTitleProps {
  children: ReactNode
}

interface DialogDescriptionProps {
  children: ReactNode
}

interface DialogTriggerProps {
  children: ReactNode
  asChild?: boolean
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Content */}
      <div className="relative z-10 my-auto w-full">{children}</div>
    </div>
  )
}

export function DialogTrigger({ children, asChild = false }: DialogTriggerProps) {
  // This component is used as a trigger for the dialog
  // It doesn't render anything by itself, just passes through the children
  // The actual trigger logic is handled by the parent Dialog component
  if (asChild && isValidElement(children)) {
    return children
  }

  return <>{children}</>
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div
      className={`relative max-h-[90vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${className}`}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">{children}</div>
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="flex items-center justify-between text-lg font-semibold text-slate-900">
      {children}
    </h2>
  )
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <p className="mt-2 text-sm text-slate-600">{children}</p>
}
