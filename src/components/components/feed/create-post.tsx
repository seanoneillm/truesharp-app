// src/components/feed/create-post.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ImageIcon, MessageSquare, Star, TrendingUp, Trophy, X } from 'lucide-react'
import { useState } from 'react'

interface CreatePostProps {
  onClose: () => void
}

export function CreatePost({ onClose }: CreatePostProps) {
  const [postType, setPostType] = useState<'text' | 'pick' | 'celebration'>('text')
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Pick-specific state
  const [pickData, setPickData] = useState({
    sport: 'NFL',
    title: '',
    confidence: 3,
    odds: '',
    tier: 'free' as const
  })

  const postTypes = [
    { id: 'text', label: 'General Post', icon: MessageSquare, description: 'Share thoughts or analysis' },
    { id: 'pick', label: 'Share Pick', icon: TrendingUp, description: 'Post a betting pick' },
    { id: 'celebration', label: 'Celebrate Win', icon: Trophy, description: 'Share a big win' }
  ]

  const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis']
  const tiers = [
    { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800' },
    { value: 'bronze', label: 'Bronze', color: 'bg-amber-100 text-amber-800' },
    { value: 'silver', label: 'Silver', color: 'bg-gray-100 text-gray-600' },
    { value: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800' }
  ]

  const handlePost = async () => {
    if (!content.trim()) return

    setIsPosting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real app, would create post via API
    console.log('Creating post:', {
      type: postType,
      content,
      ...(postType === 'pick' && { pick: pickData })
    })
    
    setIsPosting(false)
    onClose()
  }

  const isValid = content.trim().length > 0 && 
    (postType !== 'pick' || (pickData.title && pickData.odds))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Post Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    postType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <type.icon className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pick Details (only for pick posts) */}
          {postType === 'pick' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Pick Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport
                  </label>
                  <select
                    value={pickData.sport}
                    onChange={(e) => setPickData({...pickData, sport: e.target.value})}
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    {sports.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier
                  </label>
                  <select
                    value={pickData.tier}
                    onChange={(e) => setPickData({...pickData, tier: e.target.value as any})}
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    {tiers.map(tier => (
                      <option key={tier.value} value={tier.value}>{tier.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pick Title
                  </label>
                  <input
                    type="text"
                    value={pickData.title}
                    onChange={(e) => setPickData({...pickData, title: e.target.value})}
                    placeholder="e.g., Lakers -4.5 vs Warriors"
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Odds
                  </label>
                  <input
                    type="text"
                    value={pickData.odds}
                    onChange={(e) => setPickData({...pickData, odds: e.target.value})}
                    placeholder="e.g., -110, +150"
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Level
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPickData({...pickData, confidence: level})}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          level <= pickData.confidence 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {pickData.confidence}/5
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {postType === 'pick' ? 'Analysis & Reasoning' : 'What\'s on your mind?'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={
                postType === 'pick' 
                  ? "Share your analysis and reasoning for this pick..."
                  : postType === 'celebration'
                  ? "Tell everyone about your big win! 🎉"
                  : "Share your thoughts, insights, or analysis..."
              }
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Add Image
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Preview */}
          {content && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    SB
                  </div>
                  <span className="font-medium text-gray-900">@sportsbettor</span>
                  <span className="text-sm text-gray-500">now</span>
                </div>
                {postType === 'pick' && pickData.title && (
                  <div className="mb-2">
                    <Badge variant="outline" className="mr-2">{pickData.sport}</Badge>
                    <Badge className={tiers.find(t => t.value === pickData.tier)?.color}>
                      {pickData.tier}
                    </Badge>
                  </div>
                )}
                <p className="text-gray-900 whitespace-pre-wrap">{content}</p>
                {postType === 'pick' && pickData.title && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-900">{pickData.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>Confidence: {pickData.confidence}/5</span>
                      {pickData.odds && <span>Odds: {pickData.odds}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePost}
              disabled={!isValid || isPosting}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
