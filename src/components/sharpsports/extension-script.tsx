'use client'

import { useSharpSportsExtension } from '@/lib/contexts/sharpsports-extension'
import { useEffect } from 'react'

interface ExtensionScriptProps {
  internalId?: string
}

export function SharpSportsExtensionScript({ internalId = 'truesharp-app' }: ExtensionScriptProps) {
  const { extensionAuthToken, loading, error } = useSharpSportsExtension()

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY
    if (!publicKey) {
      console.warn('⚠️ NEXT_PUBLIC_SHARPSPORTS_PUBLIC_KEY not found - extension script will not load')
      return
    }

    // Don't inject script while loading or if there's an error
    if (loading) {
      console.log('⏳ Waiting for extension auth token...')
      return
    }

    // If we have an error getting the token, we can still inject the script without it
    // This allows the extension to work in basic mode
    if (error && !extensionAuthToken) {
      console.warn('⚠️ Extension auth token error, injecting script without token:', error)
    }

    // Check if script already exists
    const existingScript = document.getElementById('sharpsports-extension-script')
    if (existingScript) {
      console.log('🔄 Updating existing SharpSports extension script')
      if (extensionAuthToken) {
        existingScript.setAttribute('extensionAuthToken', extensionAuthToken)
        console.log('✅ Updated script with extension auth token')
      } else {
        console.log('⚠️ Updated script without extension auth token (may limit SDK features)')
      }
      return
    }

    console.log('📝 Injecting SharpSports extension script', {
      internalId,
      publicKey: publicKey.substring(0, 10) + '...',
      hasToken: !!extensionAuthToken,
    })

    // Create and inject the script
    const script = document.createElement('script')
    script.id = 'sharpsports-extension-script'
    script.src = 'https://d1vhnbpkpweicq.cloudfront.net/extension-cdn.js'
    script.setAttribute('internalId', internalId)
    script.setAttribute('publicKey', publicKey)
    
    // Only add extensionAuthToken if we have a valid one
    if (extensionAuthToken) {
      script.setAttribute('extensionAuthToken', extensionAuthToken)
      console.log('🔑 Script injected with extension auth token')
    } else {
      console.log('⚠️ Script injected WITHOUT extension auth token - SDK features may be limited')
    }

    // Add error handling
    script.onerror = (error) => {
      console.error('❌ Failed to load SharpSports extension script:', error)
    }

    script.onload = () => {
      console.log('✅ SharpSports extension script loaded successfully')
      
      // Give the extension some time to initialize and set its version
      setTimeout(() => {
        const version = sessionStorage.getItem('sharpSportsExtensionVersion')
        if (version) {
          console.log('🎉 Extension detected after script load:', version)
        } else {
          console.log('⚠️ Extension script loaded but version not detected yet')
        }
      }, 1000)
    }

    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById('sharpsports-extension-script')
      if (scriptToRemove) {
        console.log('🧹 Cleaning up SharpSports extension script')
        scriptToRemove.remove()
      }
    }
  }, [extensionAuthToken, loading, error, internalId])

  return null // This component doesn't render anything visible
}