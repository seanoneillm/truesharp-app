'use client'

import { isActiveRoute, NavigationRoute, navigationRoutes } from '@/lib/navigation/routes'
import { cn } from '@/lib/utils'
import { BarChart3, CreditCard, DollarSign, Home, MessageSquare, MessageCircle, Store, Trophy } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const iconMap = {
  Home,
  BarChart3,
  Trophy,
  Store,
  DollarSign,
  CreditCard,
  MessageSquare,
  MessageCircle,
}

interface NavigationItemsProps {
  isCollapsed?: boolean
}

export function NavigationItems({ isCollapsed = false }: NavigationItemsProps) {
  const pathname = usePathname()

  return (
    <ul className="space-y-1">
      {navigationRoutes.map((item: NavigationRoute) => {
        const active = isActiveRoute(pathname, item.href)
        const IconComponent = iconMap[item.icon as keyof typeof iconMap]

        return (
          <li key={item.name} className="relative">
            <Link
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                isCollapsed ? 'justify-center' : 'gap-x-3'
              )}
            >
              <IconComponent
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && active && (
                <div className="ml-auto h-2 w-2 rounded-full bg-white/60" />
              )}
            </Link>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:visible">
                {item.name}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
