// src/components/feed/create-post.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { ImageIcon, MessageSquare, Star, TrendingUp, Trophy, X } from 'lucide-react'
import { useState } from 'react'

interface CreatePostProps {
  onClose: () => void
}

export default function CreatePost({ onClose }: CreatePostProps) {
  const [postType, setPostType] = useState<'text' | 'pick'>('text')
  const [content, setContent] = useState('')
  const { username, displayName, loading } = useUserProfile()
  const [isPosting, setIsPosting] = useState(false)

  // Pick-specific state
  const [pickData, setPickData] = useState({
    sport: 'NFL',
    title: '',
    confidence: 3,
    odds: '',
    tier: 'free' as const,
  })

  const postTypes = [
    {
      id: 'text',
      label: 'General Post',
      icon: MessageSquare,
      description: 'Share thoughts or analysis',
    },
    { id: 'pick', label: 'Share Pick', icon: TrendingUp, description: 'Post a betting pick' },
    { id: 'celebration', label: 'Celebrate Win', icon: Trophy, description: 'Share a big win' },
  ]

  const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis']
  const tiers = [
    { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800' },
    { value: 'bronze', label: 'Bronze', color: 'bg-amber-100 text-amber-800' },
    { value: 'silver', label: 'Silver', color: 'bg-gray-100 text-gray-600' },
    { value: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800' },
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
      ...(postType === 'pick' && { pick: pickData }),
    })

    setIsPosting(false)
    onClose()
  }

  const isValid =
    content.trim().length > 0 && (postType !== 'pick' || (pickData.title && pickData.odds))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Post Type Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700">Post Type</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {postTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id as any)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    postType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-2 flex items-center">
                    <type.icon className="mr-2 h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pick Details (only for pick posts) */}
          {postType === 'pick' && (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-4 font-medium text-gray-900">Pick Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Sport</label>
                  <select
                    value={pickData.sport}
                    onChange={e => setPickData({ ...pickData, sport: e.target.value })}
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    {sports.map(sport => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Tier</label>
                  <select
                    value={pickData.tier}
                    onChange={e => setPickData({ ...pickData, tier: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    {tiers.map(tier => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Pick Title</label>
                  <input
                    type="text"
                    value={pickData.title}
                    onChange={e => setPickData({ ...pickData, title: e.target.value })}
                    placeholder="e.g., Lakers -4.5 vs Warriors"
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Odds</label>
                  <input
                    type="text"
                    value={pickData.odds}
                    onChange={e => setPickData({ ...pickData, odds: e.target.value })}
                    placeholder="e.g., -110, +150"
                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Confidence Level
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setPickData({ ...pickData, confidence: level })}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          level <= pickData.confidence
                            ? 'fill-current text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{pickData.confidence}/5</span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {postType === 'pick' ? 'Analysis & Reasoning' : "What's on your mind?"}
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={
                postType === 'pick'
                  ? 'Share your analysis and reasoning for this pick...'
                  : postType === 'celebration'
                    ? 'Tell everyone about your big win! 🎉'
                    : 'Share your thoughts, insights, or analysis...'
              }
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="mr-1 h-4 w-4" />
                  Add Image
                </Button>
              </div>
              <span className="text-sm text-gray-500">{content.length}/500</span>
            </div>
          </div>

          {/* Preview */}
          {content && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Preview</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                    SB
                  </div>
                  <span className="font-medium text-gray-900">
                    {loading ? 'Loading...' : displayName || username}
                  </span>
                  <span className="text-sm text-gray-500">now</span>
                </div>
                {postType === 'pick' && pickData.title && (
                  <div className="mb-2">
                    <Badge variant="outline" className="mr-2">
                      {pickData.sport}
                    </Badge>
                    <Badge className={tiers.find(t => t.value === pickData.tier)?.color}>
                      {pickData.tier}
                    </Badge>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-gray-900">{content}</p>
                {postType === 'pick' && pickData.title && (
                  <div className="mt-3 rounded border bg-white p-3">
                    <h4 className="font-medium text-gray-900">{pickData.title}</h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
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
            <Button onClick={handlePost} disabled={!isValid || isPosting}>
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
