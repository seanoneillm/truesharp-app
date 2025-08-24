'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Bookmark,
  Camera,
  Flame,
  Globe,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Star,
  Trophy,
  User,
  Users,
  X
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

// Types for feed data
interface UserType {
  id: string
  username: string
  displayName: string
  profilePicture?: string
  verified: boolean
  tier: 'elite' | 'pro' | 'rising' | 'member'
}

interface Post {
  id: string
  user: UserType
  type: 'pick' | 'celebration' | 'analysis' | 'text'
  content: {
    text?: string
    title?: string
    analysis?: string
    sport?: string
    confidence?: number
    odds?: string
    status?: 'pending' | 'won' | 'lost' | 'void'
    result?: string
    streak?: number
    imageUrl?: string
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    saved: boolean
    liked: boolean
  }
  timestamp: string
  createdAt: Date
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'public' | 'subscriptions'>('public')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  
  // Post creation state
  const [postContent, setPostContent] = useState('')
  const [postImage, setPostImage] = useState<File | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const [postVisibility, setPostVisibility] = useState<'public' | 'subscribers'>('public')
  const [isPosting, setIsPosting] = useState(false)

  // Character limit for posts
  const maxCharacters = 500

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      // Check file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        alert('Only JPG, PNG, and GIF files are supported')
        return
      }
      
      setPostImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPostImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return
    
    setIsPosting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newPost: Post = {
      id: Date.now().toString(),
      user: {
        id: 'current-user',
        username: 'sportsbettor',
        displayName: 'Your Name',
        verified: false,
        tier: 'member'
      },
      type: 'text',
      content: {
        text: postContent,
        ...(postImagePreview && { imageUrl: postImagePreview })
      },
      engagement: { likes: 0, comments: 0, shares: 0, saved: false, liked: false },
      timestamp: 'now',
      createdAt: new Date()
    }
    
    setPosts([newPost, ...posts])
    
    // Reset form
    setPostContent('')
    setPostImage(null)
    setPostImagePreview(null)
    setIsPosting(false)
    setShowCreatePost(false)
  }

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              liked: !post.engagement.liked,
              likes: post.engagement.liked 
                ? post.engagement.likes - 1 
                : post.engagement.likes + 1
            }
          }
        : post
    ))
  }

  const handleSave = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              saved: !post.engagement.saved
            }
          }
        : post
    ))
  }

  const filteredPosts = activeTab === 'subscriptions' 
    ? posts.filter(post => post.user.verified) // Show only verified users for subscriptions
    : posts

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Community Feed
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Latest verified picks, wins, and insights from the community
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLoading(true)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'public'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Globe className="h-4 w-4 mr-2" />
              Public Feed
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'subscriptions'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Subscriptions
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                <Card key={post.id} className="p-6 hover:shadow-lg transition-all duration-300">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-white shadow-lg">
                        {post.user.profilePicture ? (
                          <Image
                            src={post.user.profilePicture}
                            alt={post.user.username}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          post.user.username.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">@{post.user.username}</span>
                          {post.user.verified && (
                            <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="h-2 w-2 bg-white rounded-full" />
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.user.tier === 'elite' ? 'bg-purple-100 text-purple-800' :
                            post.user.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                            post.user.tier === 'rising' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {post.user.tier}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{post.user.displayName}</span>
                          <span>•</span>
                          <span>{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Post Content */}
                  {post.type === 'pick' ? (
                    <div className="mb-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          post.content.sport === 'NBA' ? 'bg-orange-100 text-orange-800' :
                          post.content.sport === 'NFL' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {post.content.sport}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (post.content.confidence ?? 0) ? 'text-yellow-400 fill-current' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        {post.content.status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.content.status === 'won' ? 'bg-green-100 text-green-800' :
                            post.content.status === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.content.status}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{post.content.title}</h3>
                      <p className="text-slate-700 mb-3">{post.content.analysis}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>Odds: {post.content.odds}</span>
                        {post.content.result && (
                          <span className={post.content.status === 'won' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {post.content.result}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : post.type === 'celebration' ? (
                    <div className="mb-4">
                      <p className="text-slate-900 text-lg mb-3">{post.content.text}</p>
                      {post.content.streak && (
                        <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl">
                          <Trophy className="h-4 w-4 mr-2" />
                          <span className="font-semibold">{post.content.streak} Win Streak</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-slate-900 text-lg">{post.content.text}</p>
                      {post.content.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden">
                          <Image
                            src={post.content.imageUrl}
                            alt="Post image"
                            width={500}
                            height={300}
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-6">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.engagement.liked ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${post.engagement.liked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.engagement.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-slate-600 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{post.engagement.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-slate-600 hover:text-green-500 transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm">{post.engagement.shares}</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => handleSave(post.id)}
                      className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                        post.engagement.saved ? 'text-blue-500' : 'text-slate-400'
                      }`}
                    >
                      <Bookmark className={`h-5 w-5 ${post.engagement.saved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </Card>
              ))
              ) : (
                <Card className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No posts yet</h3>
                  <p className="text-slate-500 mb-6">
                    {activeTab === 'subscriptions' 
                      ? 'No posts from your subscriptions. Subscribe to some sellers to see their content here.'
                      : 'Be the first to share something with the community!'
                    }
                  </p>
                  <Button 
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </Card>
              )}

              {/* Load more - only show if there are posts */}
              {filteredPosts.length > 0 && (
                <div className="text-center py-6">
                  <Button variant="outline" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Topics */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-900">Trending</h3>
              </div>
              <div className="space-y-3">
                <div className="text-center py-6 text-slate-500">
                  <Flame className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm">No trending topics yet</p>
                  <p className="text-xs text-slate-400">Check back later for popular hashtags</p>
                </div>
              </div>
            </Card>

            {/* Suggested Users */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Suggested for You</h3>
              <div className="space-y-4">
                <div className="text-center py-6 text-slate-500">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm">No suggestions yet</p>
                  <p className="text-xs text-slate-400">Follow some users to get personalized recommendations</p>
                </div>
              </div>
            </Card>

            {/* Community Stats */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Community Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-100">Active Users</span>
                  <span className="font-bold">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Picks Today</span>
                  <span className="font-bold">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Win Rate</span>
                  <span className="font-bold">68.2%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Creation Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">@sportsbettor</span>
                    <p className="text-sm text-slate-600">Share your thoughts with the community</p>
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What's on your mind? Share your latest pick, analysis, or celebration..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={maxCharacters}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${
                      postContent.length > maxCharacters * 0.9 ? 'text-red-500' : 'text-slate-500'
                    }`}>
                      {postContent.length}/{maxCharacters}
                    </span>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <input
                    type="file"
                    id="post-image"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="post-image"
                    className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="text-center">
                      <Camera className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Add photo (JPG, PNG, GIF • 5MB max)</span>
                    </div>
                  </label>
                  
                  {postImagePreview && (
                    <div className="mt-3 relative">
                      <Image
                        src={postImagePreview}
                        alt="Preview"
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setPostImage(null)
                          setPostImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Visibility Settings */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setPostVisibility('public')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        postVisibility === 'public'
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Public
                    </button>
                    <button
                      onClick={() => setPostVisibility('subscribers')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        postVisibility === 'subscribers'
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Subscribers Only
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || isPosting || postContent.length > maxCharacters}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}