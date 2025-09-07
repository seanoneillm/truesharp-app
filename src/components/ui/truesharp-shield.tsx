import React from 'react'

interface TrueSharpShieldProps {
  className?: string
  variant?: 'default' | 'light'
}

export const TrueSharpShield: React.FC<TrueSharpShieldProps> = ({
  className = 'h-6 w-6',
  variant = 'default',
}) => {
  // Generate unique gradient ID to avoid conflicts in html2canvas
  const gradientId = `shieldGradient-${variant}-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
          <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
        </linearGradient>
      </defs>
      <path
        d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
        fill={`url(#${gradientId})`}
        stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
        strokeWidth="2"
      />
      <path
        d="M35 45 L45 55 L65 35"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
