// Layout components index file
// src/components/layout/index.ts

export { default as Header } from './header'
export { default as Sidebar } from './sidebar'
export { default as Footer } from './footer'
export { default as MobileNav, MobileHeader } from './mobile-nav'
export { default as Breadcrumbs, breadcrumbConfigs } from './breadcrumbs'
export { default as AppShell } from './app-shell'
export { 
  default as AuthGuard, 
  SellerGuard, 
  AdminGuard, 
  RouteGuard, 
  withAuth,
  usePermissions 
} from './auth-guard'

// Layout component types
export interface LayoutProps {
  children: React.ReactNode
  className?: string
}

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
}

export interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

// Layout utility functions
export const layoutUtils = {
  // Check if current path matches navigation item
  isActivePath: (href: string, currentPath: string): boolean => {
    if (href === '/dashboard') {
      return currentPath === href
    }
    return currentPath.startsWith(href)
  },

  // Generate page title from pathname
  getPageTitle: (pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean)
    const routeLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      marketplace: 'Marketplace',
      subscriptions: 'Subscriptions',
      sell: 'Sell Picks',
      settings: 'Settings',
    }
    
    if (segments.length === 0) return 'TrueSharp'
    const firstSegment = segments[0]
    const title = firstSegment && routeLabels[firstSegment] ? routeLabels[firstSegment] : firstSegment || 'TrueSharp'
    return `${title} | TrueSharp`
  },

  // Check if page should show app shell
  shouldShowAppShell: (pathname: string): boolean => {
    const appPages = ['/dashboard', '/analytics', '/marketplace', '/subscriptions', '/sell', '/settings', '/profile']
    return appPages.some(page => pathname.startsWith(page))
  },

  // Check if page should show marketing header
  shouldShowMarketingHeader: (pathname: string): boolean => {
    const marketingPages = ['/', '/about', '/help', '/faq', '/legal', '/contact']
    return marketingPages.some(page => pathname === page || pathname.startsWith(page))
  }
}
