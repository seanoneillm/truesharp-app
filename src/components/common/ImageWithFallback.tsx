'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  fallbackSrc: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  onError?: () => void
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  className,
  fill,
  sizes,
  priority,
  onError
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const imageSrc = imageError ? fallbackSrc : src

  return (
    <div className={`relative ${className || ''}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded-lg ${fill ? '' : `w-[${width}px] h-[${height}px]`}`} />
      )}
      
      {/* Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {/* Error state indicator */}
      {imageError && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          Using fallback
        </div>
      )}
    </div>
  )
}