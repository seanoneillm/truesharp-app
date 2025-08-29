'use client'

import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalContent, 
  ModalFooter 
} from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
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
  isLoading = false
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
        }
      })
      
      // If main endpoint fails with auth, try the simplified endpoint
      if (!response.ok && response.status === 401) {
        console.log('Main strategies endpoint failed, trying simplified endpoint...')
        response = await fetch('/api/strategies-simple', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
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
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
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
        return <Badge variant="default" className="text-xs">Verified</Badge>
      case 'premium':
        return <Badge variant="default" className="text-xs bg-purple-600">Premium</Badge>
      default:
        return null
    }
  }

  const formatStartDate = (dateString?: string) => {
    if (!dateString) return 'No start date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Select Strategies</ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        {isFetching ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="mr-2" />
            Loading strategies...
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchStrategies} variant="outline" size="sm">
                Retry
              </Button>
              {error.includes('logged in') && (
                <Button onClick={() => window.location.href = '/login'} size="sm">
                  Login
                </Button>
              )}
            </div>
          </div>
        ) : strategies.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground mb-4">
              No strategies found. Create a strategy first to add bets to it.
            </p>
            <Button 
              onClick={() => window.location.href = '/sell?tab=strategies'} 
              variant="outline" 
              size="sm"
            >
              Create Your First Strategy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Strategies ({strategies.length})
                </span>
                {selectedStrategyIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
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
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  disabled={selectedStrategyIds.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {strategies.map((strategy) => {
                const isSelected = selectedStrategyIds.includes(strategy.id)
                
                return (
                  <Card
                    key={strategy.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => toggleStrategySelection(strategy.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {strategy.name}
                              </h4>
                              {strategy.is_monetized && (
                                <Badge variant="outline" className="text-xs">
                                  Monetized
                                </Badge>
                              )}
                              {getVerificationBadge(strategy.verification_status)}
                            </div>
                            
                            {strategy.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
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
                              {strategy.bet_type && (
                                <span>• {strategy.bet_type}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatStartDate(strategy.start_date)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right text-xs space-y-1">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span className={cn(
                                "font-medium",
                                strategy.roi_percentage >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatROI(strategy.roi_percentage)}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {formatPercentage(strategy.win_rate)} WR
                            </div>
                            <div className="text-muted-foreground">
                              {strategy.total_bets} bets
                            </div>
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
      
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={selectedStrategyIds.length === 0 || isLoading || isFetching}
          isLoading={isLoading}
        >
          Add to {selectedStrategyIds.length} Strateg{selectedStrategyIds.length === 1 ? 'y' : 'ies'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}