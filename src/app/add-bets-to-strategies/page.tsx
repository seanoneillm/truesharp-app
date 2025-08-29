'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertModal } from '@/components/ui/modal'
import { PendingBetsSelector } from '@/components/bets/pending-bets-selector'
import { StrategySelectionModal } from '@/components/strategies/strategy-selection-modal'
import { Plus, ArrowRight, CheckCircle } from 'lucide-react'

interface ValidationResult {
  betId: string
  strategyId: string
  valid: boolean
  reason: string
}

export default function AddBetsToStrategiesPage() {
  const [selectedBetIds, setSelectedBetIds] = useState<string[]>([])
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const [resultType, setResultType] = useState<'success' | 'warning' | 'destructive'>('success')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])

  const handleAddToStrategies = () => {
    if (selectedBetIds.length === 0) {
      setResultMessage('Please select at least one pending bet.')
      setResultType('warning')
      setShowResultModal(true)
      return
    }
    
    setIsStrategyModalOpen(true)
  }

  const handleStrategySelection = async (strategyIds: string[]) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/add-bets-to-strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betIds: selectedBetIds,
          strategyIds: strategyIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bets to strategies')
      }

      setValidationResults(data.validationResults || [])
      
      if (data.inserted > 0) {
        setResultMessage(data.message || `Successfully added ${data.inserted} bet${data.inserted !== 1 ? 's' : ''} to strategies`)
        setResultType('success')
        
        // Clear selected bets on success
        setSelectedBetIds([])
      } else {
        setResultMessage('No bets were added. All selected bets either already exist in the selected strategies or do not match the strategy filters.')
        setResultType('warning')
      }

      setShowResultModal(true)
      setIsStrategyModalOpen(false)

    } catch (error) {
      console.error('Error adding bets to strategies:', error)
      setResultMessage(error instanceof Error ? error.message : 'Failed to add bets to strategies')
      setResultType('destructive')
      setShowResultModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const getValidationSummary = () => {
    if (validationResults.length === 0) return null

    const validCount = validationResults.filter(r => r.valid).length
    const duplicateCount = validationResults.filter(r => r.reason === 'Bet already exists in strategy').length
    const filterMismatchCount = validationResults.filter(r => r.reason === 'Bet does not match strategy filters').length

    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Validation Summary:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {validCount} bet-strategy combinations added successfully
          </li>
          {duplicateCount > 0 && (
            <li className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
              {duplicateCount} combinations were duplicates (already existed)
            </li>
          )}
          {filterMismatchCount > 0 && (
            <li className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500" />
              {filterMismatchCount} combinations skipped (didn't match strategy filters)
            </li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Add Bets to Strategies</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your pending bets and add them to one or more of your strategies. 
            Bets will be automatically validated against each strategy's filters before being added.
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold">1</span>
              </div>
              Select Pending Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Choose from your pending bets for games that haven't started yet. 
              You can select multiple bets at once.
            </p>
            
            <PendingBetsSelector
              selectedBetIds={selectedBetIds}
              onBetsSelected={setSelectedBetIds}
            />
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleAddToStrategies}
            disabled={selectedBetIds.length === 0}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Add to Strategies
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Process Flow */}
        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium">Select Bets</h3>
                <p className="text-xs text-muted-foreground">
                  Choose pending bets for upcoming games
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-medium">Choose Strategies</h3>
                <p className="text-xs text-muted-foreground">
                  Select which strategies to add the bets to
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-medium">Auto-Validate</h3>
                <p className="text-xs text-muted-foreground">
                  Bets are validated against strategy filters
                </p>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Validation Process:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Checks if bet matches strategy's sport/league filters</li>
                <li>• Validates bet type against strategy requirements</li>
                <li>• Verifies odds, stakes, and other filter criteria</li>
                <li>• Prevents duplicate entries (same bet in same strategy)</li>
                <li>• Updates strategy leaderboard statistics</li>
                <li>• Notifies strategy subscribers of new bets</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Selection Modal */}
        <StrategySelectionModal
          isOpen={isStrategyModalOpen}
          onClose={() => setIsStrategyModalOpen(false)}
          onConfirm={handleStrategySelection}
          isLoading={isLoading}
        />

        {/* Result Modal */}
        <AlertModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false)
            setValidationResults([])
          }}
          title={
            resultType === 'success' 
              ? 'Success!' 
              : resultType === 'warning' 
                ? 'Warning' 
                : 'Error'
          }
          description={
            <div>
              <p>{resultMessage}</p>
              {getValidationSummary()}
            </div>
          }
          variant={resultType}
        />
      </div>
    </div>
  )
}