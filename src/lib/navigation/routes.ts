export interface NavigationRoute {
  name: string
  href: string
  icon: string
  description?: string
  requiresAuth?: boolean
  requiresPro?: boolean
}

export const navigationRoutes: NavigationRoute[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    description: 'Main user overview',
    requiresAuth: true
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
    description: 'Performance tracking and insights',
    requiresAuth: true
  },
  {
    name: 'Games',
    href: '/games',
    icon: 'Gamepad2',
    description: 'Live odds and betting interface',
    requiresAuth: true
  },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: 'Store',
    description: 'Strategy discovery and subscription',
    requiresAuth: true
  },
  {
    name: 'Monetize',
    href: '/sell',
    icon: 'DollarSign',
    description: 'Seller dashboard and tools',
    requiresAuth: true
  },
  {
    name: 'Subscriptions',
    href: '/subscriptions',
    icon: 'CreditCard',
    description: 'Subscription management',
    requiresAuth: true
  },
  {
    name: 'Feed',
    href: '/feed',
    icon: 'MessageSquare',
    description: 'Social community features',
    requiresAuth: true
  }
]

export function getRouteByPath(path: string): NavigationRoute | undefined {
  return navigationRoutes.find(route => route.href === path)
}

export function isActiveRoute(currentPath: string, routePath: string): boolean {
  if (routePath === '/dashboard') {
    return currentPath === '/dashboard' || currentPath === '/'
  }
  return currentPath.startsWith(routePath)
}
