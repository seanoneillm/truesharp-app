'use client'

import { useState } from 'react'

export function useSellerSetup() {
  const [loading, setLoading] = useState(false)

  return { loading }
}
