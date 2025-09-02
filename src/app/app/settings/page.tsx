// src/app/settings/page.tsx
'use client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  Bell,
  Camera,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Globe,
  Lock,
  MapPin,
  Save,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'account'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Account
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bell className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'privacy'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Eye className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('sportsbooks')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'sportsbooks'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Zap className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Sportsbooks
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === 'billing'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CreditCard className="-ml-1 mr-3 h-5 w-5 flex-shrink-0" />
              Billing
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your public profile information
                  </p>
                </div>
                <div className="space-y-6 px-6 py-4">
                  {/* Profile Picture */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-xl font-bold text-white">
                        SB
                      </div>
                      <div>
                        <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Photo
                        </button>
                        <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        defaultValue="Sports Bettor"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500">
                          @
                        </span>
                        <input
                          type="text"
                          className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 focus:border-blue-500 focus:ring-blue-500"
                          defaultValue="sportsbettor"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      rows={4}
                      className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Tell others about yourself..."
                      defaultValue="Sports betting enthusiast focused on data-driven analysis and consistent profits."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Brief description for your profile.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                          type="text"
                          className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="City, State"
                          defaultValue="Miami, FL"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                        <input
                          type="url"
                          className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your account preferences</p>
                </div>
                <div className="space-y-6 px-6 py-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="email"
                        className="flex-1 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        defaultValue="user@example.com"
                      />
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="tel"
                        className="flex-1 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                      <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                        Verify
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Time Zone
                    </label>
                    <select className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Export your data or delete your account
                  </p>
                </div>
                <div className="space-y-4 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                      <p className="text-sm text-gray-500">
                        Download all your betting data and analytics
                      </p>
                    </div>
                    <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </button>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-600">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password */}
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Password</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Change your password to keep your account secure
                  </p>
                </div>
                <div className="px-6 py-4">
                  {!showPasswordChange ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {twoFactorEnabled ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <Lock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {twoFactorEnabled
                            ? 'Your account is protected with 2FA'
                            : '2FA is not enabled'}
                        </div>
                      </div>
                    </div>
                    <div>
                      {twoFactorEnabled ? (
                        <button
                          onClick={() => setTwoFactorEnabled(false)}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTwoFactorSetup(true)}
                          className="inline-flex items-center rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50"
                        >
                          Enable 2FA
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 2FA Setup Modal */}
                  {showTwoFactorSetup && !twoFactorEnabled && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
                        <h4 className="mb-2 flex items-center text-lg font-bold text-gray-900">
                          <Smartphone className="mr-2 h-5 w-5 text-blue-600" />
                          Set Up Two-Factor Authentication
                        </h4>
                        <p className="mb-4 text-sm text-gray-600">
                          Scan the QR code below with your authenticator app, then enter the 6-digit
                          code to enable 2FA.
                        </p>
                        <div className="mb-4 flex items-center justify-center">
                          <div className="flex h-32 w-32 items-center justify-center rounded bg-gray-100 text-gray-400">
                            {/* Replace with real QR code in production */}
                            QR CODE
                          </div>
                        </div>
                        <input
                          type="text"
                          className="mb-4 block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter 6-digit code"
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowTwoFactorSetup(false)}
                            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setTwoFactorEnabled(true)
                              setShowTwoFactorSetup(false)
                            }}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other tabs content can be added similarly... */}
        </div>
      </div>
    </DashboardLayout>
  )
}
