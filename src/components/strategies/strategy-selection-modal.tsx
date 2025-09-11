'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, TrendingUp, Target, Calendar } from 'lucide-react'

interface Strategy {
  id: string
  name: string
  description: string
  primary_sport?: string
  bet_type?: string
  total_bets: number
  win_rate: number
  roi_percentage: number
  is_monetized: boolean
  verification_status: string
  start_date?: string
}

interface StrategySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (strategyIds: string[]) => void
  isLoading?: boolean
}

export const StrategySelectionModal: React.FC<StrategySelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchStrategies()
      setSelectedStrategyIds([])
    }
  }, [isOpen])

  const fetchStrategies = async () => {
    try {
      setIsFetching(true)
      setError(null)

      // Try the main endpoint first
      let response = await fetch('/api/strategies', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // If main endpoint fails with auth, try the simplified endpoint
      if (!response.ok && response.status === 401) {
        console.log('Main strategies endpoint failed, trying simplified endpoint...')
        response = await fetch('/api/strategies-simple', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You need to be logged in to view your strategies')
        }
        throw new Error(data.error || 'Failed to fetch strategies')
      }

      setStrategies(data.strategies || [])
    } catch (error) {
      console.error('Error fetching strategies:', error)
      setError(error instanceof Error ? error.message : 'Failed to load strategies')
    } finally {
      setIsFetching(false)
    }
  }

  const toggleStrategySelection = (strategyId: string) => {
    setSelectedStrategyIds(prev =>
      prev.includes(strategyId) ? prev.filter(id => id !== strategyId) : [...prev, strategyId]
    )
  }

  const selectAll = () => {
    setSelectedStrategyIds(strategies.map(strategy => strategy.id))
  }

  const clearAll = () => {
    setSelectedStrategyIds([])
  }

  const handleConfirm = () => {
    if (selectedStrategyIds.length > 0) {
      onConfirm(selectedStrategyIds)
    }
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatROI = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
            Verified
          </Badge>
        )
      case 'premium':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
            Premium
          </Badge>
        )
      default:
        return null
    }
  }

  const formatStartDate = (dateString?: string) => {
    if (!dateString) return 'No start date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-2">
            <TrueSharpShield className="h-6 w-6" variant="default" />
          </div>
          <div>
            <ModalTitle className="text-xl font-bold text-gray-900">Add Bets to Strategies</ModalTitle>
            <p className="text-sm text-gray-600">Select which strategies should receive these bets</p>
          </div>
        </div>
      </ModalHeader>

      <ModalContent>
        {isFetching ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="rounded-full bg-blue-50 p-3 mb-4">
              <TrueSharpShield className="h-8 w-8 animate-pulse" variant="light" />
            </div>
            <Spinner className="mr-2" />
            <span className="text-gray-600">Loading your strategies...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="rounded-full bg-red-50 p-3 mb-4 mx-auto w-fit">
              <TrueSharpShield className="h-8 w-8" variant="light" />
            </div>
            <p className="mb-6 text-red-600 font-medium">{error}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={fetchStrategies} variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Retry
              </Button>
              {error.includes('logged in') && (
                <Button onClick={() => (window.location.href = '/login')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Login
                </Button>
              )}
            </div>
          </div>
        ) : strategies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="rounded-full bg-gray-50 p-3 mb-4 mx-auto w-fit">
              <TrueSharpShield className="h-8 w-8" variant="light" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Strategies Yet</h3>
            <p className="mb-6 text-gray-600">
              Create your first strategy to start organizing your bets.
            </p>
            <Button
              onClick={() => (window.location.href = '/sell?tab=strategies')}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Create Your First Strategy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <TrueSharpShield className="h-5 w-5" variant="light" />
                <span className="text-sm font-semibold text-gray-900">Your Strategies ({strategies.length})</span>
                {selectedStrategyIds.length > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                    {selectedStrategyIds.length} selected
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedStrategyIds.length === strategies.length}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={selectedStrategyIds.length === 0}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
              {strategies.map(strategy => {
                const isSelected = selectedStrategyIds.includes(strategy.id)

                return (
                  <Card
                    key={strategy.id}
                    className={cn(
                      'cursor-pointer p-4 transition-all hover:shadow-md border-2',
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                    onClick={() => toggleStrategySelection(strategy.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isSelected ? (
                          <div className="rounded-full bg-blue-600 p-1">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="rounded-full border-2 border-gray-300 p-2">
                            <Circle className="h-3 w-3 text-transparent" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <h4 className="line-clamp-1 text-sm font-medium">{strategy.name}</h4>
                              {strategy.is_monetized && (
                                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                  Monetized
                                </Badge>
                              )}
                              {getVerificationBadge(strategy.verification_status)}
                            </div>

                            {strategy.description && (
                              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                                {strategy.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {strategy.primary_sport && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {strategy.primary_sport}
                                </div>
                              )}
                              {strategy.bet_type && <span>• {strategy.bet_type}</span>}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatStartDate(strategy.start_date)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-right text-xs">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span
                                className={cn(
                                  'font-medium',
                                  strategy.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {formatROI(strategy.roi_percentage)}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {formatPercentage(strategy.win_rate)} WR
                            </div>
                            <div className="text-muted-foreground">{strategy.total_bets} bets</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </ModalContent>

      <ModalFooter className="bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrueSharpShield className="h-4 w-4" variant="light" />
            <span>
              {selectedStrategyIds.length === 0 
                ? 'Select strategies to continue'
                : `${selectedStrategyIds.length} strateg${selectedStrategyIds.length === 1 ? 'y' : 'ies'} selected`
              }
            </span>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="border-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedStrategyIds.length === 0 || isLoading || isFetching}
              isLoading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add to Strateg{selectedStrategyIds.length === 1 ? 'y' : 'ies'}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}
