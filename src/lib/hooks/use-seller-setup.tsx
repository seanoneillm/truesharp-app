'use client'

import { useState } from 'react'

export function useSellerSetup() {
  const [loading] = useState(false)

  return { loading }
}
