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

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!isMounted) {
    return (
      <div 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out w-64",
          className
        )}
      >
        {/* Header with Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center min-w-0">
            <TrueSharpShield className="h-8 w-8 text-blue-600 shrink-0" />
            <span className="ml-2 text-xl font-bold text-gray-900 truncate">
              TrueSharp
            </span>
          </Link>
        </div>
        
        {/* Navigation Content */}
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <NavigationItems isCollapsed={false} />
          </nav>
          <div className="p-4 border-t border-gray-200">
            <ProCTA />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center min-w-0">
          <TrueSharpShield className="h-8 w-8 text-blue-600 shrink-0" />
          {!isCollapsed && (
            <span className="ml-2 text-xl font-bold text-gray-900 truncate">
              TrueSharp
            </span>
          )}
        </Link>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-gray-600" />
          ) : (
            <X className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <NavigationItems isCollapsed={isCollapsed} />
        </nav>

        {/* Pro CTA - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <ProCTA />
          </div>
        )}
      </div>
    </div>
  )
}
