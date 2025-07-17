'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Route mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  advanced: 'Advanced Analytics',
  marketplace: 'Marketplace',
  subscriptions: 'Subscriptions',
  sell: 'Sell Picks',
  settings: 'Settings',
  profile: 'Profile',
  account: 'Account',
  security: 'Security',
  notifications: 'Notifications',
  privacy: 'Privacy',
  billing: 'Billing',
  sportsbooks: 'Sportsbooks',
  picks: 'Picks',
  create: 'Create',
  schedule: 'Schedule',
  subscribers: 'Subscribers',
  pricing: 'Pricing',
  verification: 'Verification',
  help: 'Help Center',
  faq: 'FAQ',
  contact: 'Contact',
  legal: 'Legal',
  terms: 'Terms of Service',
  cookies: 'Cookie Policy',
  disclaimer: 'Disclaimer',
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with dashboard for app routes
  if (segments.length > 0 && segments[0] !== 'login' && segments[0] !== 'signup') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
    })
  }

  // Build breadcrumbs from path segments
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Skip dashboard since we already added it
    if (segment === 'dashboard') return
    
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1
    
    breadcrumbs.push({
      label,
      href: currentPath,
      current: isLast,
    })
  })

  return breadcrumbs
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from current path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)
  
  // Don't show breadcrumbs on auth pages or home page
  if (
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' ||
    breadcrumbItems.length <= 1
  ) {
    return null
  }

  return (
    <nav 
      className={cn("flex", className)} 
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight 
                className="w-4 h-4 mx-1 text-gray-400" 
                aria-hidden="true" 
              />
            )}
            
            {item.current ? (
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="inline-flex items-center ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors"
              >
                {index === 0 && breadcrumbItems[0]?.label === 'Dashboard' && (
                  <Home className="w-4 h-4 mr-1" />
                )}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Specific breadcrumb configurations for complex pages
export const breadcrumbConfigs = {
  analyticsAdvanced: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Advanced Analytics', href: '/analytics/advanced', current: true },
  ],
  
  sellerDashboard: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Seller Dashboard', href: '/sell', current: true },
  ],
  
  createPick: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sell Picks', href: '/sell' },
    { label: 'Create Pick', href: '/sell/picks/create', current: true },
  ],
  
  userProfile: (username: string) => [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: `@${username}`, href: `/profile/${username}`, current: true },
  ],
  
  subscriptionBilling: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subscriptions', href: '/subscriptions' },
    { label: 'Billing', href: '/subscriptions/billing', current: true },
  ],
}