'use client'

import { OpenBetsDisplay } from '@/components/shared/open-bets-display'
import ShareStrategyModal from '@/components/strategies/ShareStrategyModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { OpenBet } from '@/lib/queries/open-bets'
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Edit3,
  Eye,
  Globe,
  Lock,
  Save,
  Share2,
  Target,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'

export interface StrategyData {
  id: string
  name: string
  description: string
  monetized: boolean
  pricing_weekly: number | null
  pricing_monthly: number | null
  pricing_yearly: number | null
  performance_roi: number | null
  performance_win_rate: number | null
  performance_total_bets: number
  subscriber_count: number
  weekly_subscribers?: number
  monthly_subscribers?: number
  yearly_subscribers?: number
  created_at: string
  updated_at: string
  start_date?: string // Start date for strategy filtering
  open_bets?: OpenBet[] // Open bets for this strategy
  open_bets_count?: number
  total_potential_profit?: number
}

interface ProfessionalStrategyCardProps {
  strategy: StrategyData
  onSave: (strategyId: string, updates: Partial<StrategyData>) => Promise<void>
  onDelete: (strategyId: string) => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  isLoading?: boolean
}

const ProfessionalStrategyCardComponent = ({
  strategy,
  onSave,
  onDelete,
  onSuccess,
  onError,
  isLoading = false,
}: ProfessionalStrategyCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMonetizationModal, setShowMonetizationModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const [editedStrategy, setEditedStrategy] = useState<Partial<StrategyData>>({
    name: strategy.name,
    description: strategy.description,
    monetized: strategy.monetized,
    pricing_weekly: strategy.pricing_weekly,
    pricing_monthly: strategy.pricing_monthly,
    pricing_yearly: strategy.pricing_yearly,
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleEdit = () => {
    // Reset edited strategy to current database values to ensure accurate display
    setEditedStrategy({
      name: strategy.name,
      description: strategy.description,
      monetized: strategy.monetized,
      pricing_weekly: strategy.pricing_weekly,
      pricing_monthly: strategy.pricing_monthly,
      pricing_yearly: strategy.pricing_yearly,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedStrategy({
      name: strategy.name,
      description: strategy.description,
      monetized: strategy.monetized,
      pricing_weekly: strategy.pricing_weekly,
      pricing_monthly: strategy.pricing_monthly,
      pricing_yearly: strategy.pricing_yearly,
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(strategy.id, editedStrategy)
      setIsEditing(false)
      onSuccess?.('Strategy updated successfully')
    } catch (error: any) {
      // Show more helpful error messages
      const errorMessage = error?.message || 'Failed to update strategy'

      if (errorMessage.includes('Stripe Connect account required')) {
        onError?.('Complete your seller setup in Settings to enable monetization')
      } else if (errorMessage.includes('Seller account setup incomplete')) {
        onError?.('Complete your Stripe onboarding process to enable monetization')
      } else {
        onError?.(errorMessage)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onDelete(strategy.id)
      setShowDeleteModal(false)
      onSuccess?.('Strategy deleted successfully')
    } catch (error) {
      onError?.('Failed to delete strategy')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleMonetization = () => {
    const newMonetizedState = !editedStrategy.monetized

    // If turning monetization ON, show warning modal first
    if (newMonetizedState) {
      setShowMonetizationModal(true)
    } else {
      // Turning monetization OFF - no warning needed
      setEditedStrategy(prev => ({
        ...prev,
        monetized: false,
      }))
    }
  }

  const confirmMonetization = () => {
    setEditedStrategy(prev => ({
      ...prev,
      monetized: true,
    }))
    setShowMonetizationModal(false)
  }

  const validatePricing = () => {
    const hasAtLeastOnePrice =
      editedStrategy.pricing_weekly ||
      editedStrategy.pricing_monthly ||
      editedStrategy.pricing_yearly
    return hasAtLeastOnePrice
  }

  const updatePricing = (
    field: 'pricing_weekly' | 'pricing_monthly' | 'pricing_yearly',
    value: string
  ) => {
    const numValue = value === '' ? null : parseFloat(value)
    setEditedStrategy(prev => ({
      ...prev,
      [field]: numValue,
    }))
  }

  return (
    <>
      <Card className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedStrategy.name || ''}
                    onChange={e => setEditedStrategy(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Strategy name"
                    className="text-base font-semibold"
                  />
                  <textarea
                    value={editedStrategy.description || ''}
                    onChange={e =>
                      setEditedStrategy(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Strategy description"
                    className="h-16 w-full resize-none rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{strategy.name}</h3>
                    {strategy.monetized && (
                      <div className="flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        <Globe className="h-3 w-3" />
                        <span>Live</span>
                      </div>
                    )}
                    {strategy.start_date && (
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        📅 {new Date(strategy.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {strategy.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            <div className="ml-4 flex items-center space-x-1">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1"
                  >
                    <Save className="mr-1 h-3 w-3" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="text-xs px-3 py-1">
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setShowShareModal(true)}
                    variant="outline"
                    size="sm"
                    disabled={isLoading || !strategy.monetized}
                    className="border-blue-300 bg-blue-50 hover:bg-blue-100 text-xs px-3 py-2"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleEdit} variant="outline" size="sm" disabled={isLoading} className="text-xs px-3 py-2">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact Performance Stats */}
        <div className="bg-white p-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div
                className={`mb-1 flex items-center justify-center space-x-1 ${
                  (strategy.performance_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {formatPercentage(strategy.performance_roi)}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-500">ROI</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center space-x-1 text-blue-600">
                <Target className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {formatPercentage(strategy.performance_win_rate)}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-500">Win Rate</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center space-x-1 text-purple-600">
                <Activity className="h-4 w-4" />
                <span className="text-lg font-bold">{strategy.performance_total_bets}</span>
              </div>
              <div className="text-xs font-medium text-gray-500">Total Bets</div>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center space-x-1 text-orange-600">
                <Users className="h-4 w-4" />
                <span className="text-lg font-bold">{strategy.subscriber_count}</span>
              </div>
              <div className="text-xs font-medium text-gray-500">Subscribers</div>
            </div>
          </div>
        </div>

        {/* Compact Open Bets Section */}
        {strategy.open_bets && strategy.open_bets.length > 0 && (
          <div className="border-t border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-orange-800">Open Bets ({strategy.open_bets.length})</h4>
              {strategy.total_potential_profit && (
                <span className="text-xs font-medium text-green-700">
                  Potential: {formatCurrency(strategy.total_potential_profit)}
                </span>
              )}
            </div>
            <OpenBetsDisplay bets={strategy.open_bets} title="" compact={true} />
          </div>
        )}

        {/* Compact Monetization & Pricing */}
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Monetization
              </h4>
              {!(isEditing ? editedStrategy.monetized : strategy.monetized) && (
                <div className="flex items-center space-x-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={handleToggleMonetization}
                className="flex items-center space-x-2 text-sm transition-all hover:scale-105"
              >
                {editedStrategy.monetized ? (
                  <>
                    <ToggleRight className="h-8 w-8 text-green-600" />
                    <span className="font-medium text-green-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                    <span className="font-medium text-gray-500">Disabled</span>
                  </>
                )}
              </button>
            )}
            {!isEditing && (
              <div className="flex items-center space-x-2">
                {strategy.monetized ? (
                  <>
                    <ToggleRight className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Disabled</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Monetization Warning */}
          {isEditing && !editedStrategy.monetized && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2">
              <div className="flex items-center space-x-2">
                <Eye className="h-3 w-3 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">Enable monetization</span> to make this strategy public and start earning revenue.
                </p>
              </div>
            </div>
          )}

          {(isEditing ? editedStrategy.monetized : strategy.monetized) && (
            <div>
              {isEditing && !validatePricing() && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <p className="text-xs text-amber-800">
                    <strong>Action Required:</strong> Set at least one pricing option to enable subscriptions.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {/* Weekly Pricing */}
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Weekly</span>
                    {isEditing && editedStrategy.pricing_weekly && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                        ✓
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedStrategy.pricing_weekly || ''}
                      onChange={e => updatePricing('pricing_weekly', e.target.value)}
                      placeholder="0"
                      className="text-sm font-semibold h-8"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(strategy.pricing_weekly)}
                      </div>
                      {strategy.weekly_subscribers !== undefined && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Users className="mr-1 h-2 w-2" />
                          {strategy.weekly_subscribers}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Monthly Pricing */}
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Monthly</span>
                    {isEditing && editedStrategy.pricing_monthly && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                        ✓
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedStrategy.pricing_monthly || ''}
                      onChange={e => updatePricing('pricing_monthly', e.target.value)}
                      placeholder="0"
                      className="text-sm font-semibold h-8"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(strategy.pricing_monthly)}
                      </div>
                      {strategy.monthly_subscribers !== undefined && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Users className="mr-1 h-2 w-2" />
                          {strategy.monthly_subscribers}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Yearly Pricing */}
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Yearly</span>
                    {isEditing && editedStrategy.pricing_yearly && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                        ✓
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedStrategy.pricing_yearly || ''}
                      onChange={e => updatePricing('pricing_yearly', e.target.value)}
                      placeholder="0"
                      className="text-sm font-semibold h-8"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(strategy.pricing_yearly)}
                      </div>
                      {strategy.yearly_subscribers !== undefined && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Users className="mr-1 h-2 w-2" />
                          {strategy.yearly_subscribers}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!(isEditing ? editedStrategy.monetized : strategy.monetized) && (
            <div className="py-6 text-center text-gray-500">
              <DollarSign className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs">
                Enable monetization to set pricing and start earning revenue
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Monetization Warning Modal */}
      <Modal
        isOpen={showMonetizationModal}
        onClose={() => setShowMonetizationModal(false)}
        size="lg"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enable Monetization</h3>
              <p className="text-sm text-gray-600">Make your strategy public and start earning</p>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">
                What becomes public when you enable monetization:
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Strategy name and description</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Performance metrics (ROI, Win Rate, Total Bets)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Subscription pricing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Subscriber count</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-900">What remains private:</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Strategy filters and betting criteria</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Individual bet details (until users subscribe)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Your specific betting methodology</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> After enabling monetization, you&apos;ll need to set at least one
                pricing option (weekly, monthly, or yearly) before users can subscribe to your
                strategy.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button onClick={() => setShowMonetizationModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={confirmMonetization} className="bg-blue-600 hover:bg-blue-700">
              Enable Monetization
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="lg">
        <div className="p-6">
          <div className="mb-4 flex items-center space-x-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Strategy</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this strategy will remove all subscribers and
              cannot be undone. All associated data will be permanently lost.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Strategy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Strategy Modal */}
      <ShareStrategyModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        strategyId={strategy.id}
        openBets={strategy.open_bets || []}
      />
    </>
  )
}

export const ProfessionalStrategyCard = memo(ProfessionalStrategyCardComponent)

export default ProfessionalStrategyCard
