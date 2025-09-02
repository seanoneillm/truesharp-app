'use client'

import { getSellerProfileUrl, searchSellers, SellerSearchResult } from '@/lib/search/seller-search'
import { cn } from '@/lib/utils'
import { Search, Shield, User } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchBarProps {
  className?: string
  placeholder?: string
}

export function SearchBar({ className, placeholder = 'Search sellers...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SellerSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle search query changes
  useEffect(() => {
    const searchSellersDebounced = async () => {
      if (!query.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await searchSellers(query)
        setResults(searchResults)
        setIsOpen(searchResults.length > 0)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchSellersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSellerClick = (seller: SellerSearchResult) => {
    router.push(getSellerProfileUrl(seller.username))
    setIsOpen(false)
    setQuery('')
  }

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={searchRef} className={cn('relative max-w-2xl flex-1', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm',
            'placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'transition-all duration-200'
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/5">
          <div className="py-2">
            {results.length === 0 && query.trim() && !isLoading ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500">
                No sellers found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              results.map(seller => (
                <button
                  key={seller.id}
                  onClick={() => handleSellerClick(seller)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  {/* Profile Picture */}
                  <div className="relative">
                    {seller.profilePictureUrl ? (
                      <Image
                        src={seller.profilePictureUrl}
                        alt={seller.username}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}

                    {/* Verification Badge */}
                    {seller.isVerifiedSeller && (
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Seller Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-gray-900">@{seller.username}</span>
                      {seller.isVerifiedSeller && <Shield className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    {seller.displayName && (
                      <div className="truncate text-sm text-gray-500">{seller.displayName}</div>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>{seller.subscriberCount} subscribers</span>
                      {seller.performanceRoi && (
                        <span
                          className={cn(
                            'font-medium',
                            seller.performanceRoi > 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {seller.performanceRoi > 0 ? '+' : ''}
                          {seller.performanceRoi}% ROI
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
