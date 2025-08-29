'use client'

import { useState, memo } from 'react'
import { 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Eye,
  Globe,
  Lock,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { OpenBetsDisplay } from '@/components/shared/open-bets-display'
import { OpenBet } from '@/lib/queries/open-bets'
import ShareStrategyModal from '@/components/strategies/ShareStrategyModal'

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
  isLoading = false
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
    pricing_yearly: strategy.pricing_yearly
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleEdit = () => {
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
      pricing_yearly: strategy.pricing_yearly
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(strategy.id, editedStrategy)
      setIsEditing(false)
      onSuccess?.('Strategy updated successfully')
    } catch (error) {
      onError?.('Failed to update strategy')
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
        monetized: false
      }))
    }
  }

  const confirmMonetization = () => {
    setEditedStrategy(prev => ({
      ...prev,
      monetized: true
    }))
    setShowMonetizationModal(false)
  }

  const validatePricing = () => {
    const hasAtLeastOnePrice = editedStrategy.pricing_weekly || 
                              editedStrategy.pricing_monthly || 
                              editedStrategy.pricing_yearly
    return hasAtLeastOnePrice
  }

  const updatePricing = (field: 'pricing_weekly' | 'pricing_monthly' | 'pricing_yearly', value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setEditedStrategy(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedStrategy.name || ''}
                    onChange={(e) => setEditedStrategy(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Strategy name"
                    className="text-lg font-semibold"
                  />
                  <textarea
                    value={editedStrategy.description || ''}
                    onChange={(e) => setEditedStrategy(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Strategy description"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {strategy.name}
                    </h3>
                    {strategy.start_date && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full">
                        📅 Since {new Date(strategy.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {strategy.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
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
                    className="bg-blue-50 border-blue-300 hover:bg-blue-100"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Performance Stats - Read Only */}
        <div className="p-6 bg-white">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Performance Metrics
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`flex items-center justify-center space-x-1 mb-2 ${
                (strategy.performance_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {formatPercentage(strategy.performance_roi)}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">ROI</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2 text-blue-600">
                <Target className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {formatPercentage(strategy.performance_win_rate)}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">Win Rate</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2 text-purple-600">
                <Activity className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {strategy.performance_total_bets}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">Total Bets</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2 text-orange-600">
                <Users className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {strategy.subscriber_count}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">Subscribers</div>
            </div>
          </div>
        </div>

        {/* Open Bets Section */}
        {strategy.open_bets && strategy.open_bets.length > 0 && (
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-t border-gray-100">
            <OpenBetsDisplay 
              bets={strategy.open_bets} 
              title="Current Open Bets"
              maxBets={3}
              compact={false}
            />
          </div>
        )}

        {/* Monetization & Pricing */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Monetization
              </h4>
              {(isEditing ? editedStrategy.monetized : strategy.monetized) && (
                <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </div>
              )}
              {!(isEditing ? editedStrategy.monetized : strategy.monetized) && (
                <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={handleToggleMonetization}
                className="flex items-center space-x-2 text-sm"
              >
                {editedStrategy.monetized ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-green-600" />
                    <span className="text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-500 font-medium">Disabled</span>
                  </>
                )}
              </button>
            )}
            {!isEditing && (
              <div className="flex items-center space-x-2">
                {strategy.monetized ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-green-600" />
                    <span className="text-green-600 font-medium text-sm">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-500 font-medium text-sm">Disabled</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Monetization Warning */}
          {isEditing && !editedStrategy.monetized && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Eye className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Enable monetization to make this strategy public</p>
                  <p>When enabled, your strategy performance (ROI, win rate, total bets) will be visible to all users. Strategy filters remain private.</p>
                </div>
              </div>
            </div>
          )}

          {(isEditing ? editedStrategy.monetized : strategy.monetized) && (
            <div>
              {isEditing && !validatePricing() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-800">
                    <strong>Action Required:</strong> Set at least one pricing option (weekly, monthly, or yearly) to make your strategy available for subscription.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Weekly Pricing */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Weekly</span>
                  {isEditing && editedStrategy.pricing_weekly && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Set</span>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedStrategy.pricing_weekly || ''}
                    onChange={(e) => updatePricing('pricing_weekly', e.target.value)}
                    placeholder="0"
                    className="text-lg font-semibold"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(strategy.pricing_weekly)}
                    </div>
                    {strategy.weekly_subscribers !== undefined && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {strategy.weekly_subscribers} subscribers
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Monthly Pricing */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Monthly</span>
                  {isEditing && editedStrategy.pricing_monthly && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Set</span>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedStrategy.pricing_monthly || ''}
                    onChange={(e) => updatePricing('pricing_monthly', e.target.value)}
                    placeholder="0"
                    className="text-lg font-semibold"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(strategy.pricing_monthly)}
                    </div>
                    {strategy.monthly_subscribers !== undefined && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {strategy.monthly_subscribers} subscribers
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Yearly Pricing */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Yearly</span>
                  {isEditing && editedStrategy.pricing_yearly && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Set</span>
                  )}
                </div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedStrategy.pricing_yearly || ''}
                    onChange={(e) => updatePricing('pricing_yearly', e.target.value)}
                    placeholder="0"
                    className="text-lg font-semibold"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(strategy.pricing_yearly)}
                    </div>
                    {strategy.yearly_subscribers !== undefined && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {strategy.yearly_subscribers} subscribers
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {!(isEditing ? editedStrategy.monetized : strategy.monetized) && (
            <div className="text-center text-gray-500 py-8">
              <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">
                Enable monetization to set pricing and start earning revenue
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Monetization Warning Modal */}
      <Modal isOpen={showMonetizationModal} onClose={() => setShowMonetizationModal(false)}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enable Monetization</h3>
              <p className="text-sm text-gray-600">Make your strategy public and start earning</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What becomes public when you enable monetization:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Strategy name and description</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance metrics (ROI, Win Rate, Total Bets)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Subscription pricing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Subscriber count</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">What remains private:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Strategy filters and betting criteria</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Individual bet details (until users subscribe)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Your specific betting methodology</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> After enabling monetization, you'll need to set at least one pricing option (weekly, monthly, or yearly) before users can subscribe to your strategy.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={() => setShowMonetizationModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMonetization}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enable Monetization
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Strategy</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this strategy will remove all subscribers and cannot be undone. 
              All associated data will be permanently lost.
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