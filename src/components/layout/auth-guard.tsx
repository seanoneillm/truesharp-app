// FILE: src/components/layout/auth-guard.tsx
'use client'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireSeller?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireSeller = false,
  requireAdmin = false,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: isLoading } = useAuth() // Remove profile since it doesn't exist
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return

    const checkAuth = () => {
      // Public routes that don't require authentication
      const publicRoutes = [
        '/',
        '/login',
        '/signup',
        '/help',
        '/faq',
        '/legal',
        '/about',
        '/contact',
      ]
      const isPublicRoute = publicRoutes.some(
        route => pathname === route || pathname.startsWith('/legal/')
      )

      // If route doesn't require auth, allow access
      if (!requireAuth || isPublicRoute) {
        setIsChecking(false)
        return
      }

      // Check if user is authenticated
      if (!user) {
        const redirect = redirectTo || `/login?redirect=${encodeURIComponent(pathname)}`
        router.push(redirect)
        return
      }

      // Check seller permissions - mock implementation since profile is not available
      if (requireSeller) {
        // Mock seller check - always allow for now
        // if (!profile?.seller_enabled) {
        //   router.push('/dashboard?error=seller-access-required')
        //   return
        // }
      }

      // Check admin permissions - mock implementation since profile is not available
      if (requireAdmin) {
        // Mock admin check - always allow for now
        // if (profile?.verification_status !== 'verified') {
        //   router.push('/dashboard?error=admin-access-required')
        //   return
        // }
      }

      // All checks passed
      setIsChecking(false)
    }

    checkAuth()
  }, [user, isLoading, pathname, router, requireAuth, requireSeller, requireAdmin, redirectTo])

  // Show loading spinner while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 h-8 w-8 text-blue-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Specific auth guard components for different access levels
export function SellerGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireSeller>{children}</AuthGuard>
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireAdmin>{children}</AuthGuard>
}

// Route-based auth guard that can be used in layouts
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Define route-specific requirements
  const getRouteRequirements = (path: string) => {
    if (path.startsWith('/admin')) {
      return { requireAuth: true, requireAdmin: true }
    }

    if (path.startsWith('/sell')) {
      return { requireAuth: true, requireSeller: true }
    }

    if (
      path.startsWith('/dashboard') ||
      path.startsWith('/analytics') ||
      path.startsWith('/subscriptions') ||
      path.startsWith('/settings')
    ) {
      return { requireAuth: true }
    }

    return { requireAuth: false }
  }

  const requirements = getRouteRequirements(pathname)

  return <AuthGuard {...requirements}>{children}</AuthGuard>
}

// HOC for protecting page components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireSeller?: boolean
    requireAdmin?: boolean
    redirectTo?: string
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard
        requireSeller={options.requireSeller ?? false}
        requireAdmin={options.requireAdmin ?? false}
        redirectTo={options.redirectTo ?? '/login'}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  // Mock implementation since profile is not available
  return {
    canSell: false, // Mock since profile is not available
    isAdmin: false, // Mock since profile is not available
    isVerified: false, // Mock since profile is not available
    canAccessPro: false, // Add subscription logic here when you implement it
  }
}
