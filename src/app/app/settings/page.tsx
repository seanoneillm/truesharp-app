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
  Zap
} from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

  const connectedSportsbooks = [
    {
      id: 1,
      name: 'DraftKings',
      logo: 'DK',
      status: 'connected',
      lastSync: '2 minutes ago',
      betsTracked: 124,
      connectionDate: '2024-11-15',
      error: null
    },
    {
      id: 2,
      name: 'FanDuel',
      logo: 'FD',
      status: 'connected',
      lastSync: '5 minutes ago',
      betsTracked: 89,
      connectionDate: '2024-12-01',
      error: null
    },
    {
      id: 3,
      name: 'BetMGM',
      logo: 'BM',
      status: 'error',
      lastSync: '2 hours ago',
      betsTracked: 56,
      connectionDate: '2024-10-20',
      error: 'Authentication failed. Please reconnect.'
    }
  ]

  const availableSportsbooks = [
    { name: 'Caesars', logo: 'CS', available: true },
    { name: 'ESPN BET', logo: 'EB', available: true },
    { name: 'BetRivers', logo: 'BR', available: true },
    { name: 'Hard Rock', logo: 'HR', available: false },
    { name: 'WynnBET', logo: 'WB', available: false }
  ]

  return (
    <DashboardLayout current="Settings">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <User className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'account'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Account
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Shield className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Bell className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'privacy'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Eye className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('sportsbooks')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'sportsbooks'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Zap className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Sportsbooks
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'billing'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              Billing
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your public profile information
                  </p>
                </div>
                <div className="px-6 py-4 space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                        SB
                      </div>
                      <div>
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </button>
                        <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="Sports Bettor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                        <input
                          type="text"
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          defaultValue="sportsbettor"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell others about yourself..."
                      defaultValue="Sports betting enthusiast focused on data-driven analysis and consistent profits."
                    />
                    <p className="mt-1 text-sm text-gray-500">Brief description for your profile.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="City, State"
                          defaultValue="Miami, FL"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
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
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your account preferences
                  </p>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="email"
                        className="flex-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="user@example.com"
                      />
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="tel"
                        className="flex-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Verify
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Export your data or delete your account
                  </p>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                      <p className="text-sm text-gray-500">Download all your betting data and analytics</p>
                    </div>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                      <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
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
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
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
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => setShowPasswordChange(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setShowPasswordChange(false)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
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
                          {twoFactorEnabled ? 'Your account is protected with 2FA' : '2FA is not enabled'}
                        </div>
                      </div>
                    </div>
                    <div>
                      {twoFactorEnabled ? (
                        <button
                          onClick={() => setTwoFactorEnabled(false)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTwoFactorSetup(true)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                        >
                          Enable 2FA
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 2FA Setup Modal */}
                  {showTwoFactorSetup && !twoFactorEnabled && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                        <h4 className="text-lg font-bold mb-2 text-gray-900 flex items-center">
                          <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
                          Set Up Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Scan the QR code below with your authenticator app, then enter the 6-digit code to enable 2FA.
                        </p>
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                            {/* Replace with real QR code in production */}
                            QR CODE
                          </div>
                        </div>
                        <input
                          type="text"
                          className="block w-full border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter 6-digit code"
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowTwoFactorSetup(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setTwoFactorEnabled(true);
                              setShowTwoFactorSetup(false);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
