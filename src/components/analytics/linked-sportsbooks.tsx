'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'

interface LinkedSportsbook {
  book_name: string
  book_abbr: string | null
}

interface LinkedSportsbooksProps {
  className?: string
}

export function LinkedSportsbooks({ className }: LinkedSportsbooksProps) {
  const { user } = useAuth()
  const [sportsbooks, setSportsbooks] = useState<LinkedSportsbook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLinkedSportsbooks = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // First, get the user's sharpsports_bettor_id from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('sharpsports_bettor_id')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to fetch profile data')
          setIsLoading(false)
          return
        }

        const bettorId = profileData?.sharpsports_bettor_id
        if (!bettorId) {
          // User hasn't linked SharpSports yet
          setSportsbooks([])
          setIsLoading(false)
          return
        }

        // Now fetch the bettor_accounts for this bettor_id
        const { data: accountsData, error: accountsError } = await supabase
          .from('bettor_accounts')
          .select('book_name, book_abbr')
          .eq('bettor_id', bettorId)

        if (accountsError) {
          console.error('Error fetching bettor accounts:', accountsError)
          setError('Failed to fetch sportsbook data')
          setIsLoading(false)
          return
        }

        setSportsbooks(accountsData || [])
        setIsLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }

    fetchLinkedSportsbooks()
  }, [user?.id])

  if (isLoading) {
    return (
      <Card className={`border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg ${className}`}>
        <CardHeader className="pb-6">
          <CardTitle>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Connected Sportsbooks
                </h3>
                <p className="text-sm text-gray-500">Loading accounts...</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg ${className}`}>
        <CardHeader className="pb-6">
          <CardTitle>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-100 p-2">
                <ExternalLink className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Connected Sportsbooks
                </h3>
                <p className="text-sm text-gray-500">Error loading accounts</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ExternalLink className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Unable to Load Sportsbooks</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sportsbooks.length === 0) {
    return (
      <Card className={`border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg ${className}`}>
        <CardHeader className="pb-6">
          <CardTitle>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Connected Sportsbooks
                </h3>
                <p className="text-sm text-gray-500">No accounts linked yet</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ExternalLink className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No Sportsbooks Connected</p>
            <p className="text-xs text-gray-500">Link your sportsbook accounts to start tracking your betting activity automatically.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg ${className}`}>
      <CardHeader className="pb-6">
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Connected Sportsbooks
                </h3>
                <p className="text-sm text-gray-500">
                  {sportsbooks.length} {sportsbooks.length === 1 ? 'account' : 'accounts'} linked
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white border-gray-200 text-gray-700 px-3 py-1">
              {sportsbooks.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sportsbooks.map((sportsbook, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {sportsbook.book_name}
                </h4>
                <p className="text-xs text-gray-500">Connected & Active</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}