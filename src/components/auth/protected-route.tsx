'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'requireAuth:', requireAuth)

  useEffect(() => {
    console.log(
      'ProtectedRoute useEffect - loading:',
      loading,
      'requireAuth:',
      requireAuth,
      'user:',
      user
    )
    if (!loading && requireAuth && !user) {
      console.log('Redirecting to login...')
      // Store the current path for redirect after login
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}${currentPath !== '/' ? `?redirectTo=${encodeURIComponent(currentPath)}` : ''}`
      console.log('Redirect URL:', redirectUrl)
      router.push(redirectUrl)
    }
  }, [user, loading, requireAuth, redirectTo, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If we get here, either authentication is not required or user is authenticated
  return <>{children}</>
}
