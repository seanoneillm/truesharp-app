'use client'

import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { Bell, ChevronDown, HelpCircle, LogOut, Search, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Breadcrumbs from './breadcrumbs'
import { MobileHeader } from './mobile-nav'
import Sidebar from './sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { username, displayName, loading } = useUserProfile()

  // Don't show app shell on auth pages or landing page
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/'
  const isAppPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/games') ||
    pathname.startsWith('/marketplace') ||
    pathname.startsWith('/subscriptions') ||
    pathname.startsWith('/sell') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')

  if (isAuthPage || !isAppPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header for desktop */}
        <div className="sticky top-0 z-40 hidden h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:flex lg:px-8">
          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex max-w-md flex-1">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-gray-400" />
              <input
                className="block h-full w-full border-0 bg-transparent py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search bets, teams, or markets..."
                type="search"
              />
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  3
                </span>
              </button>

              {/* Divider */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                      {loading ? 'Loading...' : username}
                    </span>
                    <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                  </span>
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {loading ? 'Loading...' : username}
                      </p>
                      <p className="text-xs text-gray-500">{loading ? '' : displayName}</p>
                    </div>

                    <Link
                      href="/profile/sportsbettor"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Your profile
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>

                    <Link
                      href="/help"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <HelpCircle className="mr-3 h-4 w-4" />
                      Help & Support
                    </Link>

                    <hr className="my-1" />

                    <button
                      className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setUserMenuOpen(false)
                        // Handle logout
                      }}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6 lg:py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumbs />
            </div>

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  )
}
