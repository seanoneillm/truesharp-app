'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Target, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { ProfessionalStrategyCard, type StrategyData } from './professional-strategy-card'
import { 
  fetchUserStrategies, 
  updateStrategy, 
  deleteStrategy, 
  createStrategy,
  type StrategyUpdateData 
} from '@/lib/api/strategies'
import { createClient } from '@/lib/supabase'
import { getSellerStrategiesWithOpenBets } from '@/lib/queries/open-bets'

export function StrategiesTab() {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const [strategies, setStrategies] = useState<StrategyData[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadStrategies = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for loading strategies')
      return
    }

    try {
      setLoading(true)
      console.log('Loading strategies for user:', user.id)
      
      // Fetch regular strategies first to ensure we always show all strategies
      const regularStrategies = await fetchUserStrategies(user.id)
      console.log('Regular strategies loaded:', regularStrategies)
      
      // Try to enhance with open bets data
      try {
        const strategiesWithBets = await getSellerStrategiesWithOpenBets(user.id)
        
        // Merge the data - use regular strategies as base, enhance with open bets where available
        const enhancedStrategies = regularStrategies.map(strategy => {
          const strategyWithBets = strategiesWithBets.find(s => s.id === strategy.id)
          if (strategyWithBets) {
            return {
              ...strategy,
              open_bets: strategyWithBets.open_bets,
              open_bets_count: strategyWithBets.open_bets_count,
              total_potential_profit: strategyWithBets.total_potential_profit
            }
          }
          return strategy
        })
        
        setStrategies(enhancedStrategies)
      } catch (openBetsError) {
        console.warn('Failed to fetch open bets, using regular strategies:', openBetsError)
        setStrategies(regularStrategies)
      }
    } catch (error) {
      console.error('Error loading strategies:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load strategies',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadStrategies()
    }
  }, [authLoading, user?.id, loadStrategies])

  const handleSaveStrategy = useCallback(async (strategyId: string, updates: Partial<StrategyData>) => {
    try {
      setActionLoading(true)
      
      console.log('Saving strategy:', strategyId, 'with updates:', updates)
      
      const updateData: StrategyUpdateData = {
        name: updates.name,
        description: updates.description,
        monetized: updates.monetized,
        pricing_weekly: updates.pricing_weekly,
        pricing_monthly: updates.pricing_monthly,
        pricing_yearly: updates.pricing_yearly
      }
      
      // Add connectivity check
      const supabase = createClient()
      const { data: connTest, error: connError } = await supabase.auth.getUser()
      console.log('Connection test before save:', { connTest, connError })
      
      await updateStrategy(strategyId, updateData)
      
      // Update local state
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, ...updates, updated_at: new Date().toISOString() }
            : strategy
        )
      )
      
      console.log('Strategy saved successfully')
    } catch (error) {
      console.error('Error in handleSaveStrategy:', error)
      throw error // Let the component handle the error
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handleDeleteStrategy = useCallback(async (strategyId: string) => {
    try {
      setActionLoading(true)
      await deleteStrategy(strategyId)
      
      // Remove from local state
      setStrategies(prev => prev.filter(strategy => strategy.id !== strategyId))
    } catch (error) {
      throw error // Let the component handle the error
    } finally {
      setActionLoading(false)
    }
  }, [])


  const handleCreateStrategy = async () => {
    if (!user) return

    try {
      setActionLoading(true)
      
      const newStrategyData = {
        name: 'New Strategy',
        description: 'Description for your new strategy',
        monetized: false,
        pricing_weekly: null,
        pricing_monthly: null,
        pricing_yearly: null,
        filter_config: {}
      }
      
      const newStrategy = await createStrategy(user.id, newStrategyData)
      
      // Add to local state
      setStrategies(prev => [newStrategy, ...prev])
      
      addToast({
        title: 'Success',
        description: 'Strategy created successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error creating strategy:', error)
      addToast({
        title: 'Error',
        description: 'Failed to create strategy',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuccess = useCallback((message: string) => {
    addToast({
      title: 'Success',
      description: message,
      variant: 'success'
    })
  }, [addToast])

  const handleError = useCallback((message: string) => {
    addToast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    })
  }, [addToast])

  const memoizedHandlers = useMemo(() => ({
    onSave: handleSaveStrategy,
    onDelete: handleDeleteStrategy,
    onSuccess: handleSuccess,
    onError: handleError
  }), [handleSaveStrategy, handleDeleteStrategy, handleSuccess, handleError])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading strategies...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="p-12 text-center">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication required</h3>
        <p className="text-gray-600 mb-4">Please log in to manage your strategies</p>
      </Card>
    )
  }

  if (strategies.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies yet</h3>
        <p className="text-gray-600 mb-4">Create your first strategy to start monetizing your picks</p>
        <Button 
          onClick={handleCreateStrategy}
          disabled={actionLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Strategy
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Strategies</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your betting strategies and monetization settings
          </p>
        </div>
        <Button 
          onClick={handleCreateStrategy}
          disabled={actionLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Strategy
        </Button>
      </div>

      {/* Strategy Cards */}
      <div className="space-y-6">
        {strategies.map((strategy) => (
          <ProfessionalStrategyCard
            key={strategy.id}
            strategy={strategy}
            onSave={memoizedHandlers.onSave}
            onDelete={memoizedHandlers.onDelete}
            onSuccess={memoizedHandlers.onSuccess}
            onError={memoizedHandlers.onError}
            isLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default StrategiesTab