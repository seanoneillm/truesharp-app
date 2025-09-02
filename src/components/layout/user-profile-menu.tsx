'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { cn } from '@/lib/utils'
import { ChevronDown, HelpCircle, LogOut, Settings, User } from 'lucide-react'
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
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

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
    if (!isHydrated || authLoading || profileLoading) return 'U'
    if (profile?.display_name) return profile.display_name.charAt(0).toUpperCase()
    if (profile?.username) return profile.username.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const getDisplayName = () => {
    if (!isHydrated || authLoading || profileLoading) return 'User'
    return profile?.display_name || profile?.username || user?.email || 'User'
  }

  const handleSignOut = async () => {
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Show loading state until hydrated and auth is complete
  if (!isHydrated || authLoading || profileLoading) {
    return (
      <div className={cn('relative', className)}>
        <button
          disabled
          className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          <div className="hidden lg:block">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg p-2 transition-colors',
          'hover:bg-gray-50',
          isOpen && 'bg-gray-50'
        )}
      >
        {/* Profile Picture */}
        <div className="relative">
          {profile?.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm ring-2 ring-white">
              <span className="text-sm font-medium text-white">{getUserInitials()}</span>
            </div>
          )}
          {profile?.is_verified_seller && (
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-blue-600 p-0.5">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <div className="text-left">
            <div className="max-w-32 truncate text-sm font-medium text-gray-900">
              {getDisplayName()}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/5">
          <div className="py-2">
            {/* Profile Info Header - Mobile Only */}
            <div className="border-b border-gray-100 px-4 py-3 lg:hidden">
              <div className="flex items-center gap-3">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="font-medium text-white">{getUserInitials()}</span>
                  </div>
                )}
                <div>
                  <div className="truncate font-medium text-gray-900">{getDisplayName()}</div>
                  {profile?.bio && (
                    <div className="max-w-32 truncate text-xs text-gray-500">{profile.bio}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleMenuClick('/settings')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleMenuClick('/help')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <span>Help</span>
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
