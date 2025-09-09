'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSharpSportsExtension } from '@/lib/contexts/sharpsports-extension'
import { AlertCircle, Check, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

export function ExtensionDebugCard() {
  const { 
    extensionAuthToken, 
    extensionVersion, 
    isExtensionAvailable, 
    isExtensionUpdateRequired,
    extensionDownloadUrl,
    refreshExtensionToken,
    forceCheckExtension,
    error,
    loading
  } = useSharpSportsExtension()
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Force check extension detection first
      forceCheckExtension()
      // Then refresh the auth token
      await refreshExtensionToken()
    } catch (err) {
      console.error('Debug refresh failed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getScriptTagStatus = () => {
    const script = document.getElementById('sharpsports-extension-script')
    if (!script) return { status: 'Missing', details: {} }
    
    const token = script.getAttribute('extensionAuthToken')
    const publicKey = script.getAttribute('publicKey')
    const internalId = script.getAttribute('internalId')
    const src = script.getAttribute('src')
    
    return {
      status: 'Present',
      details: {
        token: token ? `${token.substring(0, 10)}...` : 'Missing',
        publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'Missing',
        internalId: internalId || 'Missing',
        src: src || 'Missing',
        hasToken: !!token,
        hasPublicKey: !!publicKey,
        hasInternalId: !!internalId
      }
    }
  }

  const getExtensionGlobals = () => {
    if (typeof window === 'undefined') return 'N/A'
    
    const globals = []
    if ((window as any).sharpSports) globals.push('sharpSports')
    if ((window as any).SharpSports) globals.push('SharpSports')
    if ((window as any).sharpsports_extension) globals.push('sharpsports_extension')
    
    return globals.length > 0 ? globals.join(', ') : 'None'
  }

  const checkSessionStorage = () => {
    if (typeof window === 'undefined') return 'N/A'
    
    const version = sessionStorage.getItem('sharpSportsExtensionVersion')
    return version || 'None'
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
          🔍 Extension Debug Info
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
          >
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-blue-900 mb-2">Extension Detection:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isExtensionAvailable ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
                <span>Available: {isExtensionAvailable ? 'Yes' : 'No'}</span>
              </div>
              <div>Version: {extensionVersion || 'None'}</div>
              <div>SessionStorage: {checkSessionStorage()}</div>
              <div>Window Globals: {getExtensionGlobals()}</div>
            </div>
          </div>
          
          <div>
            <p className="font-medium text-blue-900 mb-2">Auth Token:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {extensionAuthToken ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
                <span>Token: {extensionAuthToken ? 'Present' : 'Missing'}</span>
              </div>
              {extensionAuthToken && (
                <div>Preview: {extensionAuthToken.substring(0, 10)}...</div>
              )}
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              {error && (
                <div className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-600">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <p className="font-medium text-blue-900 mb-2">Script Tag Status:</p>
          <div className="space-y-1">
            {(() => {
              const scriptStatus = getScriptTagStatus()
              if (scriptStatus.status === 'Missing') {
                return <div className="text-red-600">❌ Script tag not found</div>
              }
              return (
                <>
                  <div>Status: ✅ {scriptStatus.status}</div>
                  <div>Token: {scriptStatus.details.hasToken ? '✅' : '❌'} {scriptStatus.details.token}</div>
                  <div>Public Key: {scriptStatus.details.hasPublicKey ? '✅' : '❌'} {scriptStatus.details.publicKey}</div>
                  <div>Internal ID: {scriptStatus.details.hasInternalId ? '✅' : '❌'} {scriptStatus.details.internalId}</div>
                  <div className="text-xs text-gray-600">CDN: {scriptStatus.details.src}</div>
                </>
              )
            })()}
          </div>
        </div>
        
        <div>
          <p className="font-medium text-blue-900 mb-2">Environment:</p>
          <div className="space-y-1">
            <div>Public Key: {process.env.NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY ? 'Present' : 'Missing'}</div>
            <div>Update Required: {isExtensionUpdateRequired ? 'Yes' : 'No'}</div>
            {extensionDownloadUrl && (
              <div>Download URL: {extensionDownloadUrl}</div>
            )}
          </div>
        </div>
        
        <div className="pt-2 border-t border-blue-200">
          <p className="font-medium text-blue-900 mb-1">Quick Checks:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {process.env.NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Public Key configured</span>
            </div>
            <div className="flex items-center gap-2">
              {document.getElementById('sharpsports-extension-script') ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Script tag injected</span>
            </div>
            <div className="flex items-center gap-2">
              {extensionAuthToken ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Extension auth token</span>
            </div>
            <div className="flex items-center gap-2">
              {isExtensionAvailable ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>Extension detected</span>
            </div>
          </div>
        </div>

        {/* Warning about common issues */}
        <div className="pt-2 border-t border-orange-200 bg-orange-50 p-2 rounded">
          <p className="font-medium text-orange-900 mb-1 text-xs">⚠️ Common Issues:</p>
          <div className="text-xs text-orange-800 space-y-1">
            <div>• If "Unsupported" popup appears: Check SharpSports Dashboard → Native SDK toggle</div>
            <div>• If `sdkService: ''` in logs: Token/Public Key mismatch or invalid token</div>
            <div>• Extension working but books unsupported: Dashboard settings issue</div>
            <div>• Token missing: Check SHARPSPORTS_API_KEY environment variable</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}