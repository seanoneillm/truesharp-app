'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSharpSportsExtension } from '@/lib/contexts/sharpsports-extension'
import { Download, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export function ExtensionUpdateModal() {
  const { 
    isExtensionUpdateRequired, 
    extensionDownloadUrl, 
    clearExtensionUpdate 
  } = useSharpSportsExtension()
  
  const [isDismissed, setIsDismissed] = useState(false)

  const isOpen = isExtensionUpdateRequired && !isDismissed

  const handleInstallExtension = () => {
    if (extensionDownloadUrl) {
      window.open(extensionDownloadUrl, '_blank')
    } else {
      // Fallback to Chrome Web Store search
      window.open('https://chrome.google.com/webstore/search/sharpsports', '_blank')
    }
    
    // Clear the extension update state
    clearExtensionUpdate()
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (isExtensionUpdateRequired) {
      clearExtensionUpdate()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {isExtensionUpdateRequired ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Extension Update Required
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 text-blue-500" />
                  Install SharpSports Extension
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {isExtensionUpdateRequired ? (
              <>
                Your SharpSports browser extension needs to be updated to continue linking 
                SDK-required sportsbooks. Please install the latest version.
              </>
            ) : (
              <>
                To link certain sportsbooks that require SDK integration, you need to install 
                the SharpSports browser extension. This enables secure connection to additional 
                sportsbook platforms.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <h4 className="font-medium text-blue-900 mb-1">What this enables:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Access to more sportsbook platforms</li>
              <li>• Secure authentication for SDK-required books</li>
              <li>• Automatic bet syncing from additional sources</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
            <Button onClick={handleInstallExtension} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {isExtensionUpdateRequired ? 'Update Extension' : 'Install Extension'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}