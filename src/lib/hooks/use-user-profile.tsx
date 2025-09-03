'use client'

import { useState } from 'react'

export function useUserProfile() {
  const [loading] = useState(false)
  const [profile, setProfile] = useState(null)

  return { profile, loading, setProfile }
}
