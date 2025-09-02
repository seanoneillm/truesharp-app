'use client'

import { NavigationItems } from '@/components/layout/navigation-items'
import { ProCTA } from '@/components/layout/pro-cta'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent hydration mismatch by rendering consistent layout until mounted
  if (!isMounted) {
    return (
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out',
          className
        )}
      >
        {/* Header with Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center">
            <TrueSharpShield className="h-8 w-8 shrink-0 text-blue-600" />
            <span className="ml-2 truncate text-xl font-bold text-gray-900">TrueSharp</span>
          </Link>
          {/* Static button for SSR - no onClick handler */}
          <div className="rounded-md p-1.5 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <NavigationItems isCollapsed={false} />
          </nav>
          <div className="border-t border-gray-200 p-4">
            <ProCTA />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/dashboard" className="flex min-w-0 items-center">
          <TrueSharpShield className="h-8 w-8 shrink-0 text-blue-600" />
          {isMounted && !isCollapsed && (
            <span className="ml-2 truncate text-xl font-bold text-gray-900">TrueSharp</span>
          )}
          {!isMounted && (
            <span className="ml-2 truncate text-xl font-bold text-gray-900">TrueSharp</span>
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-gray-600" />
          ) : (
            <X className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <NavigationItems isCollapsed={isCollapsed} />
        </nav>

        {/* Pro CTA - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4">
            <ProCTA />
          </div>
        )}
      </div>
    </div>
  )
}
