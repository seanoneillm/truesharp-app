// FILE: src/components/layout/auth-guard.tsx
'use client'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean | undefined
  requireSeller?: boolean | undefined
  requireAdmin?: boolean | undefined
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
  const { user, profile, loading: isLoading } = useAuth() // Updated to use correct auth properties
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

      // Check seller permissions using profile data
      if (requireSeller && !profile?.seller_enabled) {
        router.push('/dashboard?error=seller-access-required')
        return
      }

      // Check admin permissions - you may need to add a role field to your profile
      if (requireAdmin && profile?.verification_status !== 'verified') {
        // Adjust this condition based on your admin logic
        router.push('/dashboard?error=admin-access-required')
        return
      }

      // All checks passed
      setIsChecking(false)
    }

    checkAuth()
  }, [
    user,
    profile,
    isLoading,
    pathname,
    router,
    requireAuth,
    requireSeller,
    requireAdmin,
    redirectTo,
  ])

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
        requireSeller={options.requireSeller}
        requireAdmin={options.requireAdmin}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, profile } = useAuth()

  return {
    canSell: profile?.seller_enabled || false,
    isAdmin: profile?.verification_status === 'verified', // Adjust based on your admin logic
    isVerified: profile?.verification_status === 'verified',
    canAccessPro: false, // Add subscription logic here when you implement it
  }
}
