'use client'

import { useEffect, useState } from 'react'

const DISCLAIMER_KEY = 'truesharp_compliance_disclaimer_dismissed'

export function useComplianceDisclaimer() {
  const [shouldShowDisclaimer, setShouldShowDisclaimer] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Check if disclaimer has been dismissed in this session
    const dismissed = sessionStorage.getItem(DISCLAIMER_KEY)
    
    if (!dismissed) {
      setShouldShowDisclaimer(true)
    }
  }, [])

  const dismissDisclaimer = () => {
    if (isClient) {
      sessionStorage.setItem(DISCLAIMER_KEY, 'true')
    }
    setShouldShowDisclaimer(false)
  }

  return {
    shouldShowDisclaimer,
    dismissDisclaimer,
    isClient
  }
}