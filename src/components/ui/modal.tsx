import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className,
  size = 'default'
}) => {
  const sizes = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative bg-background rounded-lg shadow-lg w-full',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const ModalHeader: React.FC<{
  children: React.ReactNode
  className?: string
  onClose?: () => void
}> = ({ children, className, onClose }) => {
  return (
    <div className={cn('flex items-center justify-between p-6 border-b', className)}>
      <div>{children}</div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

const ModalTitle: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  )
}

const ModalDescription: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  )
}

const ModalContent: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

const ModalFooter: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-end space-x-2 p-6 border-t', className)}>
      {children}
    </div>
  )
}

// Confirmation Modal
export const ConfirmModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <ModalDescription>{description}</ModalDescription>
      </ModalContent>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// Alert Modal
export const AlertModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  description: string | React.ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'default'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
        )
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent className="text-center">
        {getIcon()}
        <div className="mt-3">
          <ModalTitle className="text-center">{title}</ModalTitle>
          <ModalDescription className="mt-2">{description}</ModalDescription>
        </div>
      </ModalContent>
      <ModalFooter className="justify-center">
        <Button onClick={onClose}>OK</Button>
      </ModalFooter>
    </Modal>
  )
}

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
}