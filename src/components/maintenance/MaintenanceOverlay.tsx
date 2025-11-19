'use client'

import { Smartphone, CheckCircle, BarChart3, Users, Shield } from 'lucide-react'

interface MaintenanceOverlayProps {
  pageName?: string
}

export default function MaintenanceOverlay({ pageName }: MaintenanceOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-2xl lg:p-8">
          {/* TrueSharp Logo */}
          <div className="mx-auto mb-6 flex justify-center">
            <img 
              src="/images/truesharp-logo.png" 
              alt="TrueSharp Logo" 
              className="h-16 w-16 rounded-xl shadow-lg" 
            />
          </div>

          {/* Main Message */}
          <div className="mb-6">
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              We're Upgrading TrueSharp
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Get full access to all features on our mobile app while we improve the web experience.
            </p>
          </div>

          {/* App Download Hero Section */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-inner">
            <div className="mb-4 flex items-center justify-center gap-3">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp App Icon" 
                className="h-12 w-12 rounded-xl shadow-md" 
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">TrueSharp Mobile</h2>
                <p className="text-sm text-gray-600">Complete Sports Betting Platform</p>
              </div>
            </div>

            {/* App Store Button */}
            <a
              href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-2xl bg-black px-6 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-medium opacity-80">Download on the</div>
                <div className="text-base font-semibold">App Store</div>
              </div>
            </a>
          </div>

          {/* Compact Features Grid */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 mx-auto">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Analytics</h3>
              <p className="text-xs text-gray-600">Pro-grade tracking & CLV</p>
            </div>
            
            <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 mx-auto">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Verified Data</h3>
              <p className="text-xs text-gray-600">15+ sportsbook sync</p>
            </div>
            
            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 mx-auto">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Marketplace</h3>
              <p className="text-xs text-gray-600">Proven strategies</p>
            </div>
            
            <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 mx-auto">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Live Sync</h3>
              <p className="text-xs text-gray-600">Real-time tracking</p>
            </div>
          </div>

          {/* Key Benefits - Condensed */}
          <div className="mb-6 rounded-xl bg-gray-50 p-4">
            <div className="grid gap-2 text-left sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">100% verified performance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Auto sportsbook sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Professional analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Free to get started</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Questions? Email{' '}
              <a href="mailto:info@truesharp.io" className="text-blue-600 hover:text-blue-800">
                info@truesharp.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}