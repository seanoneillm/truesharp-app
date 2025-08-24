// src/components/dashboard/DashboardLayout.tsx
'use client'
import Sidebar from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import {
    Menu,
    X
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Menu Overlay - only render when mounted to prevent hydration mismatch */}
      {isMounted && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/80" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
              <Link href="/" className="text-xl font-bold text-blue-600">
                TrueSharp
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-4 py-4">
              {/* Mobile navigation would go here */}
              <p className="text-sm text-gray-500">Mobile navigation</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content - offset by sidebar width */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <TopBar 
          mobileMenuButton={
            isMounted ? (
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            ) : (
              <div className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
                <Menu className="h-6 w-6" />
              </div>
            )
          }
        />
        
        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
