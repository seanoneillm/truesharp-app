'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import { ChevronDown, HelpCircle, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface UserProfileMenuProps {
  className?: string
}

export function UserProfileMenu({ className }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleMenuClick = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }


  const getUserInitials = () => {
    if (!isHydrated || loading) return 'U'
    if (user?.name) return user.name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const getDisplayName = () => {
    if (!isHydrated || loading) return 'User'
    return user?.name || user?.email || 'User'
  }

  // Show loading state until hydrated and auth is complete
  if (!isHydrated || loading) {
    return (
      <div className={cn("relative", className)}>
        <button
          disabled
          className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-50"
        >
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="hidden lg:block">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-colors",
          "hover:bg-gray-50",
          isOpen && "bg-gray-50"
        )}
      >
        {/* Profile Picture */}
        <div className="relative">
          {/* For now, just show initials - avatar support can be added later */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900 truncate max-w-32">
              {getDisplayName()}
            </div>
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 z-50 rounded-xl bg-white shadow-lg ring-1 ring-gray-900/5 border border-gray-200">
          <div className="py-2">
            {/* Profile Info Header - Mobile Only */}
            <div className="lg:hidden px-4 py-3 border-b border-gray-100">
              <div className="font-medium text-gray-900 truncate">
                {getDisplayName()}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleMenuClick('/settings')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleMenuClick('/help')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
