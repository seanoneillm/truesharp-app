'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  BarChart3,
  Store,
  Users,
  Settings,
  DollarSign,
  TrendingUp,
  Crown,
  Zap
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
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

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r border-gray-200", className)}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <TrendingUp className="h-8 w-8 text-blue-600 mr-2" />
          <span className="text-2xl font-bold text-gray-900">TrueSharp</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6 py-6">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const current = isCurrentPath(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                        current
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                      )}
                    >
                      <item.icon 
                        className={cn(
                          'h-6 w-6 shrink-0',
                          current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                        )} 
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>

          {/* Pro Upgrade Section */}
          <li className="mt-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Crown className="h-5 w-5 text-yellow-300 mr-2" />
                <span className="text-sm font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-blue-100 mb-3">
                Unlock advanced analytics and unlimited filtering
              </p>
              <Link
                href="/upgrade"
                className="flex items-center justify-center w-full bg-white text-blue-600 text-sm font-semibold py-2 px-3 rounded-md hover:bg-blue-50 transition-colors"
              >
                <Zap className="h-4 w-4 mr-1" />
                Upgrade Now
              </Link>
            </div>
          </li>

          {/* Quick Stats */}
          <li>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">This Month</span>
                  <span className="font-medium text-green-600">+12.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Win Rate</span>
                  <span className="font-medium">64.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Bets</span>
                  <span className="font-medium">247</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}
