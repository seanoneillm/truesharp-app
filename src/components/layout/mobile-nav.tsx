'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Menu,
  X,
  Home,
  BarChart3,
  Store,
  Users,
  Settings,
  DollarSign,
  TrendingUp,
  Bell,
  Search,
  User,
  LogOut,
  Crown,
} from 'lucide-react'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Subscriptions', href: '/subscriptions', icon: Users },
    { name: 'Sell Picks', href: '/sell', icon: DollarSign },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  if (!isOpen) return null

  return (
    <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-0 flex">
        <div className="relative mr-16 flex w-full max-w-xs flex-1">
          {/* Close button */}
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* Sidebar component */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center">
              <Link href="/dashboard" className="flex items-center" onClick={onClose}>
                <TrendingUp className="mr-2 h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">TrueSharp</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul className="-mx-2 space-y-1">
                    {navigation.map(item => {
                      const current = isCurrentPath(item.href)
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                              current
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-6 w-6 shrink-0',
                                current
                                  ? 'text-blue-700'
                                  : 'text-gray-400 group-hover:text-blue-700'
                              )}
                            />
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>

                {/* Pro upgrade section */}
                <li className="mt-auto">
                  <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                    <div className="mb-2 flex items-center">
                      <Crown className="mr-2 h-5 w-5 text-yellow-300" />
                      <span className="text-sm font-semibold">Go Pro</span>
                    </div>
                    <p className="mb-3 text-xs text-blue-100">Unlock advanced features</p>
                    <Link
                      href="/upgrade"
                      onClick={onClose}
                      className="block w-full rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Upgrade
                    </Link>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Header Component with hamburger menu
export function MobileHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-gray-400" />
            <input
              className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Search..."
              type="search"
            />
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button type="button" className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}

export default MobileNav
