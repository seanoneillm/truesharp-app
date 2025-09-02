'use client'

import { SearchBar } from '@/components/layout/search-bar'
import { UserProfileMenu } from '@/components/layout/user-profile-menu'
import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

interface TopBarProps {
  className?: string
  mobileMenuButton?: React.ReactNode
}

export function TopBar({ className, mobileMenuButton }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 px-4 shadow-sm backdrop-blur-sm sm:gap-x-6 sm:px-6 lg:px-8',
        className
      )}
    >
      {/* Mobile menu button */}
      {mobileMenuButton}

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search Bar - Full width between sidebar and profile */}
        <SearchBar className="flex-1" placeholder="Search sellers..." />

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            className="relative -m-2.5 p-2.5 text-gray-400 transition-colors hover:text-gray-500"
            aria-label="View notifications"
          >
            <Bell className="h-6 w-6" />
            {/* Notification badge - future feature */}
            {/* <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" /> */}
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          {/* User Profile Menu */}
          <UserProfileMenu />
        </div>
      </div>
    </header>
  )
}
