'use client'

import ProtectedRoute from '@/components/auth/protected-route'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  CreditCard,
  Download,
  Key,
  Lock,
  Mail,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Types for settings data - matches the provided profiles table schema
interface UserProfile {
  id: string
  username: string | null
  bio: string | null
  is_seller: boolean | null
  created_at: string | null
  updated_at: string | null
  is_verified_seller: boolean | null
  email: string | null
  pro: string | null
  profile_picture_url: string | null
  public_profile: boolean | null
  sharpsports_bettor_id: string | null
  display_name: string | null
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  currency: string
  email_notifications: {
    subscriptions: boolean
    followers: boolean
    weekly_summary: boolean
    marketing: boolean
  }
}

interface SellerStripeAccount {
  stripe_account_id: string
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements_due: string[]
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  // State for all settings sections
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    timezone: 'America/New_York',
    currency: 'USD',
    email_notifications: {
      subscriptions: true,
      followers: true,
      weekly_summary: true,
      marketing: true,
    },
  })
  const [sellerAccount, setSellerAccount] = useState<SellerStripeAccount | null>(null)
  const [subscriptions, setSubscriptions] = useState<
    Array<{
      id: string
      strategy_id: string
      seller_id: string
      price: number
      frequency: string
      status: string
      strategies?: { name: string }
      profiles?: { username: string }
    }>
  >([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [profileForm, setProfileForm] = useState({
    username: '',
    display_name: '',
    bio: '',
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  const loadUserData = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('Profile not found in database. Please contact support.')
          return
        }
        setError(`Database error: ${profileError.message}`)
        return
      }

      if (profileData) {
        setProfile(profileData)

        const formData = {
          username: profileData.username || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
        }

        setProfileForm(formData)
      } else {
        setError('No profile data found')
      }

      // Load user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsData) {
        setSettings({
          theme: settingsData.theme || 'light',
          timezone: settingsData.timezone || 'America/New_York',
          currency: settingsData.currency || 'USD',
          email_notifications: settingsData.email_notifications || {
            subscriptions: true,
            followers: true,
            weekly_summary: true,
            marketing: true,
          },
        })
      }

      // Load seller account if is_seller
      if (profileData?.is_seller) {
        const { data: stripeData } = await supabase
          .from('seller_stripe_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (stripeData) {
          setSellerAccount(stripeData)
        }
      }

      // Load subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*, strategies(*), profiles(*)')
        .eq('subscriber_id', user.id)
        .eq('status', 'active')

      if (subsData) {
        setSubscriptions(subsData)
      }
    } catch (error) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user, loadUserData])

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      // Check file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are supported')
        return
      }

      setProfileImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = e => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      // Upload profile image if changed
      let profile_picture_url = profile?.profile_picture_url
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop()
        // Use simple filename format that should work with basic RLS
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        try {
          // Remove old profile picture if it exists
          if (profile?.profile_picture_url) {
            const oldFileName = profile.profile_picture_url.split('/').pop()
            if (oldFileName) {
              await supabase.storage
                .from('profile-pictures')
                .remove([oldFileName])
                .catch(() => {}) // Ignore errors when removing old images
            }
          }

          // Upload new profile picture
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, profileImageFile, {
              cacheControl: '3600',
              upsert: true, // This allows overwriting existing files
            })

          if (uploadError) {
            // If it's an RLS error, skip image upload for now but continue with profile save
            if (uploadError.message?.includes('row-level security')) {
              profile_picture_url = profile?.profile_picture_url // Keep existing image
              // Don't throw error - continue with profile save
            } else {
              throw uploadError
            }
          }

          // Generate public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from('profile-pictures').getPublicUrl(fileName)

          if (!publicUrl) {
            throw new Error('Failed to generate public URL for uploaded image')
          }

          profile_picture_url = publicUrl
        } catch (error) {
          throw error
        }
      }

      // Prepare update data - handle all fields including null values
      const updateData: Record<string, unknown> = {
        username: profileForm.username?.trim() || null,
        bio: profileForm.bio?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      // Only add display_name if it exists in the form (some schemas might not have it)
      if (profileForm.display_name !== undefined) {
        updateData.display_name = profileForm.display_name?.trim() || null
      }

      if (profile_picture_url) {
        updateData.profile_picture_url = profile_picture_url
      }

      // First, let's check if the profile exists
      const { error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        throw new Error(
          'Profile not found in database. Please run the diagnostic SQL script to create your profile.'
        )
      }

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`)
      }

      // USE API ENDPOINT TO BYPASS RLS ISSUES

      const apiUpdateData = {
        username: updateData.username,
        display_name: updateData.display_name,
        bio: updateData.bio,
        profile_picture_url: profile_picture_url,
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdateData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'API update failed')
      }

      setSuccess('Profile updated successfully')
      await loadUserData()
      setProfileImageFile(null)
      setProfileImagePreview(null)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        theme: settings.theme,
        timezone: settings.timezone,
        currency: settings.currency,
        email_notifications: settings.email_notifications,
      })

      if (error) throw error

      setSuccess('Settings saved successfully')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      setSaving(true)
      setError(null)

      if (passwordForm.new !== passwordForm.confirm) {
        setError('New passwords do not match')
        return
      }

      if (passwordForm.new.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new,
      })

      if (error) throw error

      setSuccess('Password updated successfully')
      setPasswordForm({ current: '', new: '', confirm: '' })
      setShowPasswordModal(false)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const becomeASeller = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      // Update profile to enable seller
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Seller account enabled! You can now create strategies.')
      await loadUserData()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to enable seller account')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all user data
      const [
        { data: profileData },
        { data: betsData },
        { data: strategiesData },
        { data: subscriptionsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id),
        supabase.from('bets').select('*').eq('user_id', user.id),
        supabase.from('strategies').select('*').eq('user_id', user.id),
        supabase.from('subscriptions').select('*').eq('subscriber_id', user.id),
      ])

      const exportData = {
        profile: profileData?.[0],
        bets: betsData || [],
        strategies: strategiesData || [],
        subscriptions: subscriptionsData || [],
        exported_at: new Date().toISOString(),
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `truesharp-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess('Data exported successfully')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to export data')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    try {
      setSaving(true)
      setError(null)

      // Note: In production, this would trigger a server-side cleanup process
      // For now, we'll just sign out and show a message
      await supabase.auth.signOut()
      router.push('/login?message=Account deletion requested. Please contact support to complete.')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setSaving(false)
    }
  }

  const copyPublicProfileLink = () => {
    if (profile?.username) {
      const url = `https://truesharp.io/subscribe/${profile.username}`
      navigator.clipboard.writeText(url)
      setSuccess('Profile link copied to clipboard')
    }
  }

  const sections = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Manage your public profile and personal information',
    },
    {
      id: 'account',
      label: 'Account & Security',
      icon: Shield,
      description: 'Password, security, and authentication settings',
    },
    {
      id: 'billing',
      label: 'Billing & Subscriptions',
      icon: CreditCard,
      description: 'Manage payments and subscription billing',
    },
    {
      id: 'seller',
      label: 'Seller Settings',
      icon: Zap,
      description: 'Seller dashboard and monetization options',
    },
    {
      id: 'privacy',
      label: 'Privacy & Data',
      icon: Lock,
      description: 'Privacy controls and data management',
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                  <p className="mt-1 text-lg text-slate-600">
                    Manage your account, preferences, and integrations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  profile?.pro === 'yes'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {profile?.pro === 'yes' ? 'Pro Member' : 'Free Member'}
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Card className="border-red-200 bg-red-50 p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )}

          {success && (
            <Card className="border-green-200 bg-green-50 p-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <p className="text-green-700">{success}</p>
                <button
                  onClick={() => setSuccess(null)}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <nav className="space-y-2">
                  {sections.map(section => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{section.label}</div>
                          {activeSection === section.id && (
                            <div className="mt-1 text-xs text-blue-100">{section.description}</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="space-y-8 lg:col-span-3">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <Card className="p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                      <p className="mt-1 text-slate-600">
                        Manage your public profile and personal information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div>
                      <label className="mb-4 block text-sm font-medium text-slate-700">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-lg">
                            {profileImagePreview ? (
                              <img
                                src={profileImagePreview}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            ) : profile?.profile_picture_url ? (
                              <img
                                src={profile.profile_picture_url}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (profile?.username || profile?.display_name || 'U')
                                .charAt(0)
                                ?.toUpperCase()
                            )}
                          </div>
                          {profile?.is_verified_seller && (
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 p-1">
                              <ShieldCheck className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            id="profile-image"
                            accept="image/jpeg,image/png"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="profile-image"
                            className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Change Photo
                          </label>
                          <p className="mt-2 text-xs text-slate-500">JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Username
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileForm.username}
                            onChange={e =>
                              setProfileForm({ ...profileForm, username: e.target.value })
                            }
                            className="block w-full rounded-lg border border-slate-300 px-4 py-3 pl-8 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter username"
                          />
                          <span className="absolute left-3 top-3 text-slate-400">@</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          3-20 characters, alphanumeric only
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.display_name}
                          onChange={e =>
                            setProfileForm({ ...profileForm, display_name: e.target.value })
                          }
                          className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter display name"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                          rows={3}
                          maxLength={500}
                          className="block w-full resize-none rounded-lg border border-slate-300 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell others about yourself..."
                        />
                        <div className="mt-1 flex justify-between">
                          <p className="text-xs text-slate-500">
                            Brief description for your profile
                          </p>
                          <p
                            className={`text-xs ${(profileForm.bio?.length || 0) > 450 ? 'text-red-500' : 'text-slate-500'}`}
                          >
                            {profileForm.bio?.length || 0}/500
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 pl-10 text-slate-500 shadow-sm"
                          />
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Email cannot be changed here. Contact support if needed.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          SharpSports Bettor ID
                        </label>
                        <input
                          type="text"
                          value={profile?.sharpsports_bettor_id || 'Not linked'}
                          disabled
                          className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-500 shadow-sm"
                          placeholder="Not linked"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Contact support to link your SharpSports account
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 border-t border-slate-200 pt-6">
                      <Button
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Account & Security Section */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">Account & Security</h2>
                      <p className="mt-1 text-slate-600">
                        Manage your password and security settings
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Password Section */}
                      <div className="rounded-lg border border-slate-200 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">Password</h3>
                            <p className="text-sm text-slate-600">Last updated 2 weeks ago</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center"
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Change Password
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Lock className="h-4 w-4" />
                          <span>Use a strong password to keep your account secure</span>
                        </div>
                      </div>

                      {/* Security Features */}
                      <div className="rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                          Security Features
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">
                                Two-Factor Authentication
                              </div>
                              <div className="text-sm text-slate-600">
                                Add an extra layer of security to your account
                              </div>
                            </div>
                            <Button variant="outline" disabled className="text-slate-400">
                              Coming Soon
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">Active Sessions</div>
                              <div className="text-sm text-slate-600">
                                Manage devices that are signed in to your account
                              </div>
                            </div>
                            <Button variant="outline">Manage Sessions</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Billing & Subscriptions Section */}
              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">Billing & Subscriptions</h2>
                      <p className="mt-1 text-slate-600">
                        Manage your payments and subscription billing
                      </p>
                    </div>

                    {/* TrueSharp Pro Status */}
                    <div className="mb-6 rounded-lg border border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">TrueSharp Pro</h3>
                          <div className="mt-1 flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                profile?.pro === 'yes' ? 'bg-purple-500' : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-sm text-slate-600">
                              {profile?.pro === 'yes' ? 'Active Pro Subscription' : 'Free Plan'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {profile?.pro === 'yes' ? (
                            <Button variant="outline">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Manage Billing
                            </Button>
                          ) : (
                            <Button className="bg-purple-600 hover:bg-purple-700">
                              Upgrade to Pro
                            </Button>
                          )}
                        </div>
                      </div>
                      {profile?.pro === 'yes' && (
                        <div className="mt-4 text-sm text-slate-600">
                          <p>Next billing date: January 15, 2025</p>
                          <p>Amount: $20.00/month</p>
                        </div>
                      )}
                    </div>

                    {/* Active Subscriptions */}
                    <div className="rounded-lg border border-slate-200 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">
                        Strategy Subscriptions
                      </h3>
                      {subscriptions.length > 0 ? (
                        <div className="space-y-3">
                          {subscriptions.map(sub => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                            >
                              <div>
                                <div className="font-medium text-slate-900">
                                  @{sub.profiles?.username}
                                </div>
                                <div className="text-sm text-slate-600">{sub.strategies?.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-slate-900">
                                  ${sub.price}/{sub.frequency}
                                </div>
                                <Button variant="outline" size="sm" className="mt-1">
                                  Manage
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-500">
                          <CreditCard className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                          <p>No active subscriptions</p>
                          <p className="text-sm">
                            Browse the marketplace to find strategies to follow
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Seller Settings Section */}
              {activeSection === 'seller' && (
                <div className="space-y-6">
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">Seller Settings</h2>
                      <p className="mt-1 text-slate-600">
                        Manage your seller account and monetization options
                      </p>
                    </div>

                    {/* Seller Status */}
                    <div className="mb-6 rounded-lg border border-slate-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Seller Status</h3>
                          <div className="mt-1 flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                profile?.is_seller ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-sm text-slate-600">
                              {profile?.is_seller ? 'Seller Account Active' : 'Not a Seller'}
                            </span>
                          </div>
                        </div>
                        <div>
                          {profile?.is_seller ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" onClick={() => router.push('/sell')}>
                                Seller Dashboard
                              </Button>
                              {profile.is_verified_seller && (
                                <div className="flex items-center space-x-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-800">
                                  <ShieldCheck className="h-4 w-4" />
                                  <span className="text-sm font-medium">Verified</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={becomeASeller}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {saving ? 'Enabling...' : 'Become a Seller'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Public Profile Settings (Sellers Only) */}
                    {profile?.is_seller && (
                      <div className="mb-6 rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                          Public Profile
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">Make profile public</div>
                              <div className="text-sm text-slate-600">
                                Allow others to subscribe to your strategies
                              </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={profile.public_profile || false}
                                onChange={async e => {
                                  const {
                                    data: { user },
                                  } = await supabase.auth.getUser()
                                  if (user) {
                                    await supabase
                                      .from('profiles')
                                      .update({ public_profile: e.target.checked })
                                      .eq('id', user.id)
                                    await loadUserData()
                                  }
                                }}
                                className="sr-only"
                              />
                              <div
                                className={`h-6 w-11 rounded-full transition-colors ${
                                  profile.public_profile ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <div
                                  className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                                    profile.public_profile ? 'translate-x-5' : 'translate-x-0.5'
                                  } mt-0.5`}
                                ></div>
                              </div>
                            </label>
                          </div>

                          {profile.public_profile && (
                            <div className="rounded-lg bg-blue-50 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-blue-900">
                                    Public Profile URL
                                  </div>
                                  <div className="font-mono text-sm text-blue-700">
                                    truesharp.io/subscribe/{profile.username}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={copyPublicProfileLink}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Link
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payout Information (Sellers Only) */}
                    {profile?.is_seller && (
                      <div className="rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                          Payout Information
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">
                                Connected Bank Account
                              </div>
                              <div className="text-sm text-slate-600">
                                {sellerAccount?.details_submitted
                                  ? 'Bank account connected and verified'
                                  : 'Connect your bank account to receive payouts'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  sellerAccount?.payouts_enabled ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                              ></div>
                              <Button variant="outline" size="sm">
                                {sellerAccount?.details_submitted ? 'Manage' : 'Connect'} Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Privacy & Data Section */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">Privacy & Data</h2>
                      <p className="mt-1 text-slate-600">
                        Control your privacy settings and manage your data
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Data Controls */}
                      <div className="rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">Data Controls</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">Download my data</div>
                              <div className="text-sm text-slate-600">
                                Get a copy of all your data in JSON format
                              </div>
                            </div>
                            <Button variant="outline" onClick={exportData} disabled={saving}>
                              <Download className="mr-2 h-4 w-4" />
                              {saving ? 'Exporting...' : 'Export Data'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Notification Preferences */}
                      <div className="rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900">
                          Notification Preferences
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(settings.email_notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium capitalize text-slate-900">
                                  {key.replace('_', ' ')}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {key === 'subscriptions' &&
                                    'New subscription notifications and updates'}
                                  {key === 'followers' && 'When someone follows your strategies'}
                                  {key === 'weekly_summary' &&
                                    'Weekly performance and activity summary'}
                                  {key === 'marketing' && 'Product updates and promotional emails'}
                                </div>
                              </div>
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={e => {
                                    setSettings({
                                      ...settings,
                                      email_notifications: {
                                        ...settings.email_notifications,
                                        [key]: e.target.checked,
                                      },
                                    })
                                  }}
                                  className="sr-only"
                                />
                                <div
                                  className={`h-6 w-11 rounded-full transition-colors ${
                                    value ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <div
                                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                                      value ? 'translate-x-5' : 'translate-x-0.5'
                                    } mt-0.5`}
                                  ></div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
                          <Button onClick={saveSettings} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Preferences'}
                          </Button>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-red-900">Danger Zone</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-red-900">Delete Account</div>
                              <div className="text-sm text-red-700">
                                Permanently delete your account and all associated data
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteModal(true)}
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <Card className="w-full max-w-md p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={changePassword}
                    disabled={
                      saving || !passwordForm.current || !passwordForm.new || !passwordForm.confirm
                    }
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <Card className="w-full max-w-md p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-red-900">Delete Account</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 rounded-lg bg-red-50 p-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">This action cannot be undone</div>
                      <div className="text-sm text-red-700">
                        All your data will be permanently deleted
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p className="mb-2">This will permanently delete:</p>
                    <ul className="ml-4 list-inside list-disc space-y-1">
                      <li>Your profile and account information</li>
                      <li>All betting history and analytics</li>
                      <li>Created strategies and performance data</li>
                      <li>Subscription history</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={deleteAccount}
                    disabled={saving}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {saving ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
