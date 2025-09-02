'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Camera, Loader2, CheckCircle, User, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function SellerProfileEditor({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: SellerProfileEditorProps) {
  const { user } = useAuth()
  const [bio, setBio] = useState(initialData?.bio || '')
  const [profileImg, setProfileImg] = useState(initialData?.profile_img || '')
  const [bannerImg, setBannerImg] = useState(initialData?.banner_img || '')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const profileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Seller Profile</DialogTitle>
          <DialogDescription>Customize your profile to attract subscribers</DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
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
        <div className="flex items-center justify-between border-t pt-6">
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
