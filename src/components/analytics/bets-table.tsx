// src/components/analytics/bets-table.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface Bet {
  id: string
  sport: string
  league?: string
  bet_type: string
  description: string
  odds: number
  stake: number
  potential_payout?: number
  actual_payout?: number | null
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
  placed_at: string
  settled_at?: string | null
  game_date?: string
  teams?: string[] // Replace with a more specific type if you have a Team interface
  sportsbook?: string
  is_public?: boolean
  created_at: string
}

interface BetsTableProps {
  bets: Bet[]
  isProUser: boolean
  loading?: boolean
}

export function BetsTable({ bets, isProUser, loading }: BetsTableProps) {
  const [showProFeatures, setShowProFeatures] = useState(isProUser)

  // Debug logging
  console.log('BetsTable Props:', {
    betsCount: bets?.length || 0,
    isProUser,
    loading,
    firstBet: bets?.[0],
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bets History
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bets || bets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bets History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No bets found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your sportsbook account to start tracking your bets automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      won: 'bg-green-100 text-green-800 border-green-200',
      lost: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      void: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    return (
      <Badge
        variant="outline"
        className={statusColors[status as keyof typeof statusColors] || statusColors.pending}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const BlurOverlay = ({
    children,
    shouldBlur,
  }: {
    children: React.ReactNode
    shouldBlur: boolean
  }) => {
    if (!shouldBlur) return <>{children}</>

    return (
      <div className="relative">
        <div className="blur-sm filter">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            Pro Only
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Bets History
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {bets.length} bet{bets.length !== 1 ? 's' : ''}
            </span>
            {!isProUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProFeatures(!showProFeatures)}
                className="flex items-center gap-1"
              >
                {showProFeatures ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showProFeatures ? 'Hide' : 'Show'} Pro
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">Date</th>
                <th className="p-2 text-left font-medium">Sport</th>
                <th className="p-2 text-left font-medium">Bet</th>
                <th className="p-2 text-left font-medium">Type</th>
                <th className="p-2 text-left font-medium">Odds</th>
                <th className="p-2 text-left font-medium">Stake</th>
                <th className="p-2 text-left font-medium">Payout</th>
                <th className="p-2 text-left font-medium">Status</th>
                <th className="p-2 text-left font-medium">Book</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet, index) => {
                const shouldBlurRow = !isProUser && !showProFeatures && index >= 10 // Show first 10 for free users

                return (
                  <tr key={bet.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="text-sm">{formatDate(bet.placed_at)}</span>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{bet.sport}</span>
                          {bet.league && (
                            <span className="text-xs text-muted-foreground">{bet.league}</span>
                          )}
                        </div>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="block max-w-xs truncate text-sm">{bet.description}</span>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <Badge variant="outline" className="text-xs">
                          {bet.bet_type}
                        </Badge>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="font-mono text-sm">{formatOdds(bet.odds)}</span>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="text-sm">{formatCurrency(bet.stake)}</span>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="text-sm">
                          {bet.actual_payout
                            ? formatCurrency(bet.actual_payout)
                            : bet.potential_payout
                              ? formatCurrency(bet.potential_payout)
                              : 'N/A'}
                        </span>
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        {getStatusBadge(bet.status)}
                      </BlurOverlay>
                    </td>
                    <td className="p-2">
                      <BlurOverlay shouldBlur={shouldBlurRow}>
                        <span className="text-sm text-muted-foreground">
                          {bet.sportsbook || 'Unknown'}
                        </span>
                      </BlurOverlay>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!isProUser && bets.length > 10 && !showProFeatures && (
            <div className="mt-4 rounded-lg bg-muted/30 p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">Showing 10 of {bets.length} bets</p>
              <Button onClick={() => setShowProFeatures(true)} size="sm">
                Show All Bets (Pro Preview)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
