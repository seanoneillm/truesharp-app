'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePosts } from '@/lib/hooks/use-posts'
import {
  Bookmark,
  Camera,
  Globe,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Share2,
  User,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'public' | 'subscriptions'>('public')
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Post creation state
  const [postContent, setPostContent] = useState('')
  const [postImage, setPostImage] = useState<File | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Use the posts hook
  const { posts, loading, error, hasMore, loadMore, refresh, createPost } = usePosts({
    filter: activeTab,
    autoRefresh: true,
  })

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
      reader.onload = e => {
        setPostImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    setIsPosting(true)

    try {
      await createPost(postContent, postImage || undefined)

      // Reset form
      setPostContent('')
      setPostImage(null)
      setPostImagePreview(null)
      setShowCreatePost(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Community Feed</h1>
                <p className="mt-1 text-lg text-slate-600">
                  Latest posts and insights from the community
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'public'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Globe className="mr-2 h-4 w-4" />
              Public Feed
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'subscriptions'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              Subscriptions
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Error State */}
              {error && (
                <Card className="border-red-200 bg-red-50 p-6">
                  <div className="flex items-center space-x-3">
                    <X className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-medium text-red-800">Error loading posts</h3>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Loading State */}
              {loading && posts.length === 0 && (
                <Card className="p-12 text-center">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-slate-600">Loading posts...</p>
                </Card>
              )}

              {/* Posts */}
              {posts.map(post => (
                <Card key={post.id} className="p-6 transition-all duration-300 hover:shadow-lg">
                  {/* Post Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 font-bold text-white shadow-lg">
                        {post.profiles.profile_picture_url ? (
                          <Image
                            src={post.profiles.profile_picture_url}
                            alt={post.profiles.username || 'User'}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          (post.profiles.username || 'U').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">
                            @{post.profiles.username || 'anonymous'}
                          </span>
                          {post.profiles.is_verified_seller && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{formatRelativeTime(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                      <MoreHorizontal className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="whitespace-pre-wrap text-lg text-slate-900">{post.content}</p>
                    {post.image_url && (
                      <div className="mt-3 overflow-hidden rounded-xl">
                        <Image
                          src={post.image_url}
                          alt="Post image"
                          width={500}
                          height={300}
                          className="h-auto w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="flex items-center space-x-6">
                      <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-red-500">
                        <Heart className="h-5 w-5" />
                        <span className="text-sm">0</span>
                      </button>
                      <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-blue-500">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">0</span>
                      </button>
                      <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-green-500">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm">0</span>
                      </button>
                    </div>
                    <button className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                      <Bookmark className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>
                </Card>
              ))}

              {/* Empty State */}
              {!loading && posts.length === 0 && !error && (
                <Card className="p-12 text-center">
                  <MessageSquare className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-600">No posts yet</h3>
                  <p className="mb-6 text-slate-500">
                    {activeTab === 'subscriptions'
                      ? 'No posts from your subscriptions. Subscribe to some sellers to see their content here.'
                      : 'Be the first to share something with the community!'}
                  </p>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Post
                  </Button>
                </Card>
              )}

              {/* Load More */}
              {hasMore && posts.length > 0 && (
                <div className="py-6 text-center">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <div className="space-y-6 lg:col-span-1">
            {/* Community Stats */}
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white">
              <div className="mb-4 flex items-center space-x-2">
                <MessageSquare className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Community Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-100">Total Posts</span>
                  <span className="font-bold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Active Today</span>
                  <span className="font-bold">
                    {
                      posts.filter(p => {
                        const today = new Date()
                        const postDate = new Date(p.created_at)
                        return postDate.toDateString() === today.toDateString()
                      }).length
                    }
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Creation Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="mb-4 flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 font-bold text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">@you</span>
                    <p className="text-sm text-slate-600">Share your thoughts with the community</p>
                  </div>
                </div>

                {/* Post Content */}
                <div>
                  <textarea
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder="What's on your mind? Share your latest thoughts, analysis, or celebrations..."
                    className="h-32 w-full resize-none rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    maxLength={maxCharacters}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        postContent.length > maxCharacters * 0.9 ? 'text-red-500' : 'text-slate-500'
                      }`}
                    >
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
                    className="flex h-20 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-blue-500"
                  >
                    <div className="text-center">
                      <Camera className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Add photo (JPG, PNG, GIF • 5MB max)
                      </span>
                    </div>
                  </label>

                  {postImagePreview && (
                    <div className="relative mt-3">
                      <Image
                        src={postImagePreview}
                        alt="Preview"
                        width={400}
                        height={200}
                        className="h-48 w-full rounded-xl object-cover"
                      />
                      <button
                        onClick={() => {
                          setPostImage(null)
                          setPostImagePreview(null)
                        }}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                    disabled={isPosting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={
                      !postContent.trim() || isPosting || postContent.length > maxCharacters
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
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
