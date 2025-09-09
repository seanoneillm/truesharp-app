'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSharpSportsExtension } from '@/lib/contexts/sharpsports-extension'
import { ExtensionDebugCard } from '@/components/sharpsports/extension-debug'
import { AlertCircle, Check, Link, Loader2, RefreshCw, Download } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface BettorAccount {
  id: string
  sharpsports_account_id: string
  book_name: string
  book_abbr: string
  region_name: string
  verified: boolean
  access: boolean
  paused: boolean
  balance: number
  created_at: string
}

interface SharpSportsIntegrationProps {
  userId?: string
}

export function SharpSportsIntegration({ userId }: SharpSportsIntegrationProps) {
  const { user } = useAuth()
  const { 
    extensionAuthToken, 
    extensionVersion,
    isExtensionAvailable,
    refreshExtensionToken
  } = useSharpSportsExtension()
  
  const [accounts, setAccounts] = useState<BettorAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extensionUpdateRequired, setExtensionUpdateRequired] = useState(false)
  const [extensionDownloadUrl, setExtensionDownloadUrl] = useState<string | null>(null)

  const effectiveUserId = userId || user?.id

  // Helper function to handle extension errors
  const handleExtensionError = useCallback((result: { extensionUpdateRequired?: boolean, extensionDownloadUrl?: string, error?: string }) => {
    if (result.extensionUpdateRequired) {
      setExtensionUpdateRequired(true)
      setExtensionDownloadUrl(result.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports')
      setError('Extension update required to continue using SDK-required sportsbooks.')
      return true
    }
    return false
  }, [])

  const handleInstallExtension = useCallback(() => {
    if (extensionDownloadUrl) {
      window.open(extensionDownloadUrl, '_blank')
    } else {
      window.open('https://chrome.google.com/webstore/search/sharpsports', '_blank')
    }
    setExtensionUpdateRequired(false)
    setExtensionDownloadUrl(null)
    setError(null)
  }, [extensionDownloadUrl])

  const loadLinkedAccounts = useCallback(async () => {
    if (!effectiveUserId) return

    try {
      console.log('🔄 Loading linked SharpSports accounts')
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sharpsports/accounts?userId=${effectiveUserId}`)

      if (!response.ok) {
        throw new Error(`Failed to load accounts: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Loaded ${data.accounts.length} SharpSports accounts`)
      setAccounts(data.accounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId])

  // Load linked accounts on component mount
  useEffect(() => {
    if (effectiveUserId) {
      loadLinkedAccounts()
    }
  }, [effectiveUserId, loadLinkedAccounts])

  const handleLinkSportsbooks = useCallback(async () => {
    if (!effectiveUserId) return

    console.log('🔗 Generating SharpSports context for Booklink UI')
    console.log('🔍 Extension data being sent:', { 
      hasToken: !!extensionAuthToken, 
      tokenPreview: extensionAuthToken ? extensionAuthToken.substring(0, 10) + '...' : 'none',
      version: extensionVersion,
      isExtensionAvailable,
    })
    
    // Debug script tag attributes for token/key matching
    const script = document.getElementById('sharpsports-extension-script')
    if (script) {
      const scriptToken = script.getAttribute('extensionAuthToken')
      const scriptPublicKey = script.getAttribute('publicKey')
      const scriptInternalId = script.getAttribute('internalId')
      
      console.log('🔍 Script tag attributes:', {
        hasToken: !!scriptToken,
        tokenMatch: scriptToken === extensionAuthToken,
        tokenPreview: scriptToken ? scriptToken.substring(0, 10) + '...' : 'none',
        publicKeyPreview: scriptPublicKey ? scriptPublicKey.substring(0, 10) + '...' : 'none',
        internalId: scriptInternalId,
        envPublicKey: process.env.NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY ? 
          process.env.NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY.substring(0, 10) + '...' : 'none'
      })
      
      if (scriptToken !== extensionAuthToken) {
        console.warn('⚠️ MISMATCH: Script tag token differs from context token!')
      }
    } else {
      console.error('❌ Script tag not found! Extension cannot work without it.')
    }
    setError(null)
    setLoading(true)

    // Try to refresh the extension token if we don't have one
    if (!extensionAuthToken) {
      console.log('🔄 No extension auth token available, attempting refresh...')
      try {
        await refreshExtensionToken()
        console.log('✅ Extension token refresh completed')
      } catch (refreshError) {
        console.warn('⚠️ Extension token refresh failed:', refreshError)
        // Continue anyway - we can still try to link without the token
      }
    }

    try {
      // Step 1: Generate context ID (cid) from SharpSports API
      const response = await fetch('/api/sharpsports/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          extensionAuthToken: extensionAuthToken,
          extensionVersion: extensionVersion,
          // Let the server determine the correct redirect URL
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate context: ${response.status}`)
      }

      const result = await response.json()
      
      // Check for extension errors
      if (handleExtensionError(result)) {
        return
      }
      
      const { contextId, fallback } = result
      console.log('✅ Generated SharpSports context ID:', contextId)

      // Step 2: Use the correct SharpSports UI URL format
      let booklinkUrl
      if (fallback) {
        // Use direct Booklink URL pattern for fallback
        console.log('🔄 Using fallback Booklink URL approach')
        // Force localhost for development, use actual origin for production
        const isLocalhost =
          window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok')
        const redirectUrl = isLocalhost
          ? 'http://localhost:3007/api/sharpsports/accounts'
          : `${window.location.origin}/api/sharpsports/accounts`

        booklinkUrl = `https://booklink.sharpsports.io?userId=${effectiveUserId}&callback=${encodeURIComponent(`${redirectUrl}?userId=${effectiveUserId}`)}`
      } else {
        // Use standard context-based URL
        booklinkUrl = `https://ui.sharpsports.io/link/${contextId}`
      }

      console.log('📋 Opening Booklink UI:', booklinkUrl)

      const popup = window.open(
        booklinkUrl,
        'sharpsports-booklink',
        'width=700,height=800,scrollbars=yes,resizable=yes,location=yes'
      )

      if (!popup) {
        setError('Popup blocked. Please allow popups for this site and try again.')
        return
      }

      // Enhanced popup monitoring
      let popupCheckAttempts = 0
      const maxAttempts = 600 // 10 minutes

      const checkClosed = setInterval(() => {
        popupCheckAttempts++

        try {
          // Try to access popup properties to see if it's still valid
          if (popup.closed) {
            clearInterval(checkClosed)
            console.log('📝 Booklink popup closed, refreshing accounts')
            // Reload accounts after linking
            setTimeout(() => {
              loadLinkedAccounts()
            }, 1000)
            return
          }

          // Check if popup navigated to an error page
          try {
            const popupUrl = popup.location.href
            if (popupUrl.includes('error') || popupUrl.includes('404')) {
              console.log('❌ Booklink popup encountered an error:', popupUrl)
              popup.close()
              setError('SharpSports Booklink encountered an error. Please check the configuration.')
              clearInterval(checkClosed)
              return
            }
          } catch {
            // Cross-origin restrictions prevent reading popup URL - this is normal
          }
        } catch (error) {
          // Popup might be closed or inaccessible
          console.log('Popup check error:', error)
        }

        // Cleanup after max attempts
        if (popupCheckAttempts >= maxAttempts) {
          clearInterval(checkClosed)
          console.log('📝 Popup monitor timeout reached')
        }
      }, 1000)
    } catch (error) {
      console.error('Error generating SharpSports context:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate SharpSports context')
    } finally {
      setLoading(false)
    }
  }, [effectiveUserId, loadLinkedAccounts, extensionAuthToken, extensionVersion, refreshExtensionToken, handleExtensionError, isExtensionAvailable])

  const handleRefreshAccounts = async () => {
    if (!effectiveUserId) return

    try {
      console.log('🔄 Refreshing SharpSports accounts')
      console.log('🔍 Extension data being sent to refresh:', { 
        hasToken: !!extensionAuthToken, 
        tokenPreview: extensionAuthToken ? extensionAuthToken.substring(0, 10) + '...' : 'none',
        version: extensionVersion,
      })
      setRefreshing(true)
      setError(null)

      const response = await fetch('/api/sharpsports/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: effectiveUserId,
          extensionAuthToken: extensionAuthToken,
          extensionVersion: extensionVersion,
        }),
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Check for extension errors
      if (handleExtensionError(data)) {
        return
      }
      
      console.log('✅ Refresh initiated:', data.message)

      // Show success message with details
      if (data.refreshed > 0) {
        setError(null)
        // Note: The actual bet sync happens via webhook, so we just show that refresh was initiated
        console.log(
          `🎉 Refresh initiated for ${data.refreshed} accounts. Bets will sync automatically when ready.`
        )
      } else {
        setError('No accounts were refreshed. Please check your linked accounts.')
      }
    } catch (error) {
      console.error('Error refreshing accounts:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh accounts')
    } finally {
      setRefreshing(false)
    }
  }

  const handleManualSync = async () => {
    if (!effectiveUserId) return

    try {
      console.log('🔄 Manually syncing SharpSports bets')
      setSyncing(true)
      setError(null)

      const response = await fetch('/api/sharpsports/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: effectiveUserId,
          extensionAuthToken: extensionAuthToken,
          extensionVersion: extensionVersion,
        }),
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Check for extension errors
      if (handleExtensionError(data)) {
        return
      }
      
      console.log('✅ Manual sync completed:', data.message)

      if (data.totalBetsProcessed > 0) {
        console.log(`🎉 Successfully processed ${data.totalBetsProcessed} bets`)
      }
    } catch (error) {
      console.error('Error syncing bets:', error)
      setError(error instanceof Error ? error.message : 'Failed to sync bets')
    } finally {
      setSyncing(false)
    }
  }

  const linkedAccountsCount = accounts.length
  const verifiedAccountsCount = accounts.filter(acc => acc.verified && acc.access).length

  return (
    <>
      <ExtensionDebugCard />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            SharpSports Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Account Status */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div>
            <p className="text-sm font-medium">Linked Accounts</p>
            <p className="text-xs text-gray-600">
              {verifiedAccountsCount} of {linkedAccountsCount} verified and active
            </p>
          </div>
          {verifiedAccountsCount > 0 && (
            <div className="flex items-center text-green-600">
              <Check className="mr-1 h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
          )}
        </div>

        {/* Extension Status */}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <div>
            <p className="text-sm font-medium">Browser Extension</p>
            <p className="text-xs text-gray-600">
              {isExtensionAvailable 
                ? `Version: ${extensionVersion || 'Detected'}` 
                : 'Not detected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isExtensionAvailable ? (
              <div className="flex items-center text-green-600">
                <Check className="mr-1 h-4 w-4" />
                <span className="text-sm">Active</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span className="text-sm">Missing</span>
              </div>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={refreshExtensionToken}
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-2"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Linked Accounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm">Loading accounts...</span>
          </div>
        ) : accounts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Connected Sportsbooks:</p>
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.book_name}</span>
                  <span className="text-xs text-gray-500">({account.book_abbr})</span>
                  {account.region_name && (
                    <span className="text-xs text-gray-500">- {account.region_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {account.verified && account.access ? (
                    <span className="flex items-center text-xs text-green-600">
                      <Check className="mr-1 h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-yellow-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {!account.verified ? 'Unverified' : 'No Access'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No sportsbook accounts linked yet.</p>
        )}

        {/* Extension Update Required */}
        {extensionUpdateRequired && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-2">Extension Update Required</h4>
                <p className="text-sm text-orange-800 mb-3">
                  Your SharpSports browser extension needs to be updated to continue linking SDK-required sportsbooks.
                </p>
                <Button
                  onClick={handleInstallExtension}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Update Extension
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !extensionUpdateRequired && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleLinkSportsbooks}
            disabled={loading}
            className="flex-1"
            variant="outline"
          >
            <Link className="mr-2 h-4 w-4" />
            Link Sportsbooks
          </Button>

          <Button
            onClick={handleRefreshAccounts}
            disabled={refreshing || verifiedAccountsCount === 0}
            className="flex-1"
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Accounts
          </Button>
        </div>

        {/* Development/Testing Buttons */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2">
            <Button
              onClick={handleManualSync}
              disabled={syncing || verifiedAccountsCount === 0}
              className="w-full"
              variant="secondary"
              size="sm"
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Manual Sync (Dev)
            </Button>

            <div className="space-y-1 text-xs">
              <p className="font-medium">Test different Booklink URLs:</p>
              <button
                className="block text-xs text-blue-600 hover:underline"
                onClick={() =>
                  window.open(
                    `https://sandbox-booklink.sharpsports.io?userId=${effectiveUserId}&callback=${encodeURIComponent(`${window.location.origin}/api/sharpsports/accounts`)}`
                  )
                }
              >
                1. sandbox-booklink.sharpsports.io
              </button>
              <button
                className="block text-xs text-blue-600 hover:underline"
                onClick={() =>
                  window.open(
                    `https://booklink.sharpsports.io?userId=${effectiveUserId}&callback=${encodeURIComponent(`${window.location.origin}/api/sharpsports/accounts`)}`
                  )
                }
              >
                2. booklink.sharpsports.io (prod)
              </button>
              <button
                className="block text-xs text-blue-600 hover:underline"
                onClick={() =>
                  window.open(
                    `https://app.sharpsports.io/booklink?userId=${effectiveUserId}&callback=${encodeURIComponent(`${window.location.origin}/api/sharpsports/accounts`)}`
                  )
                }
              >
                3. app.sharpsports.io/booklink
              </button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>• Link your sportsbook accounts to automatically sync your bets</p>
          <p>• Refresh accounts to check for new bets from your linked sportsbooks</p>
          <p>• Bets are automatically synced when accounts are refreshed</p>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
