'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Upload,
  User,
  X,
  Store,
  Eye,
} from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/use-profile'

interface SellerProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: {
    bio?: string
    profile_img?: string
    banner_img?: string
  }
}

interface PreviewProfile {
  username: string
  bio: string
  profile_img: string
  banner_img: string
  is_verified_seller: boolean
  created_at: string
  strategies: Array<{
    id: string
    strategy_name: string
    roi_percentage: number
    win_rate: number
    total_bets: number
    primary_sport: string
    strategy_type: string
  }>
}

export function SellerProfileEditor({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: SellerProfileEditorProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [bio, setBio] = useState(initialData?.bio || '')
  const [profileImg, setProfileImg] = useState(initialData?.profile_img || '')
  const [bannerImg, setBannerImg] = useState(initialData?.banner_img || '')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [previewProfile, setPreviewProfile] = useState<PreviewProfile | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const profileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Fetch current profile data for preview on open
  useEffect(() => {
    if (isOpen && user && profile?.username) {
      fetchProfileData()
    }
  }, [isOpen, user, profile?.username])

  const fetchProfileData = async () => {
    if (!profile?.username) return
    
    try {
      const response = await fetch(`/api/seller-profile?username=${encodeURIComponent(profile.username)}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setPreviewProfile({
          username: result.data.username,
          bio: result.data.bio || '',
          profile_img: result.data.profile_img || '',
          banner_img: result.data.banner_img || '',
          is_verified_seller: result.data.is_verified_seller || false,
          created_at: result.data.created_at,
          strategies: result.data.strategies || []
        })
        
        // Update form fields with current data
        setBio(result.data.bio || '')
        setProfileImg(result.data.profile_img || '')
        setBannerImg(result.data.banner_img || '')
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    }
  }

  // Update preview when form values change
  useEffect(() => {
    if (previewProfile) {
      setPreviewProfile(prev => prev ? {
        ...prev,
        bio,
        profile_img: profileImg,
        banner_img: bannerImg
      } : null)
    }
  }, [bio, profileImg, bannerImg])

  const handleImageUpload = async (file: File, type: 'profile' | 'banner') => {
    if (!file) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WebP files are allowed')
      return
    }

    try {
      if (type === 'profile') setUploadingProfile(true)
      else setUploadingBanner(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/seller-profile/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        if (type === 'profile') {
          setProfileImg(result.data.url)
        } else {
          setBannerImg(result.data.url)
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      if (type === 'profile') setUploadingProfile(false)
      else setUploadingBanner(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    console.log('Saving profile data:', {
      bio: bio.trim() || null,
      profile_img: profileImg || null,
      banner_img: bannerImg || null,
    })

    setIsLoading(true)
    try {
      const response = await fetch('/api/seller-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bio: bio.trim() || null,
          profile_img: profileImg || null,
          banner_img: bannerImg || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Save response:', result)

      if (result.success) {
        console.log('Profile saved successfully')
        onSuccess?.()
        onClose()
      } else {
        throw new Error(result.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //   })
  // }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // const handleBackdropClick = (e: React.MouseEvent) => {
  //   if (e.target === e.currentTarget) {
  //     onClose()
  //   }
  // }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    
    return undefined
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] w-full max-w-7xl overflow-hidden p-0">
        <div className="flex h-full max-h-[95vh]">
          {/* Editor Panel */}
          <div className="w-1/2 flex flex-col border-r">
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Customize your marketplace profile</DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Images Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Photo */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <User className="h-4 w-4" />
                    Profile Photo
                  </Label>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'group flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:bg-gray-100',
                        profileImg && 'border-solid border-blue-200 bg-blue-50'
                      )}
                      onClick={() => !uploadingProfile && profileInputRef.current?.click()}
                    >
                      {uploadingProfile ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      ) : profileImg ? (
                        <img
                          src={profileImg}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploadingProfile}
                        className="w-full"
                      >
                        {uploadingProfile
                          ? 'Uploading...'
                          : profileImg
                            ? 'Change Photo'
                            : 'Upload Photo'}
                      </Button>
                      {profileImg && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProfileImg('')}
                          className="mt-2 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Square image, min 400x400px, max 5MB</p>
                </div>

                {/* Banner Image */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <ImageIcon className="h-4 w-4" />
                    Banner Image
                  </Label>
                  <div
                    className={cn(
                      'group flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:bg-gray-100',
                      bannerImg && 'border-solid border-blue-200 bg-blue-50'
                    )}
                    onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
                  >
                    {uploadingBanner ? (
                      <div className="text-center">
                        <Loader2 className="mx-auto mb-1 h-6 w-6 animate-spin text-blue-500" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : bannerImg ? (
                      <div className="relative h-full w-full">
                        <img
                          src={bannerImg}
                          alt="Banner"
                          className="h-full w-full rounded-lg object-cover"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={e => {
                            e.stopPropagation()
                            setBannerImg('')
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto mb-1 h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                        <p className="text-sm text-gray-600">Click to upload banner</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Wide format, 1200x300px recommended, max 5MB</p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-4">
                <Label htmlFor="bio" className="text-base font-semibold">
                  Professional Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell potential subscribers about your betting expertise, experience, and what makes your strategies unique..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Share your experience, specialties, and track record
                  </p>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      bio.length > 450
                        ? 'text-red-600'
                        : bio.length > 400
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                    )}
                  >
                    {bio.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t p-6">
              <p className="text-sm text-gray-500">Changes will appear on your marketplace profile</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading || uploadingProfile || uploadingBanner}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || uploadingProfile || uploadingBanner}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          {showPreview && previewProfile && (
            <div className="w-1/2 flex flex-col bg-gray-50">
              <div className="p-6 pb-4 border-b bg-white">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Marketplace Preview</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">How your profile will appear to visitors</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {/* Preview of the marketplace profile */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  {/* Banner Preview */}
                  <div className="relative">
                    <div
                      className={cn(
                        'h-32 bg-gradient-to-r from-blue-600 to-blue-700 relative',
                        bannerImg && 'bg-none'
                      )}
                    >
                      {bannerImg ? (
                        <>
                          <img
                            src={bannerImg}
                            alt="Profile banner"
                            className="h-32 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute left-2 top-2 text-xs text-white opacity-50">
                          No banner image
                        </div>
                      )}
                      
                      {/* Username and Bio overlay - positioned over banner */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <h1 className="text-xl font-bold text-gray-900">
                              @{previewProfile.username}
                            </h1>
                            {previewProfile.is_verified_seller && (
                              <div className="flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </div>
                            )}
                          </div>
                          
                          {bio && bio.trim() ? (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {bio}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic text-sm">
                              No bio available
                            </p>
                          )}
                          
                          {/* Quick Stats in the text box */}
                          <div className="mt-3 flex items-center space-x-4 text-xs">
                            <div className="flex items-center text-gray-600">
                              <Store className="mr-1 h-3 w-3" />
                              <span className="font-medium">{previewProfile.strategies.length}</span>
                              <span className="ml-1">
                                {previewProfile.strategies.length === 1 ? 'strategy' : 'strategies'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative px-6 pb-6">
                      {/* Simplified Profile Section - Just profile image and basic info */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {profileImg ? (
                              <img
                                src={profileImg}
                                alt={previewProfile.username}
                                className="h-16 w-16 rounded-full border-3 border-white object-cover shadow-lg"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-white bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                                {previewProfile.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {previewProfile.is_verified_seller && (
                              <div className="absolute -bottom-1 -right-1">
                                <div className="rounded-full bg-blue-500 p-1">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Performance Overview Preview */}
                      {previewProfile.strategies.length > 0 && (
                        <div className="mt-6">
                          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            {(() => {
                              const stats = previewProfile.strategies.reduce(
                                (acc, strategy) => {
                                  acc.totalROI += strategy.roi_percentage
                                  acc.totalWinRate += strategy.win_rate
                                  acc.totalBets += strategy.total_bets
                                  return acc
                                },
                                { totalROI: 0, totalWinRate: 0, totalBets: 0 }
                              )
                              const avgROI = previewProfile.strategies.length > 0 ? stats.totalROI / previewProfile.strategies.length : 0
                              const avgWinRate = previewProfile.strategies.length > 0 ? stats.totalWinRate / previewProfile.strategies.length : 0
                              
                              return (
                                <>
                                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                                    <div className={`mb-1 text-2xl font-bold ${
                                      avgROI >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {avgROI >= 0 ? '+' : ''}
                                      {avgROI.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Average ROI</div>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                                    <div className="mb-1 text-2xl font-bold text-slate-900">
                                      {avgWinRate.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Win Rate</div>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                                    <div className="mb-1 text-2xl font-bold text-slate-900">
                                      {stats.totalBets.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-600">Total Bets</div>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                                    <div className="mb-1 text-2xl font-bold text-blue-600">
                                      {previewProfile.strategies.length}
                                    </div>
                                    <div className="text-sm text-slate-600">Strategies</div>
                                  </div>
                                </>
                              )
                            })()} 
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={profileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file, 'profile')
          }}
          className="hidden"
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file, 'banner')
          }}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}
