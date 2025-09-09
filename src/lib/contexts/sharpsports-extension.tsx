'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'

interface SharpSportsExtensionContextType {
  extensionAuthToken: string | null
  extensionVersion: string | null
  isExtensionAvailable: boolean
  isExtensionUpdateRequired: boolean
  extensionDownloadUrl: string | null
  refreshExtensionToken: () => Promise<void>
  handleExtensionResponse: (response: any) => void
  clearExtensionUpdate: () => void
  forceCheckExtension: () => void
  error: string | null
  loading: boolean
}

const SharpSportsExtensionContext = createContext<SharpSportsExtensionContextType | undefined>(undefined)

interface SharpSportsExtensionProviderProps {
  children: React.ReactNode
}

export function SharpSportsExtensionProvider({ children }: SharpSportsExtensionProviderProps) {
  const { user } = useAuth()
  const [extensionAuthToken, setExtensionAuthToken] = useState<string | null>(null)
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null)
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false)
  const [isExtensionUpdateRequired, setIsExtensionUpdateRequired] = useState(false)
  const [extensionDownloadUrl, setExtensionDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for extension version in sessionStorage with polling for better detection
  const checkExtensionVersion = useCallback(() => {
    const version = sessionStorage.getItem('sharpSportsExtensionVersion')
    setExtensionVersion(version)
    setIsExtensionAvailable(!!version)
    
    // Also check if the extension has set any global indicators
    // SharpSports extensions often set window properties
    if (!version && typeof window !== 'undefined') {
      // Check for common SharpSports extension indicators
      const hasSharpSportsGlobal = !!(window as any).sharpSports || 
                                  !!(window as any).SharpSports || 
                                  !!(window as any).sharpsports_extension
      if (hasSharpSportsGlobal) {
        setIsExtensionAvailable(true)
      }
    }
    
    console.log('🔍 Extension check:', { version, available: !!version })
  }, [])

  useEffect(() => {

    checkExtensionVersion()

    // Poll for extension changes every 2 seconds to catch new installations
    const pollInterval = setInterval(checkExtensionVersion, 2000)

    // Listen for storage changes to detect extension updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sharpSportsExtensionVersion') {
        console.log('📦 Extension version updated:', e.newValue)
        setExtensionVersion(e.newValue)
        setIsExtensionAvailable(!!e.newValue)
        
        // Clear any extension update requirements when extension is detected
        if (e.newValue) {
          setIsExtensionUpdateRequired(false)
          setExtensionDownloadUrl(null)
        }
      }
    }
    
    // Listen for focus events to check extension when user comes back to tab
    const handleFocus = () => {
      setTimeout(checkExtensionVersion, 500) // Small delay to ensure extension has loaded
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkExtensionVersion])

  // Fetch extension auth token
  const refreshExtensionToken = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔑 Fetching SharpSports extension auth token')
      
      const response = await fetch('/api/sharpsports/extension-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setExtensionAuthToken(data.extensionAuthToken)
      
      if (data.extensionAuthToken) {
        console.log('✅ Extension auth token refreshed')
      } else {
        console.log('⚠️ Extension auth token not available:', data.note || 'Unknown reason')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch extension auth token'
      console.error('❌ Extension auth token error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch token on user login
  useEffect(() => {
    if (user?.id) {
      refreshExtensionToken()
    }
  }, [user?.id, refreshExtensionToken])

  // Handle extension update requirements
  const handleExtensionResponse = useCallback((response: any) => {
    if (response?.extensionUpdateRequired) {
      setIsExtensionUpdateRequired(true)
      setExtensionDownloadUrl(response.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports')
    } else {
      setIsExtensionUpdateRequired(false)
      setExtensionDownloadUrl(null)
    }
  }, [])

  // Clear extension update state
  const clearExtensionUpdate = useCallback(() => {
    setIsExtensionUpdateRequired(false)
    setExtensionDownloadUrl(null)
  }, [])

  // Force check extension (for debugging)
  const forceCheckExtension = useCallback(() => {
    console.log('🔄 Force checking extension...')
    checkExtensionVersion()
  }, [checkExtensionVersion])

  const value: SharpSportsExtensionContextType = {
    extensionAuthToken,
    extensionVersion,
    isExtensionAvailable,
    isExtensionUpdateRequired,
    extensionDownloadUrl,
    refreshExtensionToken,
    handleExtensionResponse,
    clearExtensionUpdate,
    forceCheckExtension,
    error,
    loading,
  }

  return (
    <SharpSportsExtensionContext.Provider value={value}>
      {children}
    </SharpSportsExtensionContext.Provider>
  )
}

export function useSharpSportsExtension() {
  const context = useContext(SharpSportsExtensionContext)
  if (context === undefined) {
    throw new Error('useSharpSportsExtension must be used within a SharpSportsExtensionProvider')
  }
  return context
}